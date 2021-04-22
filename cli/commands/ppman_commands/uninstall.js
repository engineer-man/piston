const chalk = require('chalk');

exports.command = ['uninstall <language> <language-version>']
exports.aliases = ['u']
exports.describe = 'Uninstalls the named package'


const msg_format = {
    'color': p => `${p.language ? chalk.green.bold('✓') : chalk.red.bold('❌')} Uninstallation ${p.language ? "succeeded" : "failed: " + p.message}`,
    'monochrome': p => `Uninstallation ${p.language ? "succeeded" : "failed: " + p.message}`,
    'json': JSON.stringify

}

exports.handler = async function({axios, language, languageVersion}){
    try{
        const uninstall = await axios.delete(`/api/v1/packages/${language}/${languageVersion}`)

        console.log(msg_format.color(uninstall.data));
    }catch({response}){
        console.error(response.data.message)
    }
}
