const chalk = require('chalk');

exports.command = ['install <packages...>'];
exports.aliases = ['i'];
exports.describe = 'Installs the named package';

//Splits the package into it's language and version
function split_package(package) {
    [language, language_version] = package.split('=');

    res = {
        language: language,
        version: language_version || '*',
    };
    return res;
}

const msg_format = {
    color: p =>
        `${
            p.language ? chalk.green.bold('✓') : chalk.red.bold('❌')
        } Installation ${p.language ? 'succeeded' : 'failed: ' + p.message}`,
    monochrome: p =>
        `Installation ${p.language ? 'succeeded' : 'failed: ' + p.message}`,
    json: JSON.stringify,
};

exports.handler = async ({ axios, packages }) => {
    const requests = packages.map(package => split_package(package));
    for (request of requests) {
        try {
            const install = await axios.post(`/api/v2/packages`, request);

            console.log(msg_format.color(install.data));
        } catch ({ response }) {
            console.error(response.data.message);
        }
    }
};
