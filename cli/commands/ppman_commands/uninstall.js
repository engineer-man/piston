const chalk = require('chalk');

exports.command = ['uninstall <language> [language-version]'];
exports.aliases = ['u'];
exports.describe = 'Uninstalls the named package';

const msg_format = {
    color: p => `${p.language ? chalk.green.bold('✓') : chalk.red.bold('❌')} Uninstallation ${p.language ? 'succeeded' : 'failed: ' + p.message}`,
    monochrome: p => `Uninstallation ${p.language ? 'succeeded' : 'failed: ' + p.message}`,
    json: JSON.stringify
};

exports.handler = async ({ axios, language, version }) => {
    try {
        const uninstall = await axios.delete(`/api/v2/packages/${language}/${version || '*'}`)

        console.log(msg_format.color(uninstall.data));
    } catch ({ response }) {
        console.error(response.data.message)
    }
}
