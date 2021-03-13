const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

exports.command = ['execute <language> <language-version> <file> [args..]']
exports.aliases = ['run']
exports.describe = 'Executes file with the specified runner'

exports.builder = {
    stdin: {
        boolean: true,
        desc: 'Read input from stdin and pass to executor',
        alias: ['i']
    },
    run_timeout: {
        alias: ['rt', 'r'],
        number: true,
        desc: 'Milliseconds before killing run process',
        default: 3000
    },
    compile_timeout: {
        alias: ['ct', 'c'],
        number: true,
        desc: 'Milliseconds before killing compile process',
        default: 10000,
    },
    files: {
        alias: ['f'],
        array: true,
        desc: 'Additional files to add',
    }
}

exports.handler = async function(argv){
    
    const files = [...(argv.files || []),argv.file]
        .map(file_path => ({
            name: path.basename(file_path),
            content: fs.readFileSync(file_path).toString()
        }));


    const stdin = (argv.stdin && await new Promise((resolve, _)=>{
        var data = "";
        process.stdin.on('data', d=> data += d)
        process.stdin.on('end', _ => resolve(data))
    })) || "";


    const request = {
        language: argv.language,
        version: argv['language-version'],
        files: files,
        main: argv.file,
        args: argv.args,
        stdin,
        compile_timeout: argv.ct,
        run_timeout: argv.rt
    };

    const response = await fetch(argv['piston-url'] + '/jobs', {
            method: 'post',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(request)
        })
        .then(res=>res.json())
        .then(res=>{if(res.data)return res.data; throw new Error(res.message)})
        .catch(x=>x);

    function step(name, ctx){
        console.log(chalk.bold(`== ${name} ==`))
        if(ctx.stdout){
            console.log(" ",chalk.bold(`STDOUT`))
            console.log("   ",ctx.stdout.replace(/\n/g,'\n    '))
        }
        if(ctx.stderr){
            console.log(chalk.bold(`STDERR`))
            console.log("   ",ctx.stderr.replace(/\n/g,'\n    '))
        }

        if(ctx.code)
            console.log(
                chalk.bold(`Exit Code:`),
                chalk.bold[ctx.code > 0 ? 'red' : 'green'](ctx.code)
                )
        if(ctx.signal)
            console.log(
                chalk.bold(`Signal:`),
                chalk.bold.yellow(ctx.signal)
                )
    }
    
    if(response.compile) step('Compile', response.compile)
    step('Run', response.run)
    
}