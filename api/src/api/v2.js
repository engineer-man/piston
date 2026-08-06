const express = require('express');
const router = express.Router();

const events = require('events');
const fetch = require('node-fetch');

const runtime = require('../runtime');
const { Job } = require('../job');
const { Session } = require('../session');
const s3 = require('../s3');
const package = require('../package');
const globals = require('../globals');
const logger = require('logplease').create('api/v2');

async function resolve_file_urls(files) {
    for (const [i, file] of files.entries()) {
        if (file.url !== undefined) {
            let parsed;
            try {
                parsed = new URL(file.url);
            } catch (e) {
                throw { message: `files[${i}].url is not a valid URL` };
            }
            if (!['http:', 'https:'].includes(parsed.protocol)) {
                throw { message: `files[${i}].url must use http or https` };
            }
            const resp = await fetch(file.url);
            if (!resp.ok) {
                throw {
                    message: `Failed to fetch files[${i}].url: HTTP ${resp.status}`,
                };
            }
            file.content = (await resp.buffer()).toString('base64');
            file.encoding = 'base64';
        }
    }
}

function get_job(body) {
    let {
        language,
        version,
        args,
        stdin,
        files,
        compile_memory_limit,
        run_memory_limit,
        run_timeout,
        compile_timeout,
        run_cpu_time,
        compile_cpu_time,
    } = body;

    return new Promise((resolve, reject) => {
        if (!language || typeof language !== 'string') {
            return reject({
                message: 'language is required as a string',
            });
        }
        if (!version || typeof version !== 'string') {
            return reject({
                message: 'version is required as a string',
            });
        }
        if (!files || !Array.isArray(files)) {
            return reject({
                message: 'files is required as an array',
            });
        }
        for (const [i, file] of files.entries()) {
            if (file.url === undefined && typeof file.content !== 'string') {
                return reject({
                    message: `files[${i}].content is required as a string (or provide files[${i}].url)`,
                });
            }
        }

        const rt = runtime.get_latest_runtime_matching_language_version(
            language,
            version
        );
        if (rt === undefined) {
            return reject({
                message: `${language}-${version} runtime is unknown`,
            });
        }

        if (
            rt.language !== 'file' &&
            !files.some(
                file =>
                    !file.encoding || file.encoding === 'utf8' || file.url
            )
        ) {
            return reject({
                message: 'files must include at least one utf8 encoded file',
            });
        }

        for (const constraint of ['memory_limit', 'timeout', 'cpu_time']) {
            for (const type of ['compile', 'run']) {
                const constraint_name = `${type}_${constraint}`;
                const constraint_value = body[constraint_name];
                const configured_limit = rt[`${constraint}s`][type];
                if (!constraint_value) {
                    continue;
                }
                if (typeof constraint_value !== 'number') {
                    return reject({
                        message: `If specified, ${constraint_name} must be a number`,
                    });
                }
                if (configured_limit <= 0) {
                    continue;
                }
                if (constraint_value > configured_limit) {
                    return reject({
                        message: `${constraint_name} cannot exceed the configured limit of ${configured_limit}`,
                    });
                }
                if (constraint_value < 0) {
                    return reject({
                        message: `${constraint_name} must be non-negative`,
                    });
                }
            }
        }

        resolve(
            new Job({
                runtime: rt,
                args: args ?? [],
                stdin: stdin ?? '',
                files,
                timeouts: {
                    run: run_timeout ?? rt.timeouts.run,
                    compile: compile_timeout ?? rt.timeouts.compile,
                },
                cpu_times: {
                    run: run_cpu_time ?? rt.cpu_times.run,
                    compile: compile_cpu_time ?? rt.cpu_times.compile,
                },
                memory_limits: {
                    run: run_memory_limit ?? rt.memory_limits.run,
                    compile: compile_memory_limit ?? rt.memory_limits.compile,
                },
            })
        );
    });
}

router.use((req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    if (!req.headers['content-type']?.startsWith('application/json')) {
        return res.status(415).send({
            message: 'requests must be of type application/json',
        });
    }

    next();
});

router.ws('/connect', async (ws, req) => {
    let session = null;
    let s3_output_file = null;
    let is_executing = false;
    let current_event_bus = null;
    let current_execution_promise = null;

    const send = obj => {
        try {
            ws.send(JSON.stringify(obj));
        } catch (_) {
            // ignore send errors on already-closed socket
        }
    };

    ws.on('message', async data => {
        try {
            const msg = JSON.parse(data);

            switch (msg.type) {
                case 'init': {
                    if (session !== null) {
                        ws.close(4000, 'Already Initialized');
                        return;
                    }

                    const {
                        language,
                        version,
                        files,
                        s3_output_file: s3_file,
                        run_timeout,
                        run_cpu_time,
                        run_memory_limit,
                    } = msg;

                    if (!language || typeof language !== 'string') {
                        send({ type: 'error', message: 'language is required as a string' });
                        ws.close(4002, 'Notified Error');
                        return;
                    }
                    if (!version || typeof version !== 'string') {
                        send({ type: 'error', message: 'version is required as a string' });
                        ws.close(4002, 'Notified Error');
                        return;
                    }
                    if (!files || !Array.isArray(files) || files.length === 0) {
                        send({ type: 'error', message: 'files is required as a non-empty array' });
                        ws.close(4002, 'Notified Error');
                        return;
                    }

                    const rt = runtime.get_latest_runtime_matching_language_version(
                        language,
                        version
                    );
                    if (rt === undefined) {
                        send({ type: 'error', message: `${language}-${version} runtime is unknown` });
                        ws.close(4002, 'Notified Error');
                        return;
                    }

                    try {
                        await resolve_file_urls(files);
                    } catch (err) {
                        send({ type: 'error', message: err.message });
                        ws.close(4002, 'Notified Error');
                        return;
                    }

                    for (const [i, file] of files.entries()) {
                        if (file.url === undefined && typeof file.content !== 'string') {
                            send({ type: 'error', message: `files[${i}].content is required as a string` });
                            ws.close(4002, 'Notified Error');
                            return;
                        }
                        if (!file.name || typeof file.name !== 'string') {
                            file.name = `file${i}.code`;
                        }
                        if (!file.encoding || !['base64', 'hex', 'utf8'].includes(file.encoding)) {
                            file.encoding = 'utf8';
                        }
                    }

                    s3_output_file = s3_file || null;

                    session = new Session({
                        runtime: rt,
                        files,
                        timeouts: { run: run_timeout ?? rt.timeouts.run },
                        cpu_times: { run: run_cpu_time ?? rt.cpu_times.run },
                        memory_limits: { run: run_memory_limit ?? rt.memory_limits.run },
                    });

                    try {
                        await session.prime();
                    } catch (err) {
                        session = null;
                        send({ type: 'error', message: err.message || String(err) });
                        ws.close(4002, 'Notified Error');
                        return;
                    }

                    send({
                        type: 'runtime',
                        language: rt.language,
                        version: rt.version.raw,
                    });
                    break;
                }

                case 'execute': {
                    if (session === null) {
                        ws.close(4003, 'Not yet initialized');
                        return;
                    }
                    if (is_executing) {
                        send({ type: 'error', message: 'Execution already in progress' });
                        return;
                    }

                    const {
                        code,
                        args = [],
                        stdin = '',
                        run_timeout,
                        run_cpu_time,
                        run_memory_limit,
                    } = msg;

                    if (typeof code !== 'string') {
                        send({ type: 'error', message: 'execute.code must be a string' });
                        return;
                    }

                    const exec_event_bus = new events.EventEmitter();
                    exec_event_bus.on('stdout', data =>
                        send({ type: 'data', stream: 'stdout', data: data.toString() })
                    );
                    exec_event_bus.on('stderr', data =>
                        send({ type: 'data', stream: 'stderr', data: data.toString() })
                    );

                    is_executing = true;
                    current_event_bus = exec_event_bus;

                    const exec_promise = session.run_execute(
                        code,
                        args,
                        stdin,
                        run_timeout ?? session.timeouts.run,
                        run_cpu_time ?? session.cpu_times.run,
                        run_memory_limit ?? session.memory_limits.run,
                        exec_event_bus
                    );
                    current_execution_promise = exec_promise;

                    send({ type: 'stage', stage: 'run' });

                    try {
                        const result = await exec_promise;
                        send({
                            type: 'exit',
                            stage: 'run',
                            code: result.code,
                            signal: result.signal,
                        });
                    } catch (err) {
                        send({ type: 'error', message: err.message || String(err) });
                    } finally {
                        is_executing = false;
                        current_event_bus = null;
                        current_execution_promise = null;
                    }
                    break;
                }

                case 'data': {
                    if (session === null) {
                        ws.close(4003, 'Not yet initialized');
                        return;
                    }
                    if (msg.stream !== 'stdin') {
                        ws.close(4004, 'Can only write to stdin');
                        return;
                    }
                    if (is_executing && current_event_bus) {
                        current_event_bus.emit('stdin', msg.data);
                    }
                    break;
                }

                case 'signal': {
                    if (session === null) {
                        ws.close(4003, 'Not yet initialized');
                        return;
                    }
                    if (!Object.values(globals.SIGNALS).includes(msg.signal)) {
                        ws.close(4005, 'Invalid signal');
                        return;
                    }

                    if (msg.signal === 'SIGTERM') {
                        if (is_executing && current_event_bus && current_execution_promise) {
                            current_event_bus.emit('kill', 'SIGKILL');
                            try { await current_execution_promise; } catch (_) {}
                        }

                        if (s3_output_file && s3.enabled) {
                            try {
                                const buf = await session.read_file(s3_output_file);
                                const key = await s3.upload(buf);
                                send({ type: 'upload', key });
                            } catch (err) {
                                send({ type: 'error', message: `S3 upload failed: ${err.message}` });
                            }
                        }

                        await session.cleanup();
                        ws.close(4999, 'Session Ended');
                    } else if (is_executing && current_event_bus) {
                        current_event_bus.emit('kill', msg.signal);
                    }
                    break;
                }
            }
        } catch (error) {
            send({ type: 'error', message: error.message });
            ws.close(4002, 'Notified Error');
        }
    });

    ws.on('close', async () => {
        if (session !== null && !session.cleaned_up) {
            try {
                await session.cleanup();
            } catch (_) {}
        }
    });

    setTimeout(() => {
        if (session === null) ws.close(4001, 'Initialization Timeout');
    }, 1000);
});

router.post('/execute', async (req, res) => {
    let job;
    try {
        await resolve_file_urls(req.body.files || []);
        job = await get_job(req.body);
    } catch (error) {
        return res.status(400).json(error);
    }
    try {
        const box = await job.prime();

        let result = await job.execute(box);
        // Backward compatibility when the run stage is not started
        if (result.run === undefined) {
            result.run = result.compile;
        }

        return res.status(200).send(result);
    } catch (error) {
        logger.error(`Error executing job: ${job.uuid}:\n${error}`);
        return res.status(500).send();
    } finally {
        try {
            await job.cleanup(); // This gets executed before the returns in try/catch
        } catch (error) {
            logger.error(`Error cleaning up job: ${job.uuid}:\n${error}`);
            return res.status(500).send(); // On error, this replaces the return in the outer try-catch
        }
    }
});

router.get('/runtimes', (req, res) => {
    const runtimes = runtime.map(rt => {
        return {
            language: rt.language,
            version: rt.version.raw,
            aliases: rt.aliases,
            runtime: rt.runtime,
        };
    });

    return res.status(200).send(runtimes);
});

router.get('/packages', async (req, res) => {
    logger.debug('Request to list packages');
    let packages = await package.get_package_list();

    packages = packages.map(pkg => {
        return {
            language: pkg.language,
            language_version: pkg.version.raw,
            installed: pkg.installed,
        };
    });

    return res.status(200).send(packages);
});

router.post('/packages', async (req, res) => {
    logger.debug('Request to install package');

    const { language, version } = req.body;

    const pkg = await package.get_package(language, version);

    if (pkg == null) {
        return res.status(404).send({
            message: `Requested package ${language}-${version} does not exist`,
        });
    }

    try {
        const response = await pkg.install();

        return res.status(200).send(response);
    } catch (e) {
        logger.error(
            `Error while installing package ${pkg.language}-${pkg.version}:`,
            e.message
        );

        return res.status(500).send({
            message: e.message,
        });
    }
});

router.delete('/packages', async (req, res) => {
    logger.debug('Request to uninstall package');

    const { language, version } = req.body;

    const pkg = await package.get_package(language, version);

    if (pkg == null) {
        return res.status(404).send({
            message: `Requested package ${language}-${version} does not exist`,
        });
    }

    try {
        const response = await pkg.uninstall();

        return res.status(200).send(response);
    } catch (e) {
        logger.error(
            `Error while uninstalling package ${pkg.language}-${pkg.version}:`,
            e.message
        );

        return res.status(500).send({
            message: e.message,
        });
    }
});

module.exports = router;
