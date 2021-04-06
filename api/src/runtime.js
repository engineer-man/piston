const logger = require('logplease').create('runtime');
const semver = require('semver');
const config = require('./config');
const globals = require('./globals');
const fss = require('fs');
const path = require('path');

const runtimes = [];

class Runtime {

    constructor(package_dir){
        let info = JSON.parse(
            fss.read_file_sync(path.join(package_dir, 'pkg-info.json'))
        );

        const { language, version, build_platform, aliases } = info;

        this.pkgdir = package_dir;
        this.language = language;
        this.version = semver.parse(version);
        this.aliases = aliases;

        if (build_platform !== globals.platform) {
            logger.warn(
                `Package ${language}-${version} was built for platform ${build_platform}, ` +
                `but our platform is ${globals.platform}`
            );
        }

        logger.debug(`Package ${language}-${version} was loaded`);

        runtimes.push(this);
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

            this._env_vars = {};

            env_content
                .trim()
                .split('\n')
                .map(line => line.split('=',2))
                .forEach(([key,val]) => {
                    this._env_vars[key.trim()] = val.trim();
                });
        }

        return this._env_vars;
    }

    toString() {
        return `${this.language}-${this.version.raw}`;
    }
}

module.exports = runtimes;
module.exports.Runtime = Runtime;
module.exports.get_runtimes_matching_language_version = function(lang, ver){
    return runtimes.filter(rt => (rt.language == lang || rt.aliases.includes(lang)) && semver.satisfies(rt.version, ver));
};
module.exports.get_latest_runtime_matching_language_version = function(lang, ver){
    return module.exports.get_runtimes_matching_language_version(lang, ver)
        .sort((a,b) => semver.rcompare(a.version, b.version))[0];
};
