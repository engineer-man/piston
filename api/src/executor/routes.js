// {"language":"python","version":"3.9.1","files":{"code.py":"print('hello world')"},"args":[],"stdin":"","compile_timeout":10, "run_timeout":3, "main": "code.py"}
// {"success":true, "run":{"stdout":"hello world", "stderr":"", "error_code":0},"compile":{"stdout":"","stderr":"","error_code":0}}

const { get_latest_runtime_matching_language_version } = require('../runtime');
const { Job } = require('./job');
const { body } = require('express-validator');

module.exports = {
    run_job_validators: [
        body('language')
            .isString(), // eslint-disable-line snakecasejs/snakecasejs
        body('version')
            .isString(), // eslint-disable-line snakecasejs/snakecasejs
        // isSemVer requires it to be a version, not a selector
        body('files')
            .isArray(), // eslint-disable-line snakecasejs/snakecasejs
        body('files.*.name')
            .isString() // eslint-disable-line snakecasejs/snakecasejs
            .bail()
            .not()
            .contains('/'),
        body('files.*.content')
            .isString(), // eslint-disable-line snakecasejs/snakecasejs
        body('compile_timeout')
            .isNumeric(), // eslint-disable-line snakecasejs/snakecasejs
        body('run_timeout')
            .isNumeric(), // eslint-disable-line snakecasejs/snakecasejs
        body('stdin')
            .isString(), // eslint-disable-line snakecasejs/snakecasejs
        body('args')
            .isArray(),
        body('args.*')
            .isString() // eslint-disable-line snakecasejs/snakecasejs
    ],
    async run_job(req, res){
        // POST /jobs


        const runtime = get_latest_runtime_matching_language_version(req.body.language, req.body.version);
        if(runtime == undefined) return res.json_error(`${req.body.language}-${req.body.version} runtime is unknown`, 400);

        const job = new Job({
            runtime,
            files: req.body.files,
            args: req.body.args,
            stdin: req.body.stdin,
            timeouts: {
                run: req.body.run_timeout,
                compile: req.body.compile_timeout
            },
            main: req.body.main
        });

        await job.prime();

        const result = await job.execute();
        res.json_success(result);

        await job.cleanup();
    }
};