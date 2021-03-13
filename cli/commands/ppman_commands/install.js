const fetch = require('node-fetch');
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
    const install = await fetch(
            `${argv['piston-url']}/packages/${argv['language']}/${argv['language-version']}`,
            {method: 'post'}
        )
        .then(res=>res.json())
        .then(res=>{if(res.data)return res.data; throw new Error(res.message)})
        .catch(x=>x);

    
    console.log(msg_format.color(install));
}