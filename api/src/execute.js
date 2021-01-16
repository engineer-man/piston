const { writeFile } = require('fs/promises');
const { spawn } = require('child_process');

async function execute(res, language, body) {
    const stamp = new Date().getTime();
    const sourceFile = `/tmp/${stamp}.code`;

    await writeFile(sourceFile, body.source);

    const process = spawn(__dirname + '/../../lxc/execute', [
        language.name,
        sourceFile,
        body.args?.join('\n') ?? '',
    ]);

    const result = {
        ran: true,
        language: language.name,
        stderr: '',
        stdout: '',
        output: '',
    };

    if (language.version)
        result.version = language.version;

    process.stderr.on('data', chunk => {
        result.stderr += chunk;
        result.output += chunk;
    });

    process.stdout.on('data', chunk => {
        result.stdout += chunk;
        result.output += chunk;
    });

    process.on('exit', () => {
        result.stderr = result.stderr.trim().substring(0, 65535);
        result.stdout = result.stdout.trim().substring(0, 65535);
        result.output = result.output.trim().substring(0, 65535);

        res.json(result);
    });
}

module.exports = {
    execute,
};
