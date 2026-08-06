const logplease = require('logplease');
const { v4: uuidv4 } = require('uuid');
const cp = require('child_process');
const path = require('path');
const config = require('./config');
const fs = require('fs/promises');
const globals = require('./globals');
const { acquire_job_slot, release_job_slot, get_next_box_id } = require('./job');

const ISOLATE_PATH = '/usr/local/bin/isolate';

class Session {
    #box;
    #cleaned_up;

    constructor({ runtime, files, timeouts, cpu_times, memory_limits }) {
        this.uuid = uuidv4();
        this.logger = logplease.create(`session/${this.uuid}`);
        this.runtime = runtime;
        this.files = files;
        this.timeouts = timeouts;
        this.cpu_times = cpu_times;
        this.memory_limits = memory_limits;
        this.#box = null;
        this.#cleaned_up = false;
    }

    get cleaned_up() {
        return this.#cleaned_up;
    }

    async prime() {
        await acquire_job_slot(this.logger);
        this.logger.info('Priming session');

        const box_id = get_next_box_id();
        const metadata_file_path = `/tmp/${box_id}-metadata.txt`;

        this.#box = await new Promise((res, rej) => {
            cp.exec(
                `isolate --init --cg -b${box_id}`,
                (error, stdout, stderr) => {
                    if (error) {
                        rej(
                            `Failed to run isolate --init: ${error.message}\nstdout: ${stdout}\nstderr: ${stderr}`
                        );
                        return;
                    }
                    if (!stdout) {
                        rej('Received empty stdout from isolate --init');
                        return;
                    }
                    res({
                        id: box_id,
                        metadata_file_path,
                        dir: `${stdout.trim()}/box`,
                    });
                }
            );
        });

        this.logger.debug('Writing initial files to isolate box');
        const submission_dir = path.join(this.#box.dir, 'submission');
        await fs.mkdir(submission_dir);

        for (const file of this.files) {
            const file_path = path.join(submission_dir, file.name);
            const rel = path.relative(submission_dir, file_path);
            if (rel.startsWith('..'))
                throw new Error(
                    `File path "${file.name}" tries to escape parent directory: ${rel}`
                );
            await fs.mkdir(path.dirname(file_path), {
                recursive: true,
                mode: 0o700,
            });
            await fs.write_file(
                file_path,
                Buffer.from(file.content, file.encoding)
            );
        }

        this.logger.debug('Session primed');
    }

    async run_execute(code, args, stdin, timeout, cpu_time, memory_limit, event_bus) {
        const exec_path = path.join(
            this.#box.dir,
            'submission',
            '_exec.code'
        );
        await fs.write_file(exec_path, code);

        const proc = cp.spawn(
            ISOLATE_PATH,
            [
                '--run',
                `-b${this.#box.id}`,
                `--meta=${this.#box.metadata_file_path}`,
                '--cg',
                '-s',
                '-c',
                '/box/submission',
                '-E',
                'HOME=/tmp',
                ...this.runtime.env_vars.flat_map(v => ['-E', v]),
                '-E',
                `PISTON_LANGUAGE=${this.runtime.language}`,
                `--dir=${this.runtime.pkgdir}`,
                `--dir=/etc:noexec`,
                `--processes=${this.runtime.max_process_count}`,
                `--open-files=${this.runtime.max_open_files}`,
                `--fsize=${Math.floor(this.runtime.max_file_size / 1000)}`,
                `--wall-time=${timeout / 1000}`,
                `--time=${cpu_time / 1000}`,
                `--extra-time=0`,
                ...(memory_limit >= 0
                    ? [`--cg-mem=${Math.floor(memory_limit / 1000)}`]
                    : []),
                ...(config.disable_networking ? [] : ['--share-net']),
                '--',
                '/bin/bash',
                path.join(this.runtime.pkgdir, 'run'),
                '_exec.code',
                ...args,
            ],
            { stdio: 'pipe' }
        );

        if (stdin) proc.stdin.write(stdin);

        const stdin_handler = data => proc.stdin.write(data);
        const kill_handler = signal => proc.kill(signal);
        event_bus.on('stdin', stdin_handler);
        event_bus.on('kill', kill_handler);

        proc.stdout.on('data', data => event_bus.emit('stdout', data));
        proc.stderr.on('data', data => event_bus.emit('stderr', data));

        await new Promise((res, rej) => {
            proc.on('exit', () => res());
            proc.on('error', err => rej(err));
        });

        event_bus.off('stdin', stdin_handler);
        event_bus.off('kill', kill_handler);

        const metadata_str = (
            await fs.read_file(this.#box.metadata_file_path)
        ).toString();

        let exit_code = null;
        let exit_signal = null;
        let status = null;

        for (const line of metadata_str.split('\n')) {
            if (!line) continue;
            const [key, value] = line.split(':');
            if (key === undefined || value === undefined) continue;
            switch (key) {
                case 'exitcode':
                    exit_code = parse_int(value);
                    break;
                case 'exitsig':
                    exit_signal = globals.SIGNALS[parse_int(value)] ?? null;
                    break;
                case 'status':
                    status = value;
                    break;
            }
        }

        return {
            code: exit_code,
            signal: ['TO', 'OL', 'EL'].includes(status) ? 'SIGKILL' : exit_signal,
        };
    }

    async read_file(filename) {
        const submission_dir = path.join(this.#box.dir, 'submission');
        const file_path = path.join(submission_dir, filename);
        const rel = path.relative(submission_dir, file_path);
        if (rel.startsWith('..'))
            throw new Error(
                `File path "${filename}" tries to escape submission directory`
            );
        return await fs.read_file(file_path);
    }

    async cleanup() {
        if (this.#cleaned_up) return;
        this.#cleaned_up = true;
        this.logger.info('Cleaning up session');
        release_job_slot();
        if (this.#box) {
            cp.exec(
                `isolate --cleanup --cg -b${this.#box.id}`,
                (error, stdout, stderr) => {
                    if (error) {
                        this.logger.error(
                            `Failed to run isolate --cleanup: ${error.message} on box #${this.#box.id}\nstdout: ${stdout}\nstderr: ${stderr}`
                        );
                    }
                }
            );
            try {
                await fs.rm(this.#box.metadata_file_path);
            } catch (e) {
                this.logger.error(
                    `Failed to remove metadata file for box #${this.#box.id}: ${e.message}`
                );
            }
        }
    }
}

module.exports = { Session };
