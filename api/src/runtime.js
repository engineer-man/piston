const logger = require('logplease').create('runtime');
const cp = require('child_process');
const config = require('./config');
const globals = require('./globals');
const fss = require('fs');
const path = require('path');

const runtimes = [];


class Runtime {
    constructor({ language, version, aliases, runtime, run, compile, packageSupport, flake_path }) {
        this.language = language;
        this.runtime = runtime;
        this.aliases = aliases;
        this.version = version; 
        
        this.run = run;
        this.compile = compile;

        this.flake_path = flake_path;
        this.package_support = packageSupport;
    }

    ensure_built(){
        logger.info(`Ensuring ${this} is built`);

        const flake_path = this.flake_path;

        function _ensure_built(key){
            const command = `nix build ${flake_path}.metadata.${key} --no-link`;
            cp.execSync(command, {stdio: "pipe"})
        }

        _ensure_built("run");
        if(this.compiled) _ensure_built("compile");

        logger.debug(`Finished ensuring ${this} is installed`)

    }

    static load_runtime(flake_key){
        logger.info(`Loading ${flake_key}`)
        const flake_path = `${config.flake_path}#pistonRuntimeSets.${config.runtime_set}.${flake_key}`;
        const metadata_command = `nix eval --json ${flake_path}.metadata`;
        const metadata = JSON.parse(cp.execSync(metadata_command));
        
        const this_runtime = new Runtime({
            ...metadata,
            flake_path
        });

        this_runtime.ensure_built();

        runtimes.push(this_runtime);
        
        
        logger.debug(`Package ${flake_key} was loaded`);

    }

    get compiled() {
        return this.compile !== null;
    }

    get id(){
        return runtimes.indexOf(this);
    }

    toString() {
        return `${this.language}-${this.version}`;
    }

}

module.exports = runtimes;
module.exports.Runtime = Runtime;
module.exports.load_runtime = Runtime.load_runtime;

