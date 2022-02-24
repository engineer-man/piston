const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const WebSocket = require('ws');

const SIGNALS = [
    'SIGABRT',
    'SIGALRM',
    'SIGBUS',
    'SIGCHLD',
    'SIGCLD',
    'SIGCONT',
    'SIGEMT',
    'SIGFPE',
    'SIGHUP',
    'SIGILL',
    'SIGINFO',
    'SIGINT',
    'SIGIO',
    'SIGIOT',
    'SIGLOST',
    'SIGPIPE',
    'SIGPOLL',
    'SIGPROF',
    'SIGPWR',
    'SIGQUIT',
    'SIGSEGV',
    'SIGSTKFLT',
    'SIGTSTP',
    'SIGSYS',
    'SIGTERM',
    'SIGTRAP',
    'SIGTTIN',
    'SIGTTOU',
    'SIGUNUSED',
    'SIGURG',
    'SIGUSR1',
    'SIGUSR2',
    'SIGVTALRM',
    'SIGXCPU',
    'SIGXFSZ',
    'SIGWINCH',
];

exports.command = ['execute <language> <file> [args..]'];
exports.aliases = ['run'];
exports.describe = 'Executes file with the specified runner';

exports.builder = {
    language_version: {
        string: true,
        desc: 'Set the version of the language to use',
        alias: ['l'],
        default: '*',
    },
    stdin: {
        boolean: true,
        desc: 'Read input from stdin and pass to executor',
        alias: ['i'],
    },
    run_timeout: {
        alias: ['rt', 'r'],
        number: true,
        desc: 'Milliseconds before killing run process',
        default: 3000,
    },
    compile_timeout: {
        alias: ['ct', 'c'],
        number: true,
        desc: 'Milliseconds before killing compile process',
        default: 10000,
    },
    files: {
        alias: ['f'],
        array: true,
        desc: 'Additional files to add',
    },
    interactive: {
        boolean: true,
        alias: ['t'],
        desc: 'Run interactively using WebSocket transport',
    },
    status: {
        boolean: true,
        alias: ['s'],
        desc: 'Output additional status to stderr',
    },
};

async function handle_interactive(files, argv) {
    const ws = new WebSocket(
        argv.pistonUrl.replace('http', 'ws') + '/api/v2/connect'
    );

    const log_message =
        process.stderr.isTTY && argv.status ? console.error : () => {};

    process.on('exit', () => {
        ws.close();
        process.stdin.end();
        process.stdin.destroy();
        process.exit();
    });

    for (const signal of SIGNALS) {
        process.on(signal, () => {
            ws.send(JSON.stringify({ type: 'signal', signal }));
        });
    }

    ws.on('open', () => {
        const request = {
            type: 'init',
            language: argv.language,
            version: argv['language_version'],
            files: files,
            args: argv.args,
            compile_timeout: argv.ct,
            run_timeout: argv.rt,
        };

        ws.send(JSON.stringify(request));
        log_message(chalk.white.bold('Connected'));

        process.stdin.resume();

        process.stdin.on('data', data => {
            ws.send(
                JSON.stringify({
                    type: 'data',
                    stream: 'stdin',
                    data: data.toString(),
                })
            );
        });
    });

    ws.on('close', (code, reason) => {
        log_message(
            chalk.white.bold('Disconnected: '),
            chalk.white.bold('Reason: '),
            chalk.yellow(`"${reason}"`),
            chalk.white.bold('Code: '),
            chalk.yellow(`"${code}"`)
        );
        process.stdin.pause();
    });

    ws.on('message', function (data) {
        const msg = JSON.parse(data);

        switch (msg.type) {
            case 'runtime':
                log_message(
                    chalk.bold.white('Runtime:'),
                    chalk.yellow(`${msg.language} ${msg.version}`)
                );
                break;
            case 'stage':
                log_message(
                    chalk.bold.white('Stage:'),
                    chalk.yellow(msg.stage)
                );
                break;
            case 'data':
                if (msg.stream == 'stdout') process.stdout.write(msg.data);
                else if (msg.stream == 'stderr') process.stderr.write(msg.data);
                else log_message(chalk.bold.red(`(${msg.stream}) `), msg.data);
                break;
            case 'exit':
                if (msg.signal === null)
                    log_message(
                        chalk.white.bold('Stage'),
                        chalk.yellow(msg.stage),
                        chalk.white.bold('exited with code'),
                        chalk.yellow(msg.code)
                    );
                else
                    log_message(
                        chalk.white.bold('Stage'),
                        chalk.yellow(msg.stage),
                        chalk.white.bold('exited with signal'),
                        chalk.yellow(msg.signal)
                    );
                break;
            default:
                log_message(chalk.red.bold('Unknown message:'), msg);
        }
    });
}

async function run_non_interactively(files, argv) {
    const stdin =
        (argv.stdin &&
            (await new Promise((resolve, _) => {
                let data = '';
                process.stdin.on('data', d => (data += d));
                process.stdin.on('end', _ => resolve(data));
            }))) ||
        '';

    const request = {
        language: argv.language,
        version: argv['language_version'],
        files: files,
        args: argv.args,
        stdin,
        compile_timeout: argv.ct,
        run_timeout: argv.rt,
    };

    let { data: response } = await argv.axios.post('/api/v2/execute', request);

    const step = (name, ctx) => {
        console.log(chalk.bold(`== ${name} ==`));

        if (ctx.stdout) {
            console.log(chalk.bold(`STDOUT`));
            console.log(ctx.stdout.replace(/\n/g, '\n    '));
        }

        if (ctx.stderr) {
            console.log(chalk.bold(`STDERR`));
            console.log(ctx.stderr.replace(/\n/g, '\n    '));
        }

        if (ctx.code) {
            console.log(
                chalk.bold(`Exit Code:`),
                chalk.bold[ctx.code > 0 ? 'red' : 'green'](ctx.code)
            );
        }

        if (ctx.signal) {
            console.log(chalk.bold(`Signal:`), chalk.bold.yellow(ctx.signal));
        }
    };

    if (response.compile) {
        step('Compile', response.compile);
    }

    step('Run', response.run);
}

exports.handler = async argv => {
    const files = [...(argv.files || []), argv.file].map(file_path => {
        const buffer = fs.readFileSync(file_path);
        // Checks for � (the replacement character) after encoding the buffer to uf8
        const encoding =
            (buffer
                .toString()
                .split('')
                .some(x => x.charCodeAt(0) === 65533) &&
                'base64') ||
            'utf8';
        return {
            name: path.basename(file_path),
            content: buffer.toString(encoding),
            encoding,
        };
    });

    if (argv.interactive) await handle_interactive(files, argv);
    else await run_non_interactively(files, argv);
};
