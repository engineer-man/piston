const { writeFile } = require('fs/promises');
const express = require('express');
const app = express();
const languages = require('./languages');
const { spawn, execFileSync } = require('child_process');

const versions = execFileSync(__dirname + '/../../lxc/versions')
    .toString()
    .toLowerCase()
    .split('---')
    .map(section => section.split('\n'))
    .filter(section => section.length >= 2);

function getVersion(language) {
    return versions.find(section => section[0] === language?.name);
}

for (const language of languages) {
    // TODO: Add custom handlers for some languages

    language.version = getVersion(language);
}

app.use(express.json());

app.post('/execute', (req, res) => {
    const body = req.body;

    const language = languages.find(language => {
        return language.aliases.includes(body.language?.toString()?.toLowerCase());
    });

    if (!language) {
        return res.status(400).json({
            code: 'unsupported_language',
            message: `${body.language} is not supported by Piston`,
        });
    } else if (!(body.source instanceof string)) {
        return res.status(400).json({
            code: 'missing_source',
            message: 'source field is invalid',
        });
    } else if (body.args && !(body.args instanceof Array)) {
        return res.status(400).json({
            code: 'invalid_args',
            message: 'args field is not an array',
        });
    }

    launch(res, language, body);
});

async function launch(res, language, body) {
    const stamp = new Date().getTime();
    const sourceFile = `/tmp/${stamp}.code`;

    await writeFile(sourceFile, body.source);

    const process = spawn(__dirname + '/../../lxc/execute', [language.name, sourceFile, (body.args ?? []).join('\n')]);

    const result = {
        ran: true,
        language: language.name,
        stderr: '',
        stdout: '',
        output: '',
    };

    if (language.version)
        result.version = language.version;

    process.stderr.setEncoding('utf-8');
    process.stdout.setEncoding('utf-8');

    process.stderr.addListener('data', chunk => {
        result.stderr += chunk;
        result.output += chunk;
    });

    process.stdout.addListener('data', chunk => {
        result.stdout += chunk;
        result.output += chunk;
    });

    result.stderr = result.stderr.substring(0, 65535);
    result.stdout = result.stdout.substring(0, 65535);
    result.output = result.output.substring(0, 65535);

    process.on('exit', () => {
        res.json(result);
    });
}

app.get('/versions', (req, res) => {
    res.json(languages);
});

const PORT = 2000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
