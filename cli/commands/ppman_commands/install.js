const chalk = require('chalk');

exports.command = ['install <language> [language-version]'];
exports.aliases = ['i'];
exports.describe = 'Installs the named package';

const msg_format = {
    color: p => `${p.language ? chalk.green.bold('✓') : chalk.red.bold('❌')} Installation ${p.language ? 'succeeded' : 'failed: ' + p.message}`,
    monochrome: p => `Installation ${p.language ? 'succeeded' : 'failed: ' + p.message}`,
    json: JSON.stringify
};

exports.handler = async ({ axios, language, version }) => {
    try {
        const install = await axios.post(`/api/v2/packages/${language}/${version || '*'}`);

        console.log(msg_format.color(install.data));
    } catch ({ response }) {
        console.error(response.data.message)
    }
}
