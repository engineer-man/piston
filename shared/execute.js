const { writeFileSync } = require('fs');
const { spawn } = require('child_process');

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
            stderr += chunk;
            output += chunk;
        });

        process.stdout.on('data', chunk => {
            stdout += chunk;
            output += chunk;
        });
        
        process.on('exit', code => {
            stderr = stderr.trim().substring(0, 65535);
            stdout = stdout.trim().substring(0, 65535);
            output = output.trim().substring(0, 65535);

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
