const fetch = require('node-fetch');
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

    const packages = await fetch(argv['piston-url'] + '/packages')
        .then(res=>res.json())
        .then(res=>{if(res.data)return res.data; throw new Error(res.message)});
        .then(res=>res.packages)
        .catch(x=>x)

   
    const pkg_msg = packages
        .map(msg_format.color)
        .join('\n');

    console.log(pkg_msg);
}