#!/usr/bin/env node
require('nocamel');
const Logger = require('logplease');
const express = require('express');
const expressWs = require('express-ws');
const globals = require('../globals');
const config = require('../config');
const cp = require('child_process');
const path = require('path');
const fss = require('fs');
const body_parser = require('body-parser');
const runtime = require('../runtime');

const logger = Logger.create('pistond');
const app = express();
expressWs(app);

(async () => {
    logger.info('Setting loglevel to', config.log_level);
    Logger.setLogLevel(config.log_level);
    logger.debug('Ensuring data directories exist');

    Object.values(globals.data_directories).for_each(dir => {
        let data_path = path.join(config.data_directory, dir);

        logger.debug(`Ensuring ${data_path} exists`);

        if (!fss.exists_sync(data_path)) {
            logger.info(`${data_path} does not exist.. Creating..`);

            try {
                fss.mkdir_sync(data_path);
            } catch (e) {
                logger.error(`Failed to create ${data_path}: `, e.message);
            }
        }
    });
    fss.chmodSync(path.join(config.data_directory, globals.data_directories.jobs), 0o711)

    logger.info('Loading packages');

    const runtimes_data = cp
        .execSync(
            `nix eval --json ${config.flake_path}#pistonRuntimeSets.${config.runtime_set} --apply builtins.attrNames`
        )
        .toString();
    const runtime_names_unordered = JSON.parse(runtimes_data);

    const mainstream_runtimes_data = cp
        .execSync(
            `nix eval --json ${config.flake_path}#pistonMainstreamRuntimes`
        )
        .toString();
    const mainstream_runtimes = JSON.parse(mainstream_runtimes_data).filter(runtime =>
        runtime_names_unordered.includes(runtime)
    );
    const runtime_names = [
        ...mainstream_runtimes,
        ...runtime_names_unordered.filter(
            runtime => !mainstream_runtimes.includes(runtime)
        ),
    ];

    logger.info('Loading the runtimes from the flakes');
    const runtimes = runtime_names.map(runtime_name => {
        logger.info(`Loading ${runtime_name}`);
        return runtime.get_runtime_from_flakes(runtime_name);
    });
    logger.info('Ensuring all of the runtimes are built');
    runtimes.for_each(r => r.ensure_built());

    Object.freeze(runtimes);
    app.locals.runtimes = runtimes;

    logger.info('Starting API Server');
    logger.debug('Constructing Express App');
    logger.debug('Registering middleware');

    app.use(body_parser.urlencoded({ extended: true }));
    app.use(body_parser.json());

    app.use((err, req, res, next) => {
        return res.status(400).send({
            stack: err.stack,
        });
    });

    logger.debug('Registering Routes');

    const api_v2 = require('../api/v2');
    app.use('/api/v2', api_v2);

    app.use((req, res, next) => {
        return res.status(404).send({ message: 'Not Found' });
    });

    logger.debug('Calling app.listen');
    const [address, port] = config.bind_address.split(':');

    app.listen(port, address, () => {
        logger.info('API server started on', config.bind_address);
    });
})();
