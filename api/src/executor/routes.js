// {"language":"python","version":"3.9.1","files":{"code.py":"print('hello world')"},"args":[],"stdin":"","compile_timeout":10, "run_timeout":3, "main": "code.py"}
// {"success":true, "run":{"stdout":"hello world", "stderr":"", "error_code":0},"compile":{"stdout":"","stderr":"","error_code":0}}

const { get_latest_runtime_matching_language_version } = require("../runtime");
const { Job } = require("./job");

module.exports = {
    async run_job(req, res){
        // POST /jobs
        var errored = false;
        ["language", "version",
         "files", "main",
         "args", "stdin",
         "compile_timeout", "run_timeout",
         ].forEach(key => {
            if(req.body[key] == undefined) errored = errored || res.json_error(`${key} is required`, 400)
         })
         if(errored) return errored;

        const runtime = get_latest_runtime_matching_language_version(req.body.language, req.body.version);
        if(runtime == undefined) return res.json_error(`${req.body.language}-${req.body.version} runtime is unknown`, 400)

        const job = new Job(runtime, req.body.files, req.body.args, req.body.stdin, {run: req.body.run_timeout, compile: req.body.compile_timeout}, req.body.main)
        await job.prime()

        const result = await job.execute()
        res.json_success(result)

        await job.cleanup()

        

    }
}