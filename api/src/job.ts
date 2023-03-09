import { create, type Logger } from 'logplease';

const logger = create('job');
import { v4 as uuidv4 } from 'uuid';
import { spawn } from 'child_process';
import { join, relative, dirname } from 'node:path';
import config from './config.js';
import * as globals from './globals.js';
import {
    mkdir,
    chown,
    writeFile,
    readdir,
    stat as _stat,
    rm,
} from 'node:fs/promises';
import { readdirSync, readFileSync } from 'node:fs';
import wait_pid from 'waitpid';
import EventEmitter from 'events';

import { File, ResponseBody } from './types.js';

const job_states = {
    READY: Symbol('Ready to be primed'),
    PRIMED: Symbol('Primed and ready for execution'),
    EXECUTED: Symbol('Executed and ready for cleanup'),
} as const;

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

export default class Job {
    uuid: string;
    logger: Logger;
    runtime: any;
    files: File[];
    args: string[];
    stdin: string;
    timeouts: { compile: number; run: number };
    memory_limits: { compile: number; run: number };
    uid: number;
    gid: number;
    state: symbol;
    dir: string;
    constructor({
        runtime,
        files,
        args,
        stdin,
        timeouts,
        memory_limits,
    }: {
        runtime: unknown;
        files: File[];
        args: string[];
        stdin: string;
        timeouts: { compile: number; run: number };
        memory_limits: { compile: number; run: number };
    }) {
        this.uuid = uuidv4();

        this.logger = create(`job/${this.uuid}`, {});

        this.runtime = runtime;
        this.files = files.map((file: File, i: number) => ({
            name: file.name || `file${i}.code`,
            content: file.content,
            encoding: ['base64', 'hex', 'utf8'].includes(file.encoding)
                ? file.encoding
                : 'utf8',
        }));

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

        this.logger.debug(`Assigned uid=${this.uid} gid=${this.gid}`);

        this.state = job_states.READY;
        this.dir = join(
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

        await mkdir(this.dir, { mode: 0o700 });
        await chown(this.dir, this.uid, this.gid);

        for (const file of this.files) {
            const file_path = join(this.dir, file.name);
            const rel = relative(this.dir, file_path);
            const file_content = Buffer.from(file.content, file.encoding);

            if (rel.startsWith('..'))
                throw Error(
                    `File path "${file.name}" tries to escape parent directory: ${rel}`
                );

            await mkdir(dirname(file_path), {
                recursive: true,
                mode: 0o700,
            });
            await chown(dirname(file_path), this.uid, this.gid);

            await writeFile(file_path, file_content);
            await chown(file_path, this.uid, this.gid);
        }

        this.state = job_states.PRIMED;

        this.logger.debug('Primed job');
    }

    async safe_call(
        file: string,
        args: string[],
        timeout: number,
        memory_limit: string | number,
        eventBus: EventEmitter = null
    ): Promise<ResponseBody['run'] & { error?: Error }> {
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
            ] as Array<string>;

            var stdout = '';
            var stderr = '';
            var output = '';

            const proc = spawn(proc_call[0], proc_call.splice(1), {
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
                eventBus.on('stdin', (data: any) => {
                    proc.stdin.write(data);
                });

                eventBus.on('kill', (signal: NodeJS.Signals | number) => {
                    proc.kill(signal);
                });
            }

            const kill_timeout =
                (timeout >= 0 &&
                    setTimeout(async _ => {
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
                clearTimeout(kill_timeout);

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

        const code_files =
            (this.runtime.language === 'file' && this.files) ||
            this.files.filter((file: File) => file.encoding == 'utf8');

        this.logger.debug('Compiling');

        let compile: unknown;

        if (this.runtime.compiled) {
            compile = await this.safe_call(
                join(this.runtime.pkgdir, 'compile'),
                code_files.map(x => x.name),
                this.timeouts.compile,
                this.memory_limits.compile
            );
        }

        this.logger.debug('Running');

        const run = await this.safe_call(
            join(this.runtime.pkgdir, 'run'),
            [code_files[0].name, ...this.args],
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

    async execute_interactive(eventBus: EventEmitter) {
        if (this.state !== job_states.PRIMED) {
            throw new Error(
                'Job must be in primed state, current state: ' +
                    this.state.toString()
            );
        }

        this.logger.info(
            `Interactively executing job runtime=${this.runtime.toString()}`
        );

        const code_files =
            (this.runtime.language === 'file' && this.files) ||
            this.files.filter(file => file.encoding == 'utf8');

        if (this.runtime.compiled) {
            eventBus.emit('stage', 'compile');
            const { error, code, signal } = await this.safe_call(
                join(this.runtime.pkgdir, 'compile'),
                code_files.map(x => x.name),
                this.timeouts.compile,
                this.memory_limits.compile,
                eventBus
            );

            eventBus.emit('exit', 'compile', { error, code, signal });
        }

        this.logger.debug('Running');
        eventBus.emit('stage', 'run');
        const { error, code, signal } = await this.safe_call(
            join(this.runtime.pkgdir, 'run'),
            [code_files[0].name, ...this.args],
            this.timeouts.run,
            this.memory_limits.run,
            eventBus
        );

        eventBus.emit('exit', 'run', { error, code, signal });

        this.state = job_states.EXECUTED;
    }

    cleanup_processes(dont_wait = []) {
        let processes: number[] = [1];
        const to_wait = [];
        this.logger.debug(`Cleaning up processes`);

        while (processes.length > 0) {
            processes = [];

            const proc_ids = readdirSync('/proc');

            processes = proc_ids.map(proc_id => {
                if (isNaN(+proc_id)) return -1;
                try {
                    const proc_status = readFileSync(
                        join('/proc', proc_id, 'status')
                    );
                    const proc_lines = proc_status.toString().split('\n');
                    const state_line = proc_lines.find(line =>
                        line.startsWith('State:')
                    );
                    const uid_line = proc_lines.find(line =>
                        line.startsWith('Uid:')
                    );
                    const [_, ruid, euid, suid, fuid] = uid_line.split(/\s+/);

                    const [_1, state, user_friendly] = state_line.split(/\s+/);

                    const proc_id_int = parseInt(proc_id);

                    // Skip over any processes that aren't ours.
                    // @ts-ignore: dont want to risk fixing this
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
            const contents = await readdir(clean_path);

            for (const file of contents) {
                const file_path = join(clean_path, file);

                try {
                    const stat = await _stat(file_path);

                    if (stat.uid === this.uid) {
                        await rm(file_path, {
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

        await rm(this.dir, { recursive: true, force: true });
    }

    async cleanup() {
        this.logger.info(`Cleaning up job`);

        this.cleanup_processes(); // Run process janitor, just incase there are any residual processes somehow
        await this.cleanup_filesystem();

        remaining_job_spaces++;
    }
}
