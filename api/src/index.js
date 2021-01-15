const { writeFile } = require('fs/promises');
const express = require('express');
const app = express();
const languages = require('./languages');
const { spawn } = require('child_process');

{
    const process = spawn(__dirname + '/../../lxc/versions');

    let output = '';
    process.stderr.on('data', chunk => output += chunk);
    process.stdout.on('data', chunk => output += chunk);

    process.on('exit', () => {
        const sections = output.toLowerCase().split('---');
        const versions = {};

        for (const section of sections) {
            const lines = section.trim().split('\n');
            
            if (lines.length >= 2) {
                const language = lines[0];

                console.log(language);

                if (language === 'java') {
                    versions[language] = /\d+/.exec(lines[1])?.[0];
                } else if (language === 'emacs') {
                    versions[language] = /\d+\.\d+/.exec(lines[1])?.[0];
                } else {
                    versions[language] = /\d+\.\d+\.\d+/.exec(section)?.[0];
                }
            }
        }

        for (const language of languages) {
            console.log(language.name, versions[language.name])
            language.version = versions[language.name];
        }
    });
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
    } else if (typeof body.source !== 'string') {
        return res.status(400).json({
            code: 'missing_source',
            message: 'source field is invalid',
        });
    } else if (body.args && !Array.isArray(body.args)) {
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
