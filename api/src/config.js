const fss = require('fs');
const Logger = require('logplease');
const logger = Logger.create('config');


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
        parser: parse_int,
        validators: [
            (x,raw) => !isNaN(x) || `${raw} is not a number`,
        ]
    },
    {
        key: 'runner_uid_max',
        desc: 'Maximum uid to use for runner',
        default: 1500,
        parser: parse_int,
        validators: [
            (x,raw) => !isNaN(x) || `${raw} is not a number`,
        ]
    },
    {
        key: 'runner_gid_min',
        desc: 'Minimum gid to use for runner',
        default: 1001,
        parser: parse_int,
        validators: [
            (x,raw) => !isNaN(x) || `${raw} is not a number`,
        ]
    },
    {
        key: 'runner_gid_max',
        desc: 'Maximum gid to use for runner',
        default: 1500,
        parser: parse_int,
        validators: [
            (x,raw) => !isNaN(x) || `${raw} is not a number`,
        ]
    },
    {
        key: 'disable_networking',
        desc: 'Set to true to disable networking',
        default: true,
        parser: x => x === "true",
        validators: [
            x => typeof x === "boolean" || `${x} is not a boolean`
        ]
    },
    {
        key: 'output_max_size',
        desc: 'Max size of each stdio buffer',
        default: 1024,
        parser: parse_int,
        validators: [
            (x,raw) => !isNaN(x) || `${raw} is not a number`,
        ]
    },
    {
        key: 'max_process_count',
        desc: 'Max number of processes per job',
        default: 64,
        parser: parse_int,
        validators: [
            (x,raw) => !isNaN(x) || `${raw} is not a number`,
        ]
    },
    {
        key: 'max_open_files',
        desc: 'Max number of open files per job',
        default: 2048,
        parser: parse_int,
        validators: [
            (x,raw) => !isNaN(x) || `${raw} is not a number`,
        ]
    },
    {
        key: 'max_file_size',
        desc: 'Max file size in bytes for a file',
        default: 10000000, //10MB
        parser: parse_int,
        validators: [
            (x,raw) => !isNaN(x) || `${raw} is not a number`,
        ]
    },
    {
        key: 'compile_memory_limit',
        desc: 'Max memory usage for compile stage in bytes (set to -1 for no limit)',
        default: -1, // no limit
        parser: parse_int,
        validators: [
            (x,raw) => !isNaN(x) || `${raw} is not a number`,
        ]
    },
    {
        key: 'run_memory_limit',
        desc: 'Max memory usage for run stage in bytes (set to -1 for no limit)',
        default: -1, // no limit
        parser: parse_int,
        validators: [
            (x,raw) => !isNaN(x) || `${raw} is not a number`,
        ]
    },
    {
        key: 'repo_url',
        desc: 'URL of repo index',
        default: 'https://github.com/engineer-man/piston/releases/download/pkgs/index',
        validators: []
    }
];

logger.info(`Loading Configuration from environment`);

let errored = false;

let config = {};

options.forEach(option => {
    const env_key = "PISTON_" + option.key.to_upper_case();

    const parser = option.parser || (x=>x);

    const env_val = process.env[env_key];

    const parsed_val = parser(env_val);

    
    const value = env_val || option.default;


    option.validators.for_each(validator => {
        let response = null;
        if(env_val)
            response = validator(parsed_val, env_val);
        else
            response = validator(value, value);

        if (response !== true) {
            errored = true;
            logger.error(`Config option ${option.key} failed validation:`, response);
            return;
        }
    });

    config[option.key] = value;
});

if (errored) {
    process.exit(1);
}

logger.info('Configuration successfully loaded');


module.exports = config;
