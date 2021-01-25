const { spawn } = require('child_process');
const languages = require('../../config/languages.json');

{
    const process = spawn(__dirname + '/../../lxc/util/versions');

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
            language.version = versions[language.name];
        }
    });
}

module.exports = {
    languages,
};
