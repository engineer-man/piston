const fss = require('fs');
const Logger = require('logplease');
const logger = Logger.create('config');

const options = {
    log_level: {
        desc: 'Level of data to log',
        default: 'INFO',
        validators: [
            x =>
                Object.values(Logger.LogLevels).includes(x) ||
                `Log level ${x} does not exist`,
        ],
    },
    bind_address: {
        desc: 'Address to bind REST API on',
        default: `0.0.0.0:${process.env['PORT'] || 2000}`,
        validators: [],
    },
    data_directory: {
        desc: 'Absolute path to store all piston related data at',
        default: '/piston',
        validators: [
            x => fss.exists_sync(x) || `Directory ${x} does not exist`,
        ],
    },
    runner_uid_min: {
        desc: 'Minimum uid to use for runner',
        default: 1001,
        parser: parse_int,
        validators: [(x, raw) => !is_nan(x) || `${raw} is not a number`],
    },
    runner_uid_max: {
        desc: 'Maximum uid to use for runner',
        default: 1500,
        parser: parse_int,
        validators: [(x, raw) => !is_nan(x) || `${raw} is not a number`],
    },
    runner_gid_min: {
        desc: 'Minimum gid to use for runner',
        default: 1001,
        parser: parse_int,
        validators: [(x, raw) => !is_nan(x) || `${raw} is not a number`],
    },
    runner_gid_max: {
        desc: 'Maximum gid to use for runner',
        default: 1500,
        parser: parse_int,
        validators: [(x, raw) => !is_nan(x) || `${raw} is not a number`],
    },
    disable_networking: {
        desc: 'Set to true to disable networking',
        default: true,
        parser: x => x === 'true',
        validators: [x => typeof x === 'boolean' || `${x} is not a boolean`],
    },
    output_max_size: {
        desc: 'Max size of each stdio buffer',
        default: 1024,
        parser: parse_int,
        validators: [(x, raw) => !is_nan(x) || `${raw} is not a number`],
    },
    max_process_count: {
        desc: 'Max number of processes per job',
        default: 64,
        parser: parse_int,
        validators: [(x, raw) => !is_nan(x) || `${raw} is not a number`],
    },
    max_open_files: {
        desc: 'Max number of open files per job',
        default: 2048,
        parser: parse_int,
        validators: [(x, raw) => !is_nan(x) || `${raw} is not a number`],
    },
    max_file_size: {
        desc: 'Max file size in bytes for a file',
        default: 10000000, //10MB
        parser: parse_int,
        validators: [(x, raw) => !is_nan(x) || `${raw} is not a number`],
    },
    compile_timeout: {
        desc: 'Max time allowed for compile stage in milliseconds',
        default: 10000, // 10 seconds
        parser: parse_int,
        validators: [(x, raw) => !is_nan(x) || `${raw} is not a number`],
    },
    run_timeout: {
        desc: 'Max time allowed for run stage in milliseconds',
        default: 3000, // 3 seconds
        parser: parse_int,
        validators: [(x, raw) => !is_nan(x) || `${raw} is not a number`],
    },
    compile_cpu_time: {
        desc: 'Max CPU time allowed for compile stage in milliseconds',
        default: 10000, // 10 seconds
        parser: parse_int,
        validators: [(x, raw) => !is_nan(x) || `${raw} is not a number`],
    },
    run_cpu_time: {
        desc: 'Max CPU time allowed for run stage in milliseconds',
        default: 3000, // 3 seconds
        parser: parse_int,
        validators: [(x, raw) => !is_nan(x) || `${raw} is not a number`],
    },
    compile_memory_limit: {
        desc: 'Max memory usage for compile stage in bytes (set to -1 for no limit)',
        default: -1, // no limit
        parser: parse_int,
        validators: [(x, raw) => !is_nan(x) || `${raw} is not a number`],
    },
    run_memory_limit: {
        desc: 'Max memory usage for run stage in bytes (set to -1 for no limit)',
        default: -1, // no limit
        parser: parse_int,
        validators: [(x, raw) => !is_nan(x) || `${raw} is not a number`],
    },
    repo_url: {
        desc: 'URL of repo index',
        default:
            'https://github.com/engineer-man/piston/releases/download/pkgs/index',
        validators: [],
    },
    max_concurrent_jobs: {
        desc: 'Maximum number of concurrent jobs to run at one time',
        default: 64,
        parser: parse_int,
        validators: [x => x > 0 || `${x} cannot be negative`],
    },
    limit_overrides: {
        desc: 'Per-language exceptions in JSON format for each of:\
        max_process_count, max_open_files, max_file_size, compile_memory_limit,\
        run_memory_limit, compile_timeout, run_timeout, compile_cpu_time, run_cpu_time, output_max_size',
        default: {},
        parser: parse_overrides,
        validators: [
            x => !!x || `Failed to parse the overrides\n${x}`,
            validate_overrides,
        ],
    },
};

Object.freeze(options);

function apply_validators(validators, validator_parameters) {
    for (const validator of validators) {
        const validation_response = validator(...validator_parameters);
        if (validation_response !== true) {
            return validation_response;
        }
    }
    return true;
}

function parse_overrides(overrides_string) {
    function get_parsed_json_or_null(overrides) {
        try {
            return JSON.parse(overrides);
        } catch (e) {
            return null;
        }
    }

    const overrides = get_parsed_json_or_null(overrides_string);
    if (overrides === null) {
        return null;
    }
    const parsed_overrides = {};
    for (const language in overrides) {
        parsed_overrides[language] = {};
        for (const key in overrides[language]) {
            if (
                ![
                    'max_process_count',
                    'max_open_files',
                    'max_file_size',
                    'compile_memory_limit',
                    'run_memory_limit',
                    'compile_timeout',
                    'run_timeout',
                    'compile_cpu_time',
                    'run_cpu_time',
                    'output_max_size',
                ].includes(key)
            ) {
                return null;
            }
            // Find the option for the override
            const option = options[key];
            const parser = option.parser;
            const raw_value = overrides[language][key];
            const parsed_value = parser(raw_value);
            parsed_overrides[language][key] = parsed_value;
        }
    }
    return parsed_overrides;
}

function validate_overrides(overrides) {
    for (const language in overrides) {
        for (const key in overrides[language]) {
            const value = overrides[language][key];
            const option = options[key];
            const validators = option.validators;
            const validation_response = apply_validators(validators, [
                value,
                value,
            ]);
            if (validation_response !== true) {
                return `In overridden option ${key} for ${language}, ${validation_response}`;
            }
        }
    }
    return true;
}

logger.info(`Loading Configuration from environment`);

let config = {};

for (const option_name in options) {
    const env_key = 'PISTON_' + option_name.to_upper_case();
    const option = options[option_name];
    const parser = option.parser || (x => x);
    const env_val = process.env[env_key];
    const parsed_val = parser(env_val);
    const value = env_val === undefined ? option.default : parsed_val;
    const validator_parameters =
        env_val === undefined ? [value, value] : [parsed_val, env_val];
    const validation_response = apply_validators(
        option.validators,
        validator_parameters
    );
    if (validation_response !== true) {
        logger.error(
            `Config option ${option_name} failed validation:`,
            validation_response
        );
        process.exit(1);
    }
    config[option_name] = value;
}

logger.info('Configuration successfully loaded');

module.exports = config;
