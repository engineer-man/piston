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

exports.builder = yargs => {
    yargs.option('all', {
        alias: 'a',
        type: 'boolean',
        description: 'Lists all available packages, including uninstalled ones',
        default: false,
    });
};

exports.handler = async ({ axios, all }) => {
    const packages = await axios.get('/api/v2/packages');

    const filtered = all ? packages.data : packages.data.filter(p => p.installed);
    const pkg_msg = filtered.map(msg_format.color).join('\n');

    if (pkg_msg.length > 0) {
        console.log(pkg_msg);
    } else {
        console.log(
            all
                ? 'No packages available in the repository index.'
                : 'No packages installed. Use `./piston setup` to get started!'
        );
    }
};
