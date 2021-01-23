const { writeFileSync, unlinkSync } = require('fs');
const { spawn } = require('child_process');

const OUTPUT_LIMIT = 65535;

function execute(language, source, stdin = '', args = []) {
    return new Promise(resolve => {
        const stamp = new Date().getTime();
        const sourceFile = `/tmp/${stamp}.code`;

        writeFileSync(sourceFile, source);

        const process = spawn(__dirname + '/../lxc/execute', [
            language.name,
            sourceFile,
            stdin,
            args.join('\n'),
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
            unlinkSync(sourceFile);

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
