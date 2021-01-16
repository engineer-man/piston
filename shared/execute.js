const { writeFile } = require('fs/promises');
const { spawn } = require('child_process');

function execute(language, source, args) {
    return new Promise(async resolve => {
        const stamp = new Date().getTime();
        const sourceFile = `/tmp/${stamp}.code`;

        await writeFile(sourceFile, source);

        const process = spawn(__dirname + '/../lxc/execute', [
            language.name,
            sourceFile,
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
        
        process.on('exit', () => {
            stderr = stderr.trim().substring(0, 65535);
            stdout = stdout.trim().substring(0, 65535);
            output = output.trim().substring(0, 65535);

            resolve({ stdout, stderr, output });
        });
    });
}

module.exports = {
    execute,
};
