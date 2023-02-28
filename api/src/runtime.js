import { create } from 'logplease';
import { parse, satisfies, rcompare } from 'semver';
import config from './config';
import { platform } from './globals';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const logger = create('runtime', {});

/** @type {Array<Runtime>} */
const runtimes = [];

class Runtime {
    constructor({
        language,
        version,
        aliases,
        pkgdir,
        runtime,
        timeouts,
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
            // @ts-ignore
            readFileSync(join(package_dir, 'pkg-info.json'))
        );

        let {
            language,
            version,
            build_platform,
            aliases,
            provides,
            limit_overrides,
        } = info;
        version = parse(version);

        if (build_platform !== platform) {
            logger.warn(
                `Package ${language}-${version} was built for platform ${build_platform}, ` +
                `but our platform is ${platform}`
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
                // @ts-ignore
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
            this._compiled = existsSync(join(this.pkgdir, 'compile'));
        }

        return this._compiled;
    }

    get env_vars() {
        if (!this._env_vars) {
            const env_file = join(this.pkgdir, '.env');
            const env_content = readFileSync(env_file).toString();

            this._env_vars = {};

            env_content
                .trim()
                .split('\n')
                .map(line => line.split('=', 2))
                .forEach(([key, val]) => {
                    this._env_vars[key.trim()] = val.trim();
                });
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

const _runtimes = runtimes;
export { _runtimes as runtimes };
const _Runtime = Runtime;
export { _Runtime as Runtime };
export function get_runtimes_matching_language_version(lang, ver) {
    return runtimes.filter(
        rt =>
            (rt.language == lang || rt.aliases.includes(lang)) &&
            satisfies(rt.version, ver)
    );
}
export function get_latest_runtime_matching_language_version(
    lang,
    ver
) {
    return get_runtimes_matching_language_version(lang, ver)
        .sort((a, b) => rcompare(a.version, b.version))[0];
}

export function get_runtime_by_name_and_version(runtime, ver) {
    return runtimes.find(
        rt =>
            (rt.runtime == runtime ||
                (rt.runtime === undefined && rt.language == runtime)) &&
            satisfies(rt.version, ver)
    );
}

export const load_package = Runtime.load_package;
