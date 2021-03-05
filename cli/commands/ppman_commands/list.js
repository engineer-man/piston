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
    
    const repos = await api.list_repos();

    const repos_obj = await Promise.all(repos.repos.map(({slug}) => api.get_repo(slug)));

    const packages = await repos_obj.reduce(async (accumulator, repo) => [
        ...await accumulator,
        ...await repo.list_packages()
            .catch(x=>{console.log(x); return []})
    ], []); // Loops over repos, listing packages and flattening them into a single array
    
    const pkg_msg = packages
        .map(msg_format.color)
        .join('\n');

    console.log(pkg_msg);
}