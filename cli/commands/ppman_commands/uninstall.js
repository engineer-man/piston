const chalk = require('chalk');

exports.command = ['uninstall <language> [language_version]'];
exports.aliases = ['u'];
exports.describe = 'Uninstalls the named package';

const msg_format = {
    color: p => `${p.language ? chalk.green.bold('✓') : chalk.red.bold('❌')} Uninstallation ${p.language ? 'succeeded' : 'failed: ' + p.message}`,
    monochrome: p => `Uninstallation ${p.language ? 'succeeded' : 'failed: ' + p.message}`,
    json: JSON.stringify
};

exports.handler = async ({ axios, language, language_version }) => {
    try {
        const request = {
            language,
            version: language_version || '*'
        };
        const uninstall = await axios.delete(`/api/v2/packages`, {data: request});

        console.log(msg_format.color(uninstall.data));
    } catch ({ response }) {
        console.error(response.data.message)
    }
}
