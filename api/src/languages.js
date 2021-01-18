const { spawn } = require('child_process');

const languages = [
    {
        name: 'nasm',
        aliases: ['asm', 'nasm'],
    },
    {
        name: 'nasm64',
        aliases: ['asm64', 'nasm64'],
    },
    {
        name: 'awk',
        aliases: ['awk'],
    },
    {
        name: 'bash',
        aliases: ['bash', "sh"],
    },
    {
        name: 'brainfuck',
        aliases: ['bf', 'brainfuck'],
    },
    {
        name: 'c',
        aliases: ['c'],
    },
    {
        name: 'csharp',
        aliases: ['c#', 'cs', 'csharp'],
    },
    {
        name: 'cpp',
        aliases: ['c++', 'cpp'],
    },
    {
        name: 'deno',
        aliases: ['deno', 'denojs', 'denots'],
    },
    {
        name: 'ruby',
        aliases: ['duby', 'rb', 'ruby'],
    },
    {
        name: 'emacs',
        aliases: ['el', 'elisp', 'emacs'],
    },
    {
        name: 'elixir',
        aliases: ['elixir'],
    },
    {
        name: 'haskell',
        aliases: ['haskell', 'hs'],
    },
    {
        name: 'go',
        aliases: ['go'],
    },
    {
        name: 'java',
        aliases: ['java'],
    },
    {
        name: 'node',
        aliases: ['javascript', 'js', 'node'],
    },
    {
        name: 'jelly',
        aliases: ['jelly'],
    },
    {
        name: 'julia',
        aliases: ['jl', 'julia'],
    },
    {
        name: 'kotlin',
        aliases: ['kotlin'],
    },
    {
        name: 'lua',
        aliases: ['lua'],
    },
    {
        name: 'paradoc',
        aliases: ['paradoc'],
    },
    {
        name: 'perl',
        aliases: ['perl'],
    },
    {
        name: 'php',
        aliases: ['php', 'php3', 'php4', 'php5'],
    },
    {
        name: 'python3',
        aliases: ['py', 'py3', 'python', 'python3'],
    },
    {
        name: 'python2',
        aliases: ['python2'],
    },
    {
        name: 'rust',
        aliases: ['rs', 'rust'],
    },
    {
        name: 'swift',
        aliases: ['swift'],
    },
    {
        name: 'typescript',
        aliases: ['ts', 'typescript'],
    },
];

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
