const logplease = require('logplease');
const logger = logplease.create('job');
const { v4: uuidv4 } = require('uuid');
const cp = require('child_process');
const path = require('path');
const config = require('./config');
const globals = require('./globals');
const fs = require('fs/promises');
const fss = require('fs');
const wait_pid = require('waitpid');

const job_states = {
    READY: Symbol('Ready to be primed'),
    PRIMED: Symbol('Primed and ready for execution'),
    EXECUTED: Symbol('Executed and ready for cleanup'),
};

let uid = 0;
let gid = 0;

let remaining_job_spaces = config.max_concurrent_jobs;
let job_queue = [];

class Job {
    #active_timeouts;
    #active_parent_processes;

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

        this.#active_timeouts = [];
        this.#active_parent_processes = [];

        this.timeouts = timeouts;
        this.memory_limits = memory_limits;

        this.uid = config.runner_uid_min + uid;
        this.gid = config.runner_gid_min + gid;

        uid++;
        gid++;

        uid %= config.runner_uid_max - config.runner_uid_min + 1;
        gid %= config.runner_gid_max - config.runner_gid_min + 1;

        this.logger.debug(`Assigned uid=${this.uid} gid=${this.gid}`);

        this.state = job_states.READY;
        this.dir = path.join(
            config.data_directory,
            globals.data_directories.jobs,
            this.uuid
        );
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
        this.logger.debug('Writing files to job cache');

        this.logger.debug(`Transfering ownership`);

        await fs.mkdir(this.dir, { mode: 0o700 });
        await fs.chown(this.dir, this.uid, this.gid);

        for (const file of this.files) {
            const file_path = path.join(this.dir, file.name);
            const rel = path.relative(this.dir, file_path);
            const file_content = Buffer.from(file.content, file.encoding);

            if (rel.startsWith('..'))
                throw Error(
                    `File path "${file.name}" tries to escape parent directory: ${rel}`
                );

            await fs.mkdir(path.dirname(file_path), {
                recursive: true,
                mode: 0o700,
            });
            await fs.chown(path.dirname(file_path), this.uid, this.gid);

            await fs.write_file(file_path, file_content);
            await fs.chown(file_path, this.uid, this.gid);
        }

        this.state = job_states.PRIMED;

        this.logger.debug('Primed job');
    }

    exit_cleanup() {
        for (const timeout of this.#active_timeouts) {
            clear_timeout(timeout);
        }
        this.#active_timeouts = [];
        this.logger.debug('Cleared the active timeouts');

        this.cleanup_processes();
        this.logger.debug(`Finished exit cleanup`);
    }

    close_cleanup() {
        for (const proc of this.#active_parent_processes) {
            proc.stderr.destroy();
            if (!proc.stdin.destroyed) {
                proc.stdin.end();
                proc.stdin.destroy();
            }
            proc.stdout.destroy();
        }
        this.#active_parent_processes = [];
        this.logger.debug('Destroyed processes writables');
    }

    async safe_call(file, args, timeout, memory_limit, event_bus = null) {
        return new Promise((resolve, reject) => {
            const nonetwork = config.disable_networking ? ['nosocket'] : [];

            const prlimit = [
                'prlimit',
                '--nproc=' + this.runtime.max_process_count,
                '--nofile=' + this.runtime.max_open_files,
                '--fsize=' + this.runtime.max_file_size,
            ];

            const timeout_call = [
                'timeout',
                '-s',
                '9',
                Math.ceil(timeout / 1000),
            ];

            if (memory_limit >= 0) {
                prlimit.push('--as=' + memory_limit);
            }

            const proc_call = [
                'nice',
                ...timeout_call,
                ...prlimit,
                ...nonetwork,
                'bash',
                file,
                ...args,
            ];

            var stdout = '';
            var stderr = '';
            var output = '';

            const proc = cp.spawn(proc_call[0], proc_call.splice(1), {
                env: {
                    ...this.runtime.env_vars,
                    PISTON_LANGUAGE: this.runtime.language,
                },
                stdio: 'pipe',
                cwd: this.dir,
                uid: this.uid,
                gid: this.gid,
                detached: true, //give this process its own process group
            });

            this.#active_parent_processes.push(proc);

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

            const kill_timeout =
                (timeout >= 0 &&
                    set_timeout(async _ => {
                        this.logger.info(`Timeout exceeded timeout=${timeout}`);
                        try {
                            process.kill(proc.pid, 'SIGKILL');
                        }
                        catch (e) {
                            // Could already be dead and just needs to be waited on
                            this.logger.debug(
                                `Got error while SIGKILLing process ${proc}:`,
                                e
                            );
                        }
                    }, timeout)) ||
                null;
            this.#active_timeouts.push(kill_timeout);

            proc.stderr.on('data', async data => {
                if (event_bus !== null) {
                    event_bus.emit('stderr', data);
                } else if (stderr.length > this.runtime.output_max_size) {
                    this.logger.info(`stderr length exceeded`);
                    try {
                        process.kill(proc.pid, 'SIGKILL');
                    }
                    catch (e) {
                        // Could already be dead and just needs to be waited on
                        this.logger.debug(
                            `Got error while SIGKILLing process ${proc}:`,
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
                } else if (stdout.length > this.runtime.output_max_size) {
                    this.logger.info(`stdout length exceeded`);
                    try {
                        process.kill(proc.pid, 'SIGKILL');
                    }
                    catch (e) {
                        // Could already be dead and just needs to be waited on
                        this.logger.debug(
                            `Got error while SIGKILLing process ${proc}:`,
                            e
                        );
                    }
                } else {
                    stdout += data;
                    output += data;
                }
            });

            proc.on('exit', () => this.exit_cleanup());

            proc.on('close', (code, signal) => {
                this.close_cleanup();

                resolve({ stdout, stderr, code, signal, output });
            });

            proc.on('error', err => {
                this.exit_cleanup();
                this.close_cleanup();

                reject({ error: err, stdout, stderr, output });
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
                    emit_event_bus_result: () => { },
                    emit_event_bus_stage: () => { },
                }
                : {
                    emit_event_bus_result: (stage, result, event_bus) => {
                        const { error, code, signal } = result;
                        event_bus.emit('exit', stage, {
                            error,
                            code,
                            signal,
                        });
                    },
                    emit_event_bus_stage: (stage, event_bus) => {
                        event_bus.emit('stage', stage);
                    },
                };

        if (this.runtime.compiled) {
            this.logger.debug('Compiling');
            emit_event_bus_stage('compile', event_bus);
            compile = await this.safe_call(
                path.join(this.runtime.pkgdir, 'compile'),
                code_files.map(x => x.name),
                this.timeouts.compile,
                this.memory_limits.compile,
                event_bus
            );
            emit_event_bus_result('compile', compile, event_bus);
            compile_errored = compile.code !== 0;
        }

        let run;
        if (!compile_errored) {
            this.logger.debug('Running');
            emit_event_bus_stage('run', event_bus);
            run = await this.safe_call(
                path.join(this.runtime.pkgdir, 'run'),
                [code_files[0].name, ...this.args],
                this.timeouts.run,
                this.memory_limits.run,
                event_bus
            );
            emit_event_bus_result('run', run, event_bus);
        }

        this.state = job_states.EXECUTED;

        return {
            compile,
            run,
            language: this.runtime.language,
            version: this.runtime.version.raw,
        };
    }

    cleanup_processes(dont_wait = []) {
        let processes = [1];
        const to_wait = [];
        this.logger.debug(`Cleaning up processes`);

        while (processes.length > 0) {
            processes = [];

            const proc_ids = fss.readdir_sync('/proc');

            processes = proc_ids.map(proc_id => {
                if (isNaN(proc_id)) return -1;
                try {
                    const proc_status = fss.read_file_sync(
                        path.join('/proc', proc_id, 'status')
                    );
                    const proc_lines = proc_status.to_string().split('\n');
                    const state_line = proc_lines.find(line =>
                        line.starts_with('State:')
                    );
                    const uid_line = proc_lines.find(line =>
                        line.starts_with('Uid:')
                    );
                    const [_, ruid, euid, suid, fuid] = uid_line.split(/\s+/);

                    const [_1, state, user_friendly] = state_line.split(/\s+/);

                    const proc_id_int = parse_int(proc_id);

                    // Skip over any processes that aren't ours.
                    if (ruid != this.uid && euid != this.uid) return -1;

                    if (state == 'Z') {
                        // Zombie process, just needs to be waited, regardless of the user id
                        if (!to_wait.includes(proc_id_int))
                            to_wait.push(proc_id_int);

                        return -1;
                    }
                    // We should kill in all other state (Sleep, Stopped & Running)

                    return proc_id_int;
                } catch {
                    return -1;
                }

                return -1;
            });

            processes = processes.filter(p => p > 0);

            if (processes.length > 0)
                this.logger.debug(`Got processes to kill: ${processes}`);

            for (const proc of processes) {
                // First stop the processes, but keep their resources allocated so they cant re-fork
                try {
                    process.kill(proc, 'SIGSTOP');
                } catch (e) {
                    // Could already be dead
                    this.logger.debug(
                        `Got error while SIGSTOPping process ${proc}:`,
                        e
                    );
                }
            }

            for (const proc of processes) {
                // Then clear them out of the process tree
                try {
                    process.kill(proc, 'SIGKILL');
                } catch (e) {
                    // Could already be dead and just needs to be waited on
                    this.logger.debug(
                        `Got error while SIGKILLing process ${proc}:`,
                        e
                    );
                }

                to_wait.push(proc);
            }
        }

        this.logger.debug(
            `Finished kill-loop, calling wait_pid to end any zombie processes`
        );

        for (const proc of to_wait) {
            if (dont_wait.includes(proc)) continue;

            wait_pid(proc);
        }

        this.logger.debug(`Cleaned up processes`);
    }

    async cleanup_filesystem() {
        for (const clean_path of globals.clean_directories) {
            const contents = await fs.readdir(clean_path);

            for (const file of contents) {
                const file_path = path.join(clean_path, file);

                try {
                    const stat = await fs.stat(file_path);

                    if (stat.uid === this.uid) {
                        await fs.rm(file_path, {
                            recursive: true,
                            force: true,
                        });
                    }
                } catch (e) {
                    // File was somehow deleted in the time that we read the dir to when we checked the file
                    this.logger.warn(`Error removing file ${file_path}: ${e}`);
                }
            }
        }

        await fs.rm(this.dir, { recursive: true, force: true });
    }

    async cleanup() {
        this.logger.info(`Cleaning up job`);

        this.exit_cleanup(); // Run process janitor, just incase there are any residual processes somehow
        this.close_cleanup();
        await this.cleanup_filesystem();

        remaining_job_spaces++;
        if (job_queue.length > 0) {
            job_queue.shift()();
        }
    }
}

module.exports = {
    Job,
};
