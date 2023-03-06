#!/usr/bin/env node
import { create, setLogLevel } from 'logplease';
import express from 'express';
import expressWs from 'express-ws';
import * as globals from './globals.js';
import config from './config.js';
import { join } from 'path';
import { readdir } from 'fs/promises';
import { existsSync, mkdirSync, chmodSync } from 'fs';
import { urlencoded, json } from 'body-parser';
import { load_package } from './runtime.js';

const logger = create('index', {});
const app = express();
expressWs(app);

(async () => {
    logger.info('Setting loglevel to');
    // @ts-ignore
    setLogLevel(config.log_level);
    logger.debug('Ensuring data directories exist');

    Object.values(globals.data_directories).forEach(dir => {
        let data_path = join(config.data_directory, dir);

        logger.debug(`Ensuring ${data_path} exists`);

        if (!existsSync(data_path)) {
            logger.info(`${data_path} does not exist.. Creating..`);

            try {
                mkdirSync(data_path);
            } catch (e) {
                logger.error(`Failed to create ${data_path}: `, e.message);
            }
        }
    });
    chmodSync(join(config.data_directory, globals.data_directories.jobs), 0o711)

    logger.info('Loading packages');
    const pkgdir = join(
        config.data_directory,
        globals.data_directories.packages
    );

    const pkglist = await readdir(pkgdir);

    const languages = await Promise.all(
        pkglist.map(async lang => {
            const x = await readdir(join(pkgdir, lang));
            return x.map(y => join(pkgdir, lang, y));
        })
    );

    const installed_languages = languages
        .flat()
        .filter(pkg =>
            existsSync(join(pkg, globals.pkg_installed_file))
        );

    installed_languages.forEach(pkg => load_package(pkg));

    logger.info('Starting API Server');
    logger.debug('Constructing Express App');
    logger.debug('Registering middleware');

    app.use(urlencoded({ extended: true }));
    app.use(json());

    app.use((err, req, res, next) => {
        return res.status(400).send({
            stack: err.stack,
        });
    });

    logger.debug('Registering Routes');

    const api_v2 = require('./api/v2').default;
    app.use('/api/v2', api_v2);

    app.use((req, res, next) => {
        return res.status(404).send({ message: 'Not Found' });
    });

    logger.debug('Calling app.listen');
    const [address, port] = config.bind_address.split(':');

    app.listen(+port, address, () => {
        logger.info('API server started on', config.bind_address);
    });
})();
