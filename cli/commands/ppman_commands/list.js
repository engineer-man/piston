const chalk = require('chalk');

exports.command = ['list'];
exports.aliases = ['l'];
exports.describe = 'Lists all available packages';

const msg_format = {
    color: p =>
        `${chalk[p.installed ? 'green' : 'red']('•')} ${p.language} ${
            p.language_version
        }`,
    monochrome: p =>
        `${p.language} ${p.language_version} ${
            p.installed ? '(INSTALLED)' : ''
        }`,
    json: JSON.stringify,
};

exports.handler = async ({ axios }) => {
    const packages = await axios.get('/api/v2/packages');

    const pkg_msg = packages.data.map(msg_format.color).join('\n');

    console.log(pkg_msg);
};
