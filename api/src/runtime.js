const logger = require('logplease').create('runtime');
const semver = require('semver');
const config = require('./config');
const globals = require('./globals');
const fss = require('fs');
const path = require('path');

const runtimes = [];

class Runtime {
    constructor({
        language,
        version,
        aliases,
        pkgdir,
        runtime,
        timeouts,
        cpu_times,
        memory_limits,
        max_process_count,
        max_open_files,
        max_file_size,
        output_max_size,
    }) {
        this.language = language;
        this.version = version;
        this.aliases = aliases || [];
        this.pkgdir = pkgdir;
        this.runtime = runtime;
        this.timeouts = timeouts;
        this.cpu_times = cpu_times;
        this.memory_limits = memory_limits;
        this.max_process_count = max_process_count;
        this.max_open_files = max_open_files;
        this.max_file_size = max_file_size;
        this.output_max_size = output_max_size;
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
            cpu_times: {
                compile: this.compute_single_limit(
                    language_name,
                    'compile_cpu_time',
                    language_limit_overrides
                ),
                run: this.compute_single_limit(
                    language_name,
                    'run_cpu_time',
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

    static load_package(package_dir) {
        let info = JSON.parse(
            fss.read_file_sync(path.join(package_dir, 'pkg-info.json'))
        );

        let {
            language,
            version,
            build_platform,
            aliases,
            provides,
            limit_overrides,
        } = info;
        version = semver.parse(version);

        if (build_platform !== globals.platform) {
            logger.warn(
                `Package ${language}-${version} was built for platform ${build_platform}, ` +
                    `but our platform is ${globals.platform}`
            );
        }

        if (provides) {
            // Multiple languages in 1 package
            provides.forEach(lang => {
                runtimes.push(
                    new Runtime({
                        language: lang.language,
                        aliases: lang.aliases,
                        version,
                        pkgdir: package_dir,
                        runtime: language,
                        ...Runtime.compute_all_limits(
                            lang.language,
                            lang.limit_overrides
                        ),
                    })
                );
            });
        } else {
            runtimes.push(
                new Runtime({
                    language,
                    version,
                    aliases,
                    pkgdir: package_dir,
                    ...Runtime.compute_all_limits(language, limit_overrides),
                })
            );
        }

        logger.debug(`Package ${language}-${version} was loaded`);
    }

    get compiled() {
        if (this._compiled === undefined) {
            this._compiled = fss.exists_sync(path.join(this.pkgdir, 'compile'));
        }

        return this._compiled;
    }

    get env_vars() {
        if (!this._env_vars) {
            const env_file = path.join(this.pkgdir, '.env');
            const env_content = fss.read_file_sync(env_file).toString();

            this._env_vars = env_content.trim().split('\n');
        }

        return this._env_vars;
    }

    toString() {
        return `${this.language}-${this.version.raw}`;
    }

    unregister() {
        const index = runtimes.indexOf(this);
        runtimes.splice(index, 1); //Remove from runtimes list
    }
}

module.exports = runtimes;
module.exports.Runtime = Runtime;
module.exports.get_runtimes_matching_language_version = function (lang, ver) {
    return runtimes.filter(
        rt =>
            (rt.language == lang || rt.aliases.includes(lang)) &&
            semver.satisfies(rt.version, ver)
    );
};
module.exports.get_latest_runtime_matching_language_version = function (
    lang,
    ver
) {
    return module.exports
        .get_runtimes_matching_language_version(lang, ver)
        .sort((a, b) => semver.rcompare(a.version, b.version))[0];
};

module.exports.get_runtime_by_name_and_version = function (runtime, ver) {
    return runtimes.find(
        rt =>
            (rt.runtime == runtime ||
                (rt.runtime === undefined && rt.language == runtime)) &&
            semver.satisfies(rt.version, ver)
    );
};

module.exports.load_package = Runtime.load_package;
