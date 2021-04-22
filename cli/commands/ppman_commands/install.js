const chalk = require('chalk');

exports.command = ['install <language> <language-version>']
exports.aliases = ['i']
exports.describe = 'Installs the named package'


const msg_format = {
    'color': p => `${p.language ? chalk.green.bold('✓') : chalk.red.bold('❌')} Installation ${p.language ? "succeeded" : "failed: " + p.message}`,
    'monochrome': p => `Installation ${p.language ? "succeeded" : "failed: " + p.message}`,
    'json': JSON.stringify

}

exports.handler = async function({axios, language, languageVersion}){
    try{
        const install = await axios.post(`/api/v1/packages/${language}/${languageVersion}`)

        console.log(msg_format.color(install.data));
    }catch({response}){
        console.error(response.data.message)
    }
}
