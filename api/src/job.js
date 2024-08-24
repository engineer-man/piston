const logplease = require('logplease');
const { v4: uuidv4 } = require('uuid');
const cp = require('child_process');
const path = require('path');
const config = require('./config');
const fs = require('fs/promises');

const job_states = {
    READY: Symbol('Ready to be primed'),
    PRIMED: Symbol('Primed and ready for execution'),
    EXECUTED: Symbol('Executed and ready for cleanup'),
};

const MAX_BOX_ID = 999;
const ISOLATE_PATH = '/usr/local/bin/isolate';
let box_id = 0;

let remaining_job_spaces = config.max_concurrent_jobs;
let job_queue = [];

const get_next_box_id = () => (box_id + 1) % MAX_BOX_ID;

class Job {
    #box_id;
    #metadata_file_path;
    #box_dir;

    constructor({ runtime, files, args, stdin, timeouts, memory_limits }) {
        this.uuid = uuidv4();

        this.logger = logplease.create(`job/${this.uuid}`);

        this.runtime = runtime;
        this.files = files.map((file, i) => ({
            name: file.name || `file${i}.code`,
            content: file.content,
            encoding: ['base64', 'hex', 'utf8'].includes(file.encoding)
                ? file.encoding
                : 'utf8',
        }));

        this.args = args;
        this.stdin = stdin;
        // Add a trailing newline if it doesn't exist
        if (this.stdin.slice(-1) !== '\n') {
            this.stdin += '\n';
        }

        this.timeouts = timeouts;
        this.memory_limits = memory_limits;

        this.state = job_states.READY;
    }

    async prime() {
        if (remaining_job_spaces < 1) {
            this.logger.info(`Awaiting job slot`);
            await new Promise(resolve => {
                job_queue.push(resolve);
            });
        }
        this.logger.info(`Priming job`);
        remaining_job_spaces--;
        this.logger.debug('Running isolate --init');
        this.#box_id = get_next_box_id();
        this.#metadata_file_path = `/tmp/${this.#box_id}-metadata.txt`;
        await new Promise((res, rej) => {
            cp.exec(
                `isolate --init --cg -b${this.#box_id}`,
                (error, stdout, stderr) => {
                    if (error) {
                        rej(
                            `Failed to run isolate --init: ${error.message}\nstdout: ${stdout}\nstderr: ${stderr}`
                        );
                    }
                    if (stdout === '') {
                        rej('Received empty stdout from isolate --init');
                    }
                    this.#box_dir = stdout;
                    res();
                }
            );
        });

        this.logger.debug(`Creating submission files in Isolate box`);

        await fs.mkdir(path.join(this.#box_dir, 'submission'));
        for (const file of this.files) {
            const file_path = path.join(box_dir, file.name);
            const rel = path.relative(box_dir, file_path);

            if (rel.startsWith('..'))
                throw Error(
                    `File path "${file.name}" tries to escape parent directory: ${rel}`
                );

            const file_content = Buffer.from(file.content, file.encoding);

            await fs.mkdir(path.dirname(file_path), {
                recursive: true,
                mode: 0o700,
            });
            await fs.write_file(file_path, file_content);
        }

        this.state = job_states.PRIMED;

        this.logger.debug('Primed job');
    }

    async safe_call(file, args, timeout, memory_limit, event_bus = null) {
        var stdout = '';
        var stderr = '';
        var output = '';

        const proc = cp.spawn(
            ISOLATE_PATH,
            [
                '--run',
                `-b${this.#box_id}`,
                `--meta=${this.#metadata_file_path}`,
                '--cg',
                '-s',
                '-c',
                '/box/submission',
                '-e',
                `--dir=/runtime=${this.runtime.pkgdir}`,
                `--processes=${this.runtime.max_process_count}`,
                `--open-files=${this.runtime.max_open_files}`,
                `--fsize=${this.runtime.max_file_size}`,
                `--time=${timeout}`,
                `--extra-time=0`,
                ...(memory_limit >= 0 ? [`--cg-mem=${memory_limit}`] : []),
                ...(config.disable_networking ? [] : '--share-net'),
                '--',
                file,
                ...args,
            ],
            {
                env: {
                    ...this.runtime.env_vars,
                    PISTON_LANGUAGE: this.runtime.language,
                },
                stdio: 'pipe',
            }
        );

        if (event_bus === null) {
            proc.stdin.write(this.stdin);
            proc.stdin.end();
            proc.stdin.destroy();
        } else {
            event_bus.on('stdin', data => {
                proc.stdin.write(data);
            });

            event_bus.on('kill', signal => {
                proc.kill(signal);
            });
        }

        proc.stderr.on('data', async data => {
            if (event_bus !== null) {
                event_bus.emit('stderr', data);
            } else if (
                stderr.length + data.length >
                this.runtime.output_max_size
            ) {
                this.logger.info(`stderr length exceeded`);
                try {
                    process.kill(proc.pid, 'SIGABRT');
                } catch (e) {
                    // Could already be dead and just needs to be waited on
                    this.logger.debug(
                        `Got error while SIGABRTing process ${proc}:`,
                        e
                    );
                }
            } else {
                stderr += data;
                output += data;
            }
        });

        proc.stdout.on('data', async data => {
            if (event_bus !== null) {
                event_bus.emit('stdout', data);
            } else if (
                stdout.length + data.length >
                this.runtime.output_max_size
            ) {
                this.logger.info(`stdout length exceeded`);
                try {
                    process.kill(proc.pid, 'SIGABRT');
                } catch (e) {
                    // Could already be dead and just needs to be waited on
                    this.logger.debug(
                        `Got error while SIGABRTing process ${proc}:`,
                        e
                    );
                }
            } else {
                stdout += data;
                output += data;
            }
        });

        let memory = null;
        let code = null;
        let signal = null;
        let message = null;
        let status = null;
        let time = null;

        try {
            const metadata_str = await fs.readFile(
                self.metadata_file_path,
                'utf-8'
            );
            const metadata_lines = metadata_str.split('\n');
            for (const line of metadata_lines) {
                if (!line) continue;

                const [key, value] = line.split(':');
                if (key === undefined || value === undefined) {
                    throw new Error(
                        `Failed to parse metadata file, received: ${line}`
                    );
                }
                switch (key) {
                    case 'cg-mem':
                        memory =
                            parseInt(value) ||
                            (() => {
                                throw new Error(
                                    `Failed to parse memory usage, received value: ${value}`
                                );
                            })();
                        break;
                    case 'exitcode':
                        code =
                            parseInt(value) ||
                            (() => {
                                throw new Error(
                                    `Failed to parse exit code, received value: ${value}`
                                );
                            })();
                        break;
                    case 'exitsig':
                        signal =
                            parseInt(value) ||
                            (() => {
                                throw new Error(
                                    `Failed to parse exit signal, received value: ${value}`
                                );
                            })();
                        break;
                    case 'message':
                        message = value;
                        break;
                    case 'status':
                        status = value;
                        break;
                    case 'time':
                        time =
                            parseFloat(value) ||
                            (() => {
                                throw new Error(
                                    `Failed to parse cpu time, received value: ${value}`
                                );
                            })();
                        break;
                    default:
                        break;
                }
            }
        } catch (e) {
            throw new Error(
                `Error reading metadata file: ${self.metadata_file_path}\nError: ${e.message}\nIsolate run stdout: ${stdout}\nIsolate run stderr: ${stderr}`
            );
        }

        proc.on('close', () => {
            resolve({
                stdout,
                stderr,
                code,
                signal,
                output,
                memory,
                message,
                status,
                time,
            });
        });

        proc.on('error', err => {
            reject({
                error: err,
                stdout,
                stderr,
                code,
                signal,
                output,
                memory,
                message,
                status,
                time,
            });
        });
    }

    async execute(event_bus = null) {
        if (this.state !== job_states.PRIMED) {
            throw new Error(
                'Job must be in primed state, current state: ' +
                    this.state.toString()
            );
        }

        this.logger.info(`Executing job runtime=${this.runtime.toString()}`);

        const code_files =
            (this.runtime.language === 'file' && this.files) ||
            this.files.filter(file => file.encoding == 'utf8');

        this.logger.debug('Compiling');

        let compile;
        let compile_errored = false;
        const { emit_event_bus_result, emit_event_bus_stage } =
            event_bus === null
                ? {
                      emit_event_bus_result: () => {},
                      emit_event_bus_stage: () => {},
                  }
                : {
                      emit_event_bus_result: (stage, result) => {
                          const { error, code, signal } = result;
                          event_bus.emit('exit', stage, {
                              error,
                              code,
                              signal,
                          });
                      },
                      emit_event_bus_stage: stage => {
                          event_bus.emit('stage', stage);
                      },
                  };

        if (this.runtime.compiled) {
            this.logger.debug('Compiling');
            emit_event_bus_stage('compile');
            compile = await this.safe_call(
                '/runtime/compile',
                code_files.map(x => x.name),
                this.timeouts.compile,
                this.memory_limits.compile,
                event_bus
            );
            emit_event_bus_result('compile', compile);
            compile_errored = compile.code !== 0;
        }

        let run;
        if (!compile_errored) {
            this.logger.debug('Running');
            emit_event_bus_stage('run');
            run = await this.safe_call(
                '/runtime/run',
                [code_files[0].name, ...this.args],
                this.timeouts.run,
                this.memory_limits.run,
                event_bus
            );
            emit_event_bus_result('run', run);
        }

        this.state = job_states.EXECUTED;

        return {
            compile,
            run,
            language: this.runtime.language,
            version: this.runtime.version.raw,
        };
    }

    async cleanup() {
        this.logger.info(`Cleaning up job`);

        await fs.rm(`${this.#metadata_file_path}`);
        remaining_job_spaces++;
        if (job_queue.length > 0) {
            job_queue.shift()();
        }
    }
}

module.exports = {
    Job,
};
