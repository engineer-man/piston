const express = require('express');
const router  = express.Router();

const config = require('../config');
const runtime = require('../runtime');
const { Job } = require('../job');
const package = require('../package')
const logger = require('logplease').create('api/v2');

router.use((req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method) || !req.body) {
        return next();
    }

    try {
        JSON.parse(req.body);
    } catch (e) {
        return res
            .status(415)
            .send({
                message: 'requests must be of type application/json'
            });
    }

    next();
});

router.post('/execute', async (req, res) => {
    const {
        language, version,
        files,
        stdin, args,
        run_timeout, compile_timeout,
        compile_memory_limit, run_memory_limit
    } = req.body;

    if (!language || typeof language !== 'string') {
        return res
            .status(400)
            .send({
                message: 'language is required as a string'
            });
    }

    if (!version || typeof version !== 'string') {
        return res
            .status(400)
            .send({
                message: 'version is required as a string'
            });
    }

    if (!files || !Array.isArray(files)) {
        return res
            .status(400)
            .send({
                message: 'files is required as an array'
            });
    }

    for (const [i, file] of files.entries()) {
        if (typeof file.content !== 'string') {
            return res
                .status(400)
                .send({
                    message: `files[${i}].content is required as a string`
                });
        }
    }

    if (compile_memory_limit) {
        if (typeof compile_memory_limit !== 'number') {
            return res
                .status(400)
                .send({
                    message: 'if specified, compile_memory_limit must be a number'
                })
        }

        if (config.compile_memory_limit >= 0 && (compile_memory_limit > config.compile_memory_limit || compile_memory_limit < 0)) {
            return res
                .status(400)
                .send({
                    message: 'compile_memory_limit cannot exceed the configured limit of ' + config.compile_memory_limit
                })
        }
    }

    if (run_memory_limit) {
        if (typeof run_memory_limit !== 'number') {
            return res
                .status(400)
                .send({
                    message: 'if specified, run_memory_limit must be a number'
                })
        }

        if (config.run_memory_limit >= 0 && (run_memory_limit > config.run_memory_limit || run_memory_limit < 0)) {
            return res
                .status(400)
                .send({
                    message: 'run_memory_limit cannot exceed the configured limit of ' + config.run_memory_limit
                })
        }
    }

    const rt = runtime.get_latest_runtime_matching_language_version(language, version);

    if (rt === undefined) {
        return res
            .status(400)
            .send({
                message: `${language}-${version} runtime is unknown`
            });
    }

    const job = new Job({
        runtime: rt,
        alias: language,
        files: files,
        args: args || [],
        stdin: stdin || '',
        timeouts: {
            run: run_timeout || 3000,
            compile: compile_timeout || 10000
        },
        memory_limits: {
            run: run_memory_limit || config.run_memory_limit,
            compile: compile_memory_limit || config.compile_memory_limit
        }
    });

    await job.prime();

    const result = await job.execute();

    await job.cleanup();

    return res
        .status(200)
        .send(result);
});

router.get('/runtimes', (req, res) => {
    const runtimes = runtime
        .map(rt => {
            return {
                language: rt.language,
                version: rt.version.raw,
                aliases: rt.aliases,
                runtime: rt.runtime
            };
        });

    return res
        .status(200)
        .send(runtimes);
});

router.get('/packages', async (req, res) => {
    logger.debug('Request to list packages');
    let packages = await package.get_package_list();

    packages = packages
        .map(pkg => {
            return {
                language: pkg.language,
                language_version: pkg.version.raw,
                installed: pkg.installed
            };
        });

    return res
        .status(200)
        .send(packages);
});

router.post('/packages/:language/:version', async (req, res) => {
    logger.debug('Request to install package');

    const { language, version } = req.params;

    const pkg = await package.get_package(language, version);

    if (pkg == null) {
        return res
            .status(404)
            .send({
                message: `Requested package ${language}-${version} does not exist`
            });
    }

    try {
        const response = await pkg.install();

        return res
            .status(200)
            .send(response);
    } catch (e) {
        logger.error(`Error while installing package ${pkg.language}-${pkg.version}:`, e.message);

        return res
            .status(500)
            .send({
                message: e.message
            });
    }
});

router.delete('/packages/:language/:version', async (req, res) => {
    logger.debug('Request to uninstall package');

    const {language, version} = req.params;

    const pkg = await package.get_package(language, version);

    if (pkg == null) {
        return res
            .status(404)
            .send({
                message: `Requested package ${language}-${version} does not exist`
            });
    }

    try {
        const response = await pkg.uninstall();

        return res
            .status(200)
            .send(response);
    } catch (e) {
        logger.error(`Error while uninstalling package ${pkg.language}-${pkg.version}:`, e.message);

        return res
            .status(500)
            .send({
                message: e.message
            });
    }
});

module.exports = router;
