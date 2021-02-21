const logger = require('logplease').create('executor/job');
const { v4: uuidv4 } = require('uuid');
const cp = require('child_process');
const path = require('path');
const config = require('../config');
const globals = require('../globals');
const fs = require('fs/promises');


const job_states = {
    READY: Symbol('Ready to be primed'),
    PRIMED: Symbol('Primed and ready for execution'),
    EXECUTED: Symbol('Executed and ready for cleanup')
};

var uid=0;
var gid=0;

class Job {
    constructor(runtime, files, args, stdin, timeouts, main){
        this.uuid =  uuidv4();
        this.runtime = runtime;
        this.files = files;
        this.args = args;
        this.stdin = stdin;
        this.timeouts = timeouts;
        this.main = main;

        if(!this.files.map(f=>f.name).includes(this.main))
            throw new Error(`Main file "${this.main}" will not be written to disk`);

        this.uid = config.runner_uid_min + uid;
        this.gid = config.runner_gid_min + gid;

        uid++;
        gid++;

        uid %= (config.runner_uid_max - config.runner_uid_min) + 1;
        gid %= (config.runner_gid_max - config.runner_gid_min) + 1;

        this.state = job_states.READY;
        this.dir = path.join(config.data_directory, globals.data_directories.jobs, this.uuid);
    }

    async prime(){
        logger.info(`Priming job uuid=${this.uuid}`);

        logger.debug('Writing files to job cache');

        await fs.mkdir(this.dir, {mode:0o700});

        const files = this.files.map(({name: file_name, content}) => {
            return fs.write_file(path.join(this.dir, file_name), content);
        });

        await Promise.all(files);

        logger.debug(`Transfering ownership uid=${this.uid} gid=${this.gid}`);
        await fs.chown(this.dir, this.uid, this.gid);
        
        const chowns = this.files.map(({name:file_name}) => {
            return fs.chown(path.join(this.dir, file_name), this.uid, this.gid);
        });

        await Promise.all(chowns);

        this.state = job_states.PRIMED;
        logger.debug('Primed job');
    }

    async execute(){
        if(this.state != job_states.PRIMED) throw new Error('Job must be in primed state, current state: ' + this.state.toString());
        logger.info(`Executing job uuid=${this.uuid} uid=${this.uid} gid=${this.gid} runtime=${this.runtime.toString()}`);
        logger.debug('Compiling');
        const compile = this.runtime.compiled && await new Promise((resolve, reject) => {
            var stdout = '';            
            var stderr = '';     
            const proc = cp.spawn('bash', [path.join(this.runtime.pkgdir, 'compile'),this.main, ...this.files] ,{
                env: this.runtime.env_vars,
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd: this.dir,
                uid: this.uid,
                gid: this.gid
            });

            const kill_timeout = setTimeout(proc.kill, this.timeouts.compile, 'SIGKILL');

            proc.stderr.on('data', d=>stderr += d);
            proc.stdout.on('data', d=>stdout += d);

            proc.on('exit', (code, signal)=>{
                clearTimeout(kill_timeout);
                resolve({stdout, stderr, code, signal});
            });

            proc.on('error', (err) => {
                clearTimeout(kill_timeout);
                reject({error: err, stdout, stderr});
            });
        });

        logger.debug('Running');

        const run = await new Promise((resolve, reject) => {
            var stdout = '';            
            var stderr = '';
            const proc = cp.spawn('bash', [path.join(this.runtime.pkgdir, 'run'),this.main, ...this.args] ,{
                env: this.runtime.env_vars,
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd: this.dir,
                uid: this.uid,
                gid: this.gid
            });

            const kill_timeout = setTimeout(proc.kill, this.timeouts.run, 'SIGKILL');

            proc.stderr.on('data', d=>stderr += d);
            proc.stdout.on('data', d=>stdout += d);

            proc.on('exit', (code, signal)=>{
                clearTimeout(kill_timeout);
                resolve({stdout, stderr, code, signal});
            });

            proc.on('error', (err) => {
                clearTimeout(kill_timeout);
                reject({error: err, stdout, stderr});
            });
        });

        this.state = job_states.EXECUTED;

        return {
            compile,
            run
        };

    }

    async cleanup(){
        logger.info(`Cleaning up job uuid=${this.uuid}`);
        await fs.rm(this.dir, {recursive: true, force: true});
    }
}

module.exports = {Job};