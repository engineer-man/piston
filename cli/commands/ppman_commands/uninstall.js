const chalk = require('chalk');

exports.command = ['uninstall <language> <language-version>']
exports.aliases = ['u']
exports.describe = 'Installs the named package'


const msg_format = {
    'color': p => `${p.language ? chalk.green.bold('✓') : chalk.red.bold('❌')} Uninstallation ${p.language ? "succeeded" : "failed: " + p.message}`,
    'monochrome': p => `Uninstallation ${p.language ? "succeeded" : "failed: " + p.message}`,
    'json': JSON.stringify

}

exports.handler = async function({axios, language, languageVersion}){
    try{
        const install = await axios.delete(`/packages/${language}/${languageVersion}`)
        
        console.log(msg_format.color(install.data));
    }catch({response}){
        console.error(response.data.message)
    }
}