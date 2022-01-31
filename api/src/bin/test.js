#!/usr/bin/env node
// Test the specified package
require('nocamel');
const config = require('../config');
const Logger = require('logplease');
const logger = Logger.create('test');
const cp = require('child_process');
const runtime = require('../runtime');
const { Job } = require('../job');

(async function () {
    logger.info('Setting loglevel to', config.log_level);
    Logger.setLogLevel(config.log_level);

    let runtimes_to_test;
    let failed = false;

    if (process.argv[2] === '--all') {
        // load all
        runtimes_to_test = JSON.parse(
            cp.execSync(
                `nix eval ${config.flake_path}#pistonRuntimes --json --apply builtins.attrNames`
            )
        );
    } else {
        runtimes_to_test = [process.argv[2]];
    }

    for (const runtime_name of runtimes_to_test) {
        const runtime_path = `${config.flake_path}#pistonRuntimes.${runtime_name}`;
        logger.info(`Testing runtime ${runtime_path}`);

        logger.debug(`Loading runtime metadata`);
        const metadata = JSON.parse(
            cp.execSync(`nix eval --json ${runtime_path}.metadata --json`)
        );

        logger.debug(`Loading runtime tests`);
        const tests = JSON.parse(
            cp.execSync(`nix eval --json ${runtime_path}.tests --json`)
        );

        logger.debug(`Loading runtime`);

        const testable_runtime = new runtime.Runtime({
            ...metadata,
            ...runtime.Runtime.compute_all_limits(
                metadata.language,
                metadata.limitOverrides
            ),
            flake_path: runtime_path,
        });

        testable_runtime.ensure_built();

        logger.info(`Running tests`);

        for (const test of tests) {
            const files = [];

            for (const file_name of Object.keys(test.files)) {
                const file_content = test.files[file_name];
                const this_file = {
                    name: file_name,
                    content: file_content,
                };

                if (file_name == test.main) files.unshift(this_file);
                else files.push(this_file);
            }

            const job = new Job({
                runtime: testable_runtime,
                args: test.args || [],
                stdin: test.stdin || '',
                files,
                timeouts: {
                    run: 3000,
                    compile: 10000,
                },
                memory_limits: {
                    run: config.run_memory_limit,
                    compile: config.compile_memory_limit,
                },
            });

            await job.prime();
            const result = await job.execute();
            await job.cleanup();

            if (result.run.stdout.trim() !== 'OK') {
                failed = true;

                logger.error('Test Failed:');
                console.log(job, result);
            } else {
                logger.info('Test Passed');
            }
        }
    }

    if (failed) {
        logger.error('One or more tests failed');
        process.exit(1);
    } else {
        logger.info('All tests passed');
        process.exit(0);
    }
})();
