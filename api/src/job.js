const logplease = require('logplease');
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
                jobQueue.push(resolve);
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

            const proc_call = [
                'nice',
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
                        this.logger.info(`Timeout exceeded timeout=${timeout}`);
                        process.kill(proc.pid, 'SIGKILL');
                    }, timeout)) ||
                null;

            proc.stderr.on('data', async data => {
                if (eventBus !== null) {
                    eventBus.emit('stderr', data);
                } else if (stderr.length > this.runtime.output_max_size) {
                    this.logger.info(`stderr length exceeded`);
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
                    this.logger.info(`stdout length exceeded`);
                    process.kill(proc.pid, 'SIGKILL');
                } else {
                    stdout += data;
                    output += data;
                }
            });

            const exit_cleanup = () => {
                clear_timeout(kill_timeout);

                proc.stderr.destroy();
                proc.stdout.destroy();

                this.cleanup_processes();
                this.logger.debug(`Finished exit cleanup`);
            };

            proc.on('exit', (code, signal) => {
                exit_cleanup();

                resolve({ stdout, stderr, code, signal, output });
            });

            proc.on('error', err => {
                exit_cleanup();

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

        this.logger.info(`Executing job runtime=${this.runtime.toString()}`);

        const code_files = this.files.filter(file => file.encoding == 'utf8');

        this.logger.debug('Compiling');

        let compile;
        let compile_errored = false;

        if (this.runtime.compiled) {
            compile = await this.safe_call(
                this.runtime.compile,
                code_files.map(x => x.name),
                this.timeouts.compile,
                this.memory_limits.compile
            );
            compile_errored = compile.code !== 0;
        }

        let run;
        if (!compile_errored) {
            this.logger.debug('Running');

            run = await this.safe_call(
                this.runtime.run,
                [code_files[0].name, ...this.args],
                this.timeouts.run,
                this.memory_limits.run
            );
        }

        this.state = job_states.EXECUTED;

        return {
            compile,
            run,
            language: this.runtime.language,
            version: this.runtime.version,
        };
    }

    async execute_interactive(eventBus) {
        if (this.state !== job_states.PRIMED) {
            throw new Error(
                'Job must be in primed state, current state: ' +
                    this.state.toString()
            );
        }

        this.logger.info(
            `Interactively executing job runtime=${this.runtime.toString()}`
        );

        const code_files = this.files.filter(file => file.encoding == 'utf8');

        let compile_errored = false;
        if (this.runtime.compiled) {
            eventBus.emit('stage', 'compile');
            const { error, code, signal } = await this.safe_call(
                this.runtime.compile,
                code_files.map(x => x.name),
                this.timeouts.compile,
                this.memory_limits.compile,
                eventBus
            );

            eventBus.emit('exit', 'compile', { error, code, signal });
            compile_errored = code !== 0;
        }

        if (!compile_errored) {
            this.logger.debug('Running');
            eventBus.emit('stage', 'run');
            const { error, code, signal } = await this.safe_call(
                this.runtime.run,
                [code_files[0].name, ...this.args],
                this.timeouts.run,
                this.memory_limits.run,
                eventBus
            );

            eventBus.emit('exit', 'run', { error, code, signal });
        }

        this.state = job_states.EXECUTED;
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

                    if (state == 'Z')
                        // Zombie process, just needs to be waited
                        return -1;
                    // We should kill in all other state (Sleep, Stopped & Running)

                    if (ruid == this.uid || euid == this.uid)
                        return parse_int(proc_id);
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
                } catch {
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

        this.cleanup_processes(); // Run process janitor, just incase there are any residual processes somehow
        await this.cleanup_filesystem();

        remaining_job_spaces++;
    }
}

module.exports = {
    Job,
};
