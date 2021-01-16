const { execute } = require('../../shared/execute');
const { readFileSync } = require('fs');
const languages = require('../../shared/languages.json');

const [languageName, sourceFile, ...args] = process.argv.slice(2);

(async () => {
    if (!languageName) {
        console.error('Provide a language name');
        return;
    }
    
    if (!sourceFile) {
        console.error('Provide a source file');
        return;
    }

    const source = readFileSync(sourceFile).toString();

    const language = languages.find(language => language.name === languageName);

    if (!language) {
        console.error(`${languageName} is not supported by Piston`);
        return;
    }

    const { output } = await execute(language, source, args);

    console.log(output);
})();
