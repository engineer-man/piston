#!/usr/bin/env node
require('yargs')(process.argv.slice(2))
    .option('piston-url', {
        alias: ['u'],
        default: 'http://127.0.0.1:6969',
        desc: 'Piston API URL',
        string: true
    })
    .scriptName("piston")
    .commandDir('commands')
    .demandCommand()
    .help()
    .wrap(72)
    .argv
