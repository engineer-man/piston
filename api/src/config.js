const fss = require('fs');
const yargs = require('yargs');
const hide_bin = require('yargs/helpers').hideBin;
const Logger = require('logplease');
const logger = Logger.create('config');
const yaml = require('js-yaml');

const header = `#
#      ____  _     _
#     |  _ \\(_)___| |_ ___  _ __
#     | |_) | / __| __/ _ \\| '_ \\
#     |  __/| \\__ \\ || (_) | | | |
#     |_|   |_|___/\\__\\___/|_| |_|
#
# A High performance code execution engine
#     github.com/engineer-man/piston
#

`;
const argv = yargs(hide_bin(process.argv))
    .usage('Usage: $0 -c [config]')
    .demandOption('c')
    .option('config', {
        alias: 'c',
        describe: 'config file to load from',
        default: '/piston/config.yaml'
    })
    .option('make-config', {
        alias: 'm',
        type: 'boolean',
        describe: 'create config file and populate defaults if it does not already exist'
    })
    .argv;

const options = [
    {
        key: 'log_level',
        desc: 'Level of data to log',
        default: 'INFO',
        options: Object.values(Logger.LogLevels),
        validators: [
            x => Object.values(Logger.LogLevels).includes(x) || `Log level ${x} does not exist`
        ]
    },
    {
        key: 'bind_address',
        desc: 'Address to bind REST API on\nThank @Bones for the number',
        default: '0.0.0.0:2000',
        validators: []
    },
    {
        key: 'data_directory',
        desc: 'Absolute path to store all piston related data at',
        default: '/piston',
        validators: [x=> fss.exists_sync(x) || `Directory ${x} does not exist`]
    },
    {
        key: 'runner_uid_min',
        desc: 'Minimum uid to use for runner',
        default: 1001,
        validators: []
    },
    {
        key: 'runner_uid_max',
        desc: 'Maximum uid to use for runner',
        default: 1500,
        validators: []
    },
    {
        key: 'runner_gid_min',
        desc: 'Minimum gid to use for runner',
        default: 1001,
        validators: []
    },
    {
        key: 'runner_gid_max',
        desc: 'Maximum gid to use for runner',
        default: 1500,
        validators: []
    },
    {
        key: 'disable_networking',
        desc: 'Set to true to disable networking',
        default: true,
        validators: []
    },
    {
        key: 'output_max_size',
        desc: 'Max size of each stdio buffer',
        default: 1024,
        validators: []
    },
    {
        key: 'max_process_count',
        desc: 'Max number of processes per job',
        default: 64,
        validators: []
    },
    {
        key: 'max_open_files',
        desc: 'Max number of open files per job',
        default: 2048,
        validators: []
    },
    {
        key: 'max_file_size',
        desc: 'Max file size in bytes for a file',
        default: 1000000, //1MB
        validators: []
    },
    {
        key: 'max_memory_usage',
        desc: 'Max memory usage in bytes',
        default: 256000000, //256MB
        validators: []
    },
    {
        key: 'repo_url',
        desc: 'URL of repo index',
        default: 'https://github.com/engineer-man/piston/releases/download/pkgs/index',
        validators: []
    }
];

const make_default_config = () => {
    let content = header.split('\n');

    options.forEach(option => {
        content = content.concat(option.desc.split('\n').map(x=>`# ${x}`));

        if (option.options) {
            content.push('# Options: ' + option.options.join(', '));
        }

        content.push(`${option.key}: ${option.default}`);

        content.push(''); // New line between
    });

    return content.join('\n');
};

logger.info(`Loading Configuration from ${argv.config}`);

if (argv['make-config']) {
    logger.debug('Make configuration flag is set');
}

if (!!argv['make-config'] && !fss.exists_sync(argv.config)) {
    logger.info('Writing default configuration...');
    try {
        fss.write_file_sync(argv.config, make_default_config());
    } catch (e) {
        logger.error('Error writing default configuration:', e.message);
        process.exit(1);
    }
}

let config = {};

logger.debug('Reading config file');

try {
    const cfg_content = fss.read_file_sync(argv.config);
    config = yaml.load(cfg_content);
} catch(err) {
    logger.error('Error reading configuration file:', err.message);
    process.exit(1);
}

logger.debug('Validating config entries');

let errored = false;

options.for_each(option => {
    logger.debug('Checking option', option.key);

    let cfg_val = config[option.key];

    if (cfg_val === undefined) {
        errored = true;
        logger.error(`Config key ${option.key} does not exist on currently loaded configuration`);
        return;
    }

    option.validators.for_each(validator => {
        let response = validator(cfg_val);

        if (!response) {
            errored = true;
            logger.error(`Config option ${option.key} failed validation:`, response);
            return;
        }
    });
});

if (errored) {
    process.exit(1);
}

logger.info('Configuration successfully loaded');

module.exports = config;
