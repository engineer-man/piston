#!/usr/bin/env node
require('nocamel');
const axios = require('axios').default;

const axios_instance = argv => {
    argv.axios = axios.create({
        baseURL: argv['piston-url'],
        headers: {
            'Content-Type': 'application/json',
        },
    });

    return argv;
};

require('yargs')(process.argv.slice(2))
    .option('piston-url', {
        alias: ['u'],
        default: 'http://127.0.0.1:2000',
        desc: 'Piston API URL',
        string: true,
    })
    .middleware(axios_instance)
    .scriptName('piston')
    .commandDir('commands')
    .demandCommand()
    .help()
    .wrap(72).argv;
