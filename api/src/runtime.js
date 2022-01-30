const logger = require('logplease').create('runtime');
const cp = require('child_process');
const config = require('./config');
const globals = require('./globals');
const fss = require('fs');
const path = require('path');

const runtimes = [];


class Runtime {
    constructor({ language, version, aliases, runtime, run, compile, packageSupport, flake_key }) {
        this.language = language;
        this.runtime = runtime;
        this.aliases = aliases;
        this.version = version; 
        
        this.run = run;
        this.compile = compile;

        this.flake_key = flake_key;
        this.package_support = packageSupport;
    }

    ensure_built(){
        logger.info(`Ensuring ${this} is built`);

        const flake_key = this.flake_key;

        function _ensure_built(key){
            const command = `nix build ${config.flake_path}#pistonRuntimes.${flake_key}.metadata.${key} --no-link`;
            cp.execSync(command, {stdio: "pipe"})
        }

        _ensure_built("run");
        if(this.compiled) _ensure_built("compile");

        logger.debug(`Finished ensuring ${this} is installed`)

    }

    static load_runtime(flake_key){
        logger.info(`Loading ${flake_key}`)
        const metadata_command = `nix eval --json ${config.flake_path}#pistonRuntimes.${flake_key}.metadata`;
        const metadata = JSON.parse(cp.execSync(metadata_command));
        
        const this_runtime = new Runtime({
            ...metadata,
            flake_key
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

