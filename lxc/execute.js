const { writeFileSync, unlinkSync, mkdirSync } = require('fs');
const { spawn } = require('child_process');

const OUTPUT_LIMIT = 65535;
const LXC_ROOT = '/var/lib/lxc/piston/rootfs';

function execute(language, source, stdin = '', args = []) {
    return new Promise(resolve => {
        const id = new Date().getTime() + '_' + Math.floor(Math.random() * 10000000);

        mkdirSync(`${LXC_ROOT}/tmp/${id}`);
        writeFileSync(`${LXC_ROOT}/tmp/${id}/code.code`, source);
        writeFileSync(`${LXC_ROOT}/tmp/${id}/stdin.stdin`, stdin);
        writeFileSync(`${LXC_ROOT}/tmp/${id}/args.args`, args.join('\n'));

        const process = spawn(__dirname + '/execute', [
            language.name,
            id,
        ]);

        let stdout = '';
        let stderr = '';
        let output = '';

        process.stderr.on('data', chunk => {
            if (stderr.length >= OUTPUT_LIMIT) return;

            stderr += chunk;
            output += chunk;
        });

        process.stdout.on('data', chunk => {
            if (stdout.length >= OUTPUT_LIMIT) return;

            stdout += chunk;
            output += chunk;
        });

        process.on('exit', code => {
            stderr = stderr.trim().substring(0, OUTPUT_LIMIT);
            stdout = stdout.trim().substring(0, OUTPUT_LIMIT);
            output = output.trim().substring(0, OUTPUT_LIMIT);

            resolve({
                stdout,
                stderr,
                output,
                ran: code === 0,
            });
        });
    });
}

module.exports = {
    execute,
};
