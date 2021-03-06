const {PistonEngine} = require('piston-api-client');
const chalk = require('chalk');

exports.command = ['install <language> <language-version>']
exports.aliases = ['i']
exports.describe = 'Installs the named package'


const msg_format = {
    'color': p => `${p.language ? chalk.green.bold('✓') : chalk.red.bold('❌')} Installation ${p.language ? "succeeded" : "failed: " + p.message}`,
    'monochrome': p => `Installation ${p.language ? "succeeded" : "failed: " + p.message}`,
    'json': JSON.stringify

}

exports.handler = async function(argv){
    const api = new PistonEngine(argv['piston-url']);

    const opts = {
        language: argv['language'],
        version: argv['language-version']
    };

    const install = await api.install_package(opts).catch(x=>x);
    
    console.log(msg_format.color(install));
}