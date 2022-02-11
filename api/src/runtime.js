const logger = require('logplease').create('runtime');
const cp = require('child_process');
const config = require('./config');

const runtimes = [];

class Runtime {
    constructor({
        language,
        version,
        aliases,
        runtime,
        run,
        compile,
        packageSupport,
        flake_path,
        timeouts,
        memory_limits,
        max_process_count,
        max_open_files,
        max_file_size,
        output_max_size,
    }) {
        this.language = language;
        this.runtime = runtime;

        this.timeouts = timeouts;
        this.memory_limits = memory_limits;
        this.max_process_count = max_process_count;
        this.max_open_files = max_open_files;
        this.max_file_size = max_file_size;
        this.output_max_size = output_max_size;

        this.aliases = aliases;
        this.version = version;

        this.run = run;
        this.compile = compile;

        this.flake_path = flake_path;
        this.package_support = packageSupport;
    }

    static compute_single_limit(
        language_name,
        limit_name,
        language_limit_overrides
    ) {
        return (
            (config.limit_overrides[language_name] &&
                config.limit_overrides[language_name][limit_name]) ||
            (language_limit_overrides &&
                language_limit_overrides[limit_name]) ||
            config[limit_name]
        );
    }

    static compute_all_limits(language_name, language_limit_overrides) {
        return {
            timeouts: {
                compile: this.compute_single_limit(
                    language_name,
                    'compile_timeout',
                    language_limit_overrides
                ),
                run: this.compute_single_limit(
                    language_name,
                    'run_timeout',
                    language_limit_overrides
                ),
            },
            memory_limits: {
                compile: this.compute_single_limit(
                    language_name,
                    'compile_memory_limit',
                    language_limit_overrides
                ),
                run: this.compute_single_limit(
                    language_name,
                    'run_memory_limit',
                    language_limit_overrides
                ),
            },
            max_process_count: this.compute_single_limit(
                language_name,
                'max_process_count',
                language_limit_overrides
            ),
            max_open_files: this.compute_single_limit(
                language_name,
                'max_open_files',
                language_limit_overrides
            ),
            max_file_size: this.compute_single_limit(
                language_name,
                'max_file_size',
                language_limit_overrides
            ),
            output_max_size: this.compute_single_limit(
                language_name,
                'output_max_size',
                language_limit_overrides
            ),
        };
    }

    ensure_built() {
        logger.info(`Ensuring ${this} is built`);

        const flake_path = this.flake_path;

        function _ensure_built(key) {
            const command = `nix build ${flake_path}.metadata.${key} --no-link`;
            cp.execSync(command, { stdio: 'pipe' });
        }

        _ensure_built('run');
        if (this.compiled) _ensure_built('compile');

        logger.debug(`Finished ensuring ${this} is installed`);
    }

    static load_runtime(language_name) {
        logger.info(`Loading ${language_name}`);
        const flake_path = `${config.flake_path}#pistonRuntimeSets.${config.runtime_set}.${language_name}`;
        const metadata_command = `nix eval --json ${flake_path}.metadata`;
        const metadata = JSON.parse(cp.execSync(metadata_command));

        const this_runtime = new Runtime({
            ...metadata,
            ...Runtime.compute_all_limits(
                metadata.language,
                metadata.limitOverrides
            ),
            flake_path,
        });

        this_runtime.ensure_built();

        runtimes.push(this_runtime);

        logger.debug(`Package ${language_name} was loaded`);
    }

    get compiled() {
        return this.compile !== null;
    }

    toString() {
        return `${this.language}-${this.version}`;
    }
}

module.exports = runtimes;
module.exports.Runtime = Runtime;
module.exports.load_runtime = Runtime.load_runtime;
