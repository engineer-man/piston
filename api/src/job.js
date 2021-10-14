const logger = require('logplease').create('job');
const { v4: uuidv4 } = require('uuid');
const cp = require('child_process');
const path = require('path');
const config = require('./config');
const globals = require('./globals');
const fs = require('fs/promises');
const wait_pid = require('waitpid');

const job_states = {
    READY: Symbol('Ready to be primed'),
    PRIMED: Symbol('Primed and ready for execution'),
    EXECUTED: Symbol('Executed and ready for cleanup'),
};

let uid = 0;
let gid = 0;

let remaining_job_spaces = config.max_concurrent_jobs;
let jobQueue = [];

setInterval(() => {
    // Every 10ms try resolve a new job, if there is an available slot
    if (jobQueue.length > 0 && remaining_job_spaces > 0) {
        jobQueue.shift()();
    }
}, 10);

class Job {
    constructor({ runtime, files, args, stdin, timeouts, memory_limits }) {
        this.uuid = uuidv4();
        this.runtime = runtime;
        this.files = files.map((file, i) => ({
            name: file.name || `file${i}.code`,
            content: file.content,
            encoding: ['base64', 'hex', 'utf8'].includes(file.encoding)
                ? file.encoding
                : 'utf8',
        }));
        this.code_files = this.files.filter(file => file.encoding === 'utf8');

        this.args = args;
        this.stdin = stdin;

        this.timeouts = timeouts;
        this.memory_limits = memory_limits;

        this.uid = config.runner_uid_min + uid;
        this.gid = config.runner_gid_min + gid;

        uid++;
        gid++;

        uid %= config.runner_uid_max - config.runner_uid_min + 1;
        gid %= config.runner_gid_max - config.runner_gid_min + 1;

        this.state = job_states.READY;
        this.dir = path.join(
            config.data_directory,
            globals.data_directories.jobs,
            this.uuid
        );
    }

    async prime() {
        if (remaining_job_spaces < 1) {
            logger.info(`Awaiting job slot uuid=${this.uuid}`);
            await new Promise(resolve => {
                jobQueue.push(resolve);
            });
        }

        logger.info(`Priming job uuid=${this.uuid}`);
        remaining_job_spaces--;
        logger.debug('Writing files to job cache');

        logger.debug(`Transfering ownership uid=${this.uid} gid=${this.gid}`);

        await fs.mkdir(this.dir, { mode: 0o700 });
        await fs.chown(this.dir, this.uid, this.gid);

        for (const file of this.files) {
            const file_path = path.join(this.dir, file.name);
            const rel = path.relative(this.dir, file_path);

            if (rel.startsWith('..'))
                throw Error(
                    `File path "${file.name}" tries to escape parent directory: ${rel}`
                );

            await fs.mkdir(path.dirname(file_path), {
                recursive: true,
                mode: 0o700,
            });
            await fs.chown(path.dirname(file_path), this.uid, this.gid);

            await fs.write_file(file_path, file.content, file.encoding);
            await fs.chown(file_path, this.uid, this.gid);
        }

        this.state = job_states.PRIMED;

        logger.debug('Primed job');
    }

    async safe_call(file, args, timeout, memory_limit, eventBus = null) {
        return new Promise((resolve, reject) => {
            const nonetwork = config.disable_networking ? ['nosocket'] : [];

            const prlimit = [
                'prlimit',
                '--nproc=' + this.runtime.max_process_count,
                '--nofile=' + this.runtime.max_open_files,
                '--fsize=' + this.runtime.max_file_size,
            ];

            if (memory_limit >= 0) {
                prlimit.push('--as=' + memory_limit);
            }

            const proc_call = [...prlimit, ...nonetwork, 'bash', file, ...args];

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

            if (eventBus === null) {
                proc.stdin.write(this.stdin);
                proc.stdin.end();
                proc.stdin.destroy();
            } else {
                eventBus.on('stdin', data => {
                    proc.stdin.write(data);
                });

                eventBus.on('kill', signal => {
                    proc.kill(signal);
                });
            }

            const kill_timeout =
                (timeout >= 0 &&
                    set_timeout(async _ => {
                        logger.info(
                            `Timeout exceeded timeout=${timeout} uuid=${this.uuid}`
                        );
                        process.kill(proc.pid, 'SIGKILL');
                    }, timeout)) ||
                null;

            proc.stderr.on('data', async data => {
                if (eventBus !== null) {
                    eventBus.emit('stderr', data);
                } else if (stderr.length > this.runtime.output_max_size) {
                    logger.info(`stderr length exceeded uuid=${this.uuid}`);
                    process.kill(proc.pid, 'SIGKILL');
                } else {
                    stderr += data;
                    output += data;
                }
            });

            proc.stdout.on('data', async data => {
                if (eventBus !== null) {
                    eventBus.emit('stdout', data);
                } else if (stdout.length > this.runtime.output_max_size) {
                    logger.info(`stdout length exceeded uuid=${this.uuid}`);
                    process.kill(proc.pid, 'SIGKILL');
                } else {
                    stdout += data;
                    output += data;
                }
            });

            const exit_cleanup = async () => {
                clear_timeout(kill_timeout);

                proc.stderr.destroy();
                proc.stdout.destroy();

                await this.cleanup_processes();
                logger.debug(`Finished exit cleanup uuid=${this.uuid}`);
            };

            proc.on('exit', async (code, signal) => {
                await exit_cleanup();

                resolve({ stdout, stderr, code, signal, output });
            });

            proc.on('error', async err => {
                await exit_cleanup();

                reject({ error: err, stdout, stderr, output });
            });
        });
    }

    async execute() {
        if (this.state !== job_states.PRIMED) {
            throw new Error(
                'Job must be in primed state, current state: ' +
                    this.state.toString()
            );
        }

        logger.info(
            `Executing job uuid=${this.uuid} uid=${this.uid} gid=${
                this.gid
            } runtime=${this.runtime.toString()}`
        );

        logger.debug('Compiling');

        let compile;

        if (this.runtime.compiled) {
            compile = await this.safe_call(
                path.join(this.runtime.pkgdir, 'compile'),
                this.code_files.map(x => x.name),
                this.timeouts.compile,
                this.memory_limits.compile
            );
        }

        logger.debug('Running');

        const run = await this.safe_call(
            path.join(this.runtime.pkgdir, 'run'),
            [this.code_files[0].name, ...this.args],
            this.timeouts.run,
            this.memory_limits.run
        );

        this.state = job_states.EXECUTED;

        return {
            compile,
            run,
            language: this.runtime.language,
            version: this.runtime.version.raw,
        };
    }

    async execute_interactive(eventBus) {
        if (this.state !== job_states.PRIMED) {
            throw new Error(
                'Job must be in primed state, current state: ' +
                    this.state.toString()
            );
        }

        logger.info(
            `Interactively executing job uuid=${this.uuid} uid=${
                this.uid
            } gid=${this.gid} runtime=${this.runtime.toString()}`
        );

        if (this.runtime.compiled) {
            eventBus.emit('stage', 'compile');
            const { error, code, signal } = await this.safe_call(
                path.join(this.runtime.pkgdir, 'compile'),
                this.code_files.map(x => x.name),
                this.timeouts.compile,
                this.memory_limits.compile,
                eventBus
            );

            eventBus.emit('exit', 'compile', { error, code, signal });
        }

        logger.debug('Running');
        eventBus.emit('stage', 'run');
        const { error, code, signal } = await this.safe_call(
            path.join(this.runtime.pkgdir, 'run'),
            [this.code_files[0].name, ...this.args],
            this.timeouts.run,
            this.memory_limits.run,
            eventBus
        );

        eventBus.emit('exit', 'run', { error, code, signal });

        this.state = job_states.EXECUTED;
    }

    async cleanup_processes(dont_wait = []) {
        let processes = [1];
        logger.debug(`Cleaning up processes uuid=${this.uuid}`);

        while (processes.length > 0) {
            processes = [];

            const proc_ids = await fs.readdir('/proc');

            processes = await Promise.all(
                proc_ids.map(async proc_id => {
                    if (isNaN(proc_id)) return -1;
                    try {
                        const proc_status = await fs.read_file(
                            path.join('/proc', proc_id, 'status')
                        );
                        const proc_lines = proc_status.to_string().split('\n');
                        const uid_line = proc_lines.find(line =>
                            line.starts_with('Uid:')
                        );
                        const [_, ruid, euid, suid, fuid] =
                            uid_line.split(/\s+/);

                        if (ruid == this.uid || euid == this.uid)
                            return parse_int(proc_id);
                    } catch {
                        return -1;
                    }

                    return -1;
                })
            );

            processes = processes.filter(p => p > 0);

            if (processes.length > 0)
                logger.debug(
                    `Got processes to kill: ${processes} uuid=${this.uuid}`
                );

            for (const proc of processes) {
                // First stop the processes, but keep their resources allocated so they cant re-fork
                try {
                    process.kill(proc, 'SIGSTOP');
                } catch {
                    // Could already be dead
                }
            }

            for (const proc of processes) {
                // Then clear them out of the process tree
                try {
                    process.kill(proc, 'SIGKILL');
                } catch {
                    // Could already be dead and just needs to be waited on
                }

                if (!dont_wait.includes(proc)) wait_pid(proc);
            }
        }

        logger.debug(`Cleaned up processes uuid=${this.uuid}`);
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
                    logger.warn(`Error removing file ${file_path}: ${e}`);
                }
            }
        }

        await fs.rm(this.dir, { recursive: true, force: true });
    }

    async cleanup() {
        logger.info(`Cleaning up job uuid=${this.uuid}`);

        await this.cleanup_filesystem();

        remaining_job_spaces++;
    }
}

module.exports = {
    Job,
};
