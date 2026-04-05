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

const fs = require('fs');
const path = require('path');

// Try to find .piston_key in the project root if PISTON_KEY is not set
let default_key = process.env.PISTON_KEY || null;
if (!default_key) {
    try {
        const key_path = path.join(__dirname, '../../.piston_key');
        if (fs.existsSync(key_path)) {
            default_key = fs.readFileSync(key_path, 'utf8').trim();
        }
    } catch (e) {
        // Ignore errors
    }
}

require('yargs')(process.argv.slice(2))
    .option('piston-url', {
        alias: ['u'],
        default: 'http://127.0.0.1:2000',
        desc: 'Piston API URL',
        string: true,
    })
    .option('piston-key', {
        alias: ['k'],
        default: default_key,
        desc: 'Piston API Key (Authorization header)',
        string: true,
    })
    .middleware(argv => {
        const headers = {
            'Content-Type': 'application/json',
        };

        if (argv['piston-key']) {
            headers['Authorization'] = argv['piston-key'];
        }

        argv.axios = axios.create({
            baseURL: argv['piston-url'],
            headers,
        });

        return argv;
    })
    .scriptName('piston')
    .commandDir('commands')
    .demandCommand()
    .help()
    .wrap(72).argv;
