#!/usr/bin/env node
require('nocamel');
const Logger = require('logplease');
const express = require('express');
const expressWs = require('express-ws');
const globals = require('./globals');
const config = require('./config');
const cp = require('child_process');
const path = require('path');
const fs = require('fs/promises');
const fss = require('fs');
const body_parser = require('body-parser');
const runtime = require('./runtime');

const logger = Logger.create('index');
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

    logger.info('Loading packages');

    const runtimes_data = cp.execSync(`nix eval --json ${config.flake_path}#pistonRuntimes --apply builtins.attrNames`).toString();
    const runtimes = JSON.parse(runtimes_data);
    
    runtimes.for_each(pkg => runtime.load_runtime(pkg));

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

    const api_v2 = require('./api/v2');
    const api_v3 = require('./api/v3');
    app.use('/api/v2', api_v2);
    app.use('/api/v3', api_v3);

    app.use((req, res, next) => {
        return res.status(404).send({ message: 'Not Found' });
    });

    logger.debug('Calling app.listen');
    const [address, port] = config.bind_address.split(':');

    app.listen(port, address, () => {
        logger.info('API server started on', config.bind_address);
    });
})();
