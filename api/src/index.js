#!/usr/bin/env node
require("nocamel")
const Logger = require("logplease")
const express = require("express")
const globals = require("./globals")
const config = require("./config")
const cache = require("./cache")
const state = require("./state")
const path = require("path")
const fs = require("fs")
const util = require("util")
const body_parser = require("body-parser")
const runtime = require("./runtime")

const logger = Logger.create("index")
const app = express();

(async () => {
    logger.info("Setting loglevel to",config.log_level)
    Logger.setLogLevel(config.log_level) //eslint-disable-line snakecasejs/snakecasejs

    logger.debug("Ensuring data directories exist")
    Object.values(globals.data_directories).forEach(dir => {
        var data_path = path.join(config.data_directory, dir)
        logger.debug(`Ensuring ${data_path} exists`)
        if(!fs.exists_sync(data_path)){
            logger.info(`${data_path} does not exist.. Creating..`)
            try{
                fs.mkdir_sync(data_path)
            }catch(err){
                logger.error(`Failed to create ${data_path}: `, err.message)
            }
        }
        
    })


    logger.info("Loading state")
    await state.load(path.join(config.data_directory,globals.data_files.state))

    logger.info("Loading cache")
    await cache.load(path.join(config.data_directory,globals.data_directories.cache))

    logger.info("Loading packages")
    const pkgdir = path.join(config.data_directory,globals.data_directories.packages)
    await util.promisify(fs.readdir)(pkgdir)
        .then(langs => Promise.all(
            langs.map(lang=>
                util.promisify(fs.readdir)(path.join(pkgdir,lang))
                    .then(x=>x.map(y=>path.join(pkgdir, lang, y)))
            )))
        //eslint-disable-next-line snakecasejs/snakecasejs
        .then(pkgs=>pkgs.flat().filter(pkg=>fs.existsSync(path.join(pkg, globals.pkg_installed_file))))
        .then(pkgs=>pkgs.forEach(pkg => new runtime.Runtime(pkg)))



    logger.info("Starting API Server")

    logger.debug("Constructing Express App")

    logger.debug("Registering middleware")

    app.use(body_parser.urlencoded({extended: true}))
    app.use(body_parser.json())

    logger.debug("Registering custom message wrappers")

    express.response.json_error = function(message, code) {
        this.status(code)
        return this.json({success: false, message, code})
    }

    express.response.json_success = function(obj) {
        return this.json({success: true, data: obj})
    }

    logger.debug("Registering Routes")

    const ppman_routes = require("./ppman/routes")

    app.get   ("/repos", ppman_routes.repo_list)
    app.post  ("/repos", ppman_routes.repo_add)
    app.get   ("/repos/:repo_slug", ppman_routes.repo_info)
    app.get   ("/repos/:repo_slug/packages", ppman_routes.repo_packages)
    app.get   ("/repos/:repo_slug/packages/:language/:version", ppman_routes.package_info)
    app.post  ("/repos/:repo_slug/packages/:language/:version", ppman_routes.package_install)
    app.delete("/repos/:repo_slug/packages/:language/:version", ppman_routes.package_uninstall) //TODO

    const executor_routes = require('./executor/routes')
    app.post  ("/jobs", executor_routes.run_job)




    logger.debug("Calling app.listen")
    const [address,port] = config.bind_address.split(":")

    app.listen(port, address, ()=>{
        logger.info("API server started on", config.bind_address)
    })

    logger.debug("Setting up flush timers")
    setInterval(cache.flush,config.cache_flush_time,path.join(config.data_directory,globals.data_directories.cache))
    setInterval(state.save,config.state_flush_time,path.join(config.data_directory,globals.data_files.state))
})()