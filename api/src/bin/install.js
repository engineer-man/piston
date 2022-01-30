#!/usr/bin/env node
// Downloads all packages specified into the nix store
require('nocamel');
const config = require('../config');
const Logger = require('logplease');
const logger = Logger.create('install');
const cp = require('child_process');

logger.info('Setting loglevel to', config.log_level);
Logger.setLogLevel(config.log_level);

const runtimes_path = `${config.flake_path}#pistonRuntimeSets.${config.runtime_set}`;
logger.info(`Installing runtimes in ${runtimes_path}`);

logger.debug("Getting package listing");
const runtimes = JSON.parse(cp.execSync(`nix eval --json ${runtimes_path} --apply builtins.attrNames`));

logger.info(`Got runtimes: ${runtimes}`);

runtimes.forEach(runtime => {
        logger.debug(`Loading metadata for ${runtime}`);
        const runtime_metadata = JSON.parse(cp.execSync(`nix eval --json ${runtimes_path}.${runtime}.metadata`));
        const namever = `${runtime}-${runtime_metadata.version}`;
        logger.info(`Installing ${namever}`);
        

        function install(key){
            logger.debug(`Installing ${namever}-${key}`);
            const command = `nix build ${runtimes_path}.${runtime}.metadata.${key} -o /piston/runtimes/${namever}-${key}`;
            cp.execSync(command);
        }

        install("run");
        if(runtime_metadata.compile) install("compile");        

        logger.info(`Installed ${namever}`);
});

logger.info("Done");