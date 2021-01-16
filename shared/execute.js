const { writeFile } = require('fs/promises');
const { spawn } = require('child_process');

function execute(language, source, args, stdin) {
    return new Promise(async resolve => {
        const stamp = new Date().getTime();
        const sourceFile = `/tmp/${stamp}.code`;

        await writeFile(sourceFile, source);

        const process = spawn(__dirname + '/../lxc/execute', [
            language.name,
            sourceFile,
            stdin ?? '',
            args?.join('\n') ?? '',
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
