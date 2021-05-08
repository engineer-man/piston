const chalk = require('chalk');

exports.command = ['install <language> [language_version]'];
exports.aliases = ['i'];
exports.describe = 'Installs the named package';

const msg_format = {
    color: p => `${p.language ? chalk.green.bold('✓') : chalk.red.bold('❌')} Installation ${p.language ? 'succeeded' : 'failed: ' + p.message}`,
    monochrome: p => `Installation ${p.language ? 'succeeded' : 'failed: ' + p.message}`,
    json: JSON.stringify
};

exports.handler = async ({ axios, language, language_version }) => {
    try {
        const request = {
            language,
            version: language_version || '*'
        };

        const install = await axios.post(`/api/v2/packages`, request);

        console.log(msg_format.color(install.data));
    } catch ({ response }) {
        console.error(response.data.message)
    }
}
