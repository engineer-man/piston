// {"language":"python","version":"3.9.1","files":{"code.py":"print('hello world')"},"args":[],"stdin":"","compile_timeout":10, "run_timeout":3}
// {"success":true, "run":{"stdout":"hello world", "stderr":"", "error_code":0},"compile":{"stdout":"","stderr":"","error_code":0}}

const { get_latest_runtime_matching_language_version } = require('../runtime');
const { Job } = require('./job');
const { body } = require('express-validator');

module.exports = {

    run_job_validators: [
        body('language')
            .isString(),
        body('version')
            .isString(),
        // isSemVer requires it to be a version, not a selector
        body('files')
            .isArray(),
        body('files.*.content')
            .isString(),
    ],

    // POST /execute
    async run_job(req, res) {
        const runtime = get_latest_runtime_matching_language_version(req.body.language, req.body.version);

        if (runtime === undefined) {
            return res
                .status(400)
                .send({
                    message: `${req.body.language}-${req.body.version} runtime is unknown`
                });
        }

        const job = new Job({
            runtime,
            alias: req.body.language,
            files: req.body.files,
            args: req.body.args || [],
            stdin: req.body.stdin || "",
            timeouts: {
                run: req.body.run_timeout || 3000,
                compile: req.body.compile_timeout || 10000
            }
        });

        await job.prime();

        const result = await job.execute();

        await job.cleanup();

        return res
            .status(200)
            .send(result);
    }

};
