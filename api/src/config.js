const fss = require('fs');
const Logger = require('logplease');
const logger = Logger.create('config');

function parse_overrides(overrides) {
    try {
        return JSON.parse(overrides);
    } catch (e) {
        return null;
    }
}

function validate_overrides(overrides, options) {
    for (let language in overrides) {
        for (let key in overrides[language]) {
            if (
                ![
                    'max_process_count',
                    'max_open_files',
                    'max_file_size',
                    'compile_memory_limit',
                    'run_memory_limit',
                    'compile_timeout',
                    'run_timeout',
                    'output_max_size',
                ].includes(key)
            ) {
                logger.error(`Invalid overridden option: ${key}`);
                return false;
            }
            let option = options.find(o => o.key === key);
            let parser = option.parser;
            let raw = overrides[language][key];
            let value = parser(raw);
            let validators = option.validators;
            for (let validator of validators) {
                let response = validator(value, raw);
                if (response !== true) {
                    logger.error(
                        `Failed to validate overridden option: ${key}`,
                        response
                    );
                    return false;
                }
            }
            overrides[language][key] = value;
        }
        // Modifies the reference
        options[
            options.index_of(options.find(o => o.key === 'limit_overrides'))
        ] = overrides;
    }
    return true;
}

const options = [
    {
        key: 'log_level',
        desc: 'Level of data to log',
        default: 'INFO',
        options: Object.values(Logger.LogLevels),
        validators: [
            x =>
                Object.values(Logger.LogLevels).includes(x) ||
                `Log level ${x} does not exist`,
        ],
    },
    {
        key: 'bind_address',
        desc: 'Address to bind REST API on',
        default: '0.0.0.0:2000',
        validators: [],
    },
    {
        key: 'data_directory',
        desc: 'Absolute path to store all piston related data at',
        default: '/piston',
        validators: [
            x => fss.exists_sync(x) || `Directory ${x} does not exist`,
        ],
    },
    {
        key: 'runner_uid_min',
        desc: 'Minimum uid to use for runner',
        default: 1001,
        parser: parse_int,
        validators: [(x, raw) => !is_nan(x) || `${raw} is not a number`],
    },
    {
        key: 'runner_uid_max',
        desc: 'Maximum uid to use for runner',
        default: 1500,
        parser: parse_int,
        validators: [(x, raw) => !is_nan(x) || `${raw} is not a number`],
    },
    {
        key: 'runner_gid_min',
        desc: 'Minimum gid to use for runner',
        default: 1001,
        parser: parse_int,
        validators: [(x, raw) => !is_nan(x) || `${raw} is not a number`],
    },
    {
        key: 'runner_gid_max',
        desc: 'Maximum gid to use for runner',
        default: 1500,
        parser: parse_int,
        validators: [(x, raw) => !is_nan(x) || `${raw} is not a number`],
    },
    {
        key: 'disable_networking',
        desc: 'Set to true to disable networking',
        default: true,
        parser: x => x === 'true',
        validators: [x => typeof x === 'boolean' || `${x} is not a boolean`],
    },
    {
        key: 'output_max_size',
        desc: 'Max size of each stdio buffer',
        default: 1024,
        parser: parse_int,
        validators: [(x, raw) => !is_nan(x) || `${raw} is not a number`],
    },
    {
        key: 'max_process_count',
        desc: 'Max number of processes per job',
        default: 64,
        parser: parse_int,
        validators: [(x, raw) => !is_nan(x) || `${raw} is not a number`],
    },
    {
        key: 'max_open_files',
        desc: 'Max number of open files per job',
        default: 2048,
        parser: parse_int,
        validators: [(x, raw) => !is_nan(x) || `${raw} is not a number`],
    },
    {
        key: 'max_file_size',
        desc: 'Max file size in bytes for a file',
        default: 10000000, //10MB
        parser: parse_int,
        validators: [(x, raw) => !is_nan(x) || `${raw} is not a number`],
    },
    {
        key: 'compile_timeout',
        desc: 'Max time allowed for compile stage in milliseconds',
        default: 10000, // 10 seconds
        parser: parse_int,
        validators: [(x, raw) => !is_nan(x) || `${raw} is not a number`],
    },
    {
        key: 'run_timeout',
        desc: 'Max time allowed for run stage in milliseconds',
        default: 3000, // 3 seconds
        parser: parse_int,
        validators: [(x, raw) => !is_nan(x) || `${raw} is not a number`],
    },
    {
        key: 'compile_memory_limit',
        desc: 'Max memory usage for compile stage in bytes (set to -1 for no limit)',
        default: -1, // no limit
        parser: parse_int,
        validators: [(x, raw) => !is_nan(x) || `${raw} is not a number`],
    },
    {
        key: 'run_memory_limit',
        desc: 'Max memory usage for run stage in bytes (set to -1 for no limit)',
        default: -1, // no limit
        parser: parse_int,
        validators: [(x, raw) => !is_nan(x) || `${raw} is not a number`],
    },
    {
        key: 'repo_url',
        desc: 'URL of repo index',
        default:
            'https://github.com/engineer-man/piston/releases/download/pkgs/index',
        validators: [],
    },
    {
        key: 'max_concurrent_jobs',
        desc: 'Maximum number of concurrent jobs to run at one time',
        default: 64,
        parser: parse_int,
        validators: [x => x > 0 || `${x} cannot be negative`],
    },
    {
        key: 'limit_overrides',
        desc: 'Per-language exceptions in JSON format for each of:\
        max_process_count, max_open_files, max_file_size, compile_memory_limit,\
        run_memory_limit, compile_timeout, run_timeout, output_max_size',
        default: {},
        parser: parse_overrides,
        validators: [
            x => !!x || `Invalid JSON format for the overrides\n${x}`,
            (overrides, _, options) =>
                validate_overrides(overrides, options) ||
                `Failed to validate the overrides`,
        ],
    },
];

logger.info(`Loading Configuration from environment`);

let errored = false;

let config = {};

options.forEach(option => {
    const env_key = 'PISTON_' + option.key.to_upper_case();

    const parser = option.parser || (x => x);

    const env_val = process.env[env_key];

    const parsed_val = parser(env_val);

    const value = env_val === undefined ? option.default : parsed_val;

    option.validators.for_each(validator => {
        let response = null;
        if (env_val) response = validator(parsed_val, env_val, options);
        else response = validator(value, value, options);

        if (response !== true) {
            errored = true;
            logger.error(
                `Config option ${option.key} failed validation:`,
                response
            );
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
