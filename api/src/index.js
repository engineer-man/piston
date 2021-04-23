#!/usr/bin/env node
require('nocamel');
const Logger = require('logplease');
const express = require('express');
const globals = require('./globals');
const config = require('./config');
const path = require('path');
const fs = require('fs/promises');
const fss = require('fs');
const body_parser = require('body-parser');
const runtime = require('./runtime');
const { validationResult } = require('express-validator');

const logger = Logger.create('index');
const app = express();

(async () => {
    logger.info('Setting loglevel to',config.log_level);
    Logger.setLogLevel(config.log_level);
    logger.debug('Ensuring data directories exist');

    Object.values(globals.data_directories).for_each(dir => {
        let data_path = path.join(config.data_directory, dir);

        logger.debug(`Ensuring ${data_path} exists`);

        if (!fss.exists_sync(data_path)) {
            logger.info(`${data_path} does not exist.. Creating..`);

            try {
                fss.mkdir_sync(data_path);
            } catch(e) {
                logger.error(`Failed to create ${data_path}: `, e.message);
            }
        }
    });

    logger.info('Loading packages');
    const pkgdir = path.join(config.data_directory,globals.data_directories.packages);

    const pkglist = await fs.readdir(pkgdir);

    const languages = await Promise.all(
        pkglist.map(lang=>
            fs.readdir(path.join(pkgdir,lang))
                .then(x=>x.map(y=>path.join(pkgdir, lang, y)))
        ));

    const installed_languages = languages
        .flat()
        .filter(pkg => fss.exists_sync(path.join(pkg, globals.pkg_installed_file)));

    installed_languages.forEach(pkg => new runtime.Runtime(pkg));

    logger.info('Starting API Server');
    logger.debug('Constructing Express App');
    logger.debug('Registering middleware');

    app.use(body_parser.urlencoded({ extended: true }));
    app.use(body_parser.json());

    app.use(function (err, req, res, next) {
        return res
            .status(400)
            .send({
                stack: err.stack
            })
      })

    const validate = (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res
                .status(400)
                .send({
                    message: errors.array()
                });
        }

        next();
    };

    logger.debug('Registering Routes');

    const ppman_routes = require('./ppman/routes');
    const executor_routes = require('./executor/routes');

    app.get('/api/v1/packages', ppman_routes.package_list);
    app.post('/api/v1/packages/:language/:version', ppman_routes.package_install);
    app.delete('/api/v1/packages/:language/:version', ppman_routes.package_uninstall);
    app.post('/api/v1/execute',
        executor_routes.run_job_validators,
        validate,
        executor_routes.run_job
    );
    app.get('/api/v1/runtimes', (req, res) => {
        const runtimes = runtime
            .map(rt => {
                return {
                    language: rt.language,
                    version: rt.version.raw,
                    aliases: rt.aliases
                };
            });

        return res
            .status(200)
            .send(runtimes);
    });

    app.use(function (req,res,next){
        return res.status(404).send({message: 'Not Found'});
    });

    logger.debug('Calling app.listen');
    const [ address, port ] = config.bind_address.split(':');

    app.listen(port, address, () => {
        logger.info('API server started on', config.bind_address);
    });
})();
