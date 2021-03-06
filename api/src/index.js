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
const {validationResult} = require('express-validator'); //eslint-disable-line snakecasejs/snakecasejs

const logger = Logger.create('index');
const app = express();

(async () => {
    logger.info('Setting loglevel to',config.log_level);
    Logger.setLogLevel(config.log_level); //eslint-disable-line snakecasejs/snakecasejs

    logger.debug('Ensuring data directories exist');
    Object.values(globals.data_directories).forEach(dir => {
        var data_path = path.join(config.data_directory, dir);
        logger.debug(`Ensuring ${data_path} exists`);
        if(!fss.exists_sync(data_path)){
            logger.info(`${data_path} does not exist.. Creating..`);
            try{
                fss.mkdir_sync(data_path);
            }catch(err){
                logger.error(`Failed to create ${data_path}: `, err.message);
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
    const installed_languages = languages.flat()
        .filter(pkg=>fss.exists_sync(path.join(pkg, globals.pkg_installed_file)));

    installed_languages.forEach(pkg => new runtime.Runtime(pkg));

    logger.info('Starting API Server');

    logger.debug('Constructing Express App');

    logger.debug('Registering custom message wrappers');

    express.response.json_error = function(message, code) {
        this.status(code);
        return this.json({success: false, message, code});
    };

    express.response.json_success = function(obj) {
        return this.json({success: true, data: obj});
    };

    logger.debug('Registering middleware');

    app.use(body_parser.urlencoded({extended: true}));
    app.use(body_parser.json());


    function validate(req, res, next) {
        const errors = validationResult(req); //eslint-disable-line snakecasejs/snakecasejs
        if (!errors.isEmpty()) //eslint-disable-line snakecasejs/snakecasejs
            return res.json_error(errors.array(), 422);
        next();
    }

    logger.debug('Registering Routes');

    const ppman_routes = require('./ppman/routes');
    const executor_routes = require('./executor/routes');


    app.get('/packages',
        ppman_routes.package_list
    );

    app.post('/packages/:language/:version',
        ppman_routes.package_install
    );

    app.delete('/packages/:language/:version',
        ppman_routes.package_uninstall
    );
    
    app.post('/jobs',
        executor_routes.run_job_validators,
        validate,
        executor_routes.run_job);

    function list_runtimes(_, res){
        const runtimes = runtime.map(rt => (
            {
                language: rt.language,
                version: rt.version.raw,
                author: rt.author,
                aliases: rt.aliases
            }
        ));

        return res.json_success({
            runtimes
        });
    }

    app.get('/runtimes', list_runtimes);

    logger.debug('Calling app.listen');
    const [address,port] = config.bind_address.split(':');

    app.listen(port, address, ()=>{
        logger.info('API server started on', config.bind_address);
    });

})();