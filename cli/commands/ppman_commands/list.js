const {PistonEngine} = require('piston-api-client');
const chalk = require('chalk');

exports.command = ['list']
exports.aliases = ['l']
exports.describe = 'Lists all available packages'


const msg_format = {
    'color': p => `${chalk[p.installed ? "green":"red"]("•")} ${p.language} ${p.language_version}`,
    'monochrome': p => `${p.language} ${p.language_version} ${p.installed ? "(INSTALLED)": ""}`,
    'json': JSON.stringify

}

exports.handler = async function(argv){
    const api = new PistonEngine(argv['piston-url']);

    const packages = await api.list_packages();

   
    const pkg_msg = packages
        .map(msg_format.color)
        .join('\n');

    console.log(pkg_msg);
}