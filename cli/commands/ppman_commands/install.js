const {PistonEngine} = require('piston-api-client');
const chalk = require('chalk');

exports.command = ['install <language> <language-version>']
exports.aliases = ['i']
exports.describe = 'Installs the named package'


const msg_format = {
    'color': p => `${p.language ? chalk.green.bold('✓') : chalk.red.bold('❌')} Installation ${p.language ? "succeeded" : "failed: " + p.message}`,
    'monochrome': p => `Installation ${p.language ? "succeeded" : "failed: " + p.message}`,
    'json': JSON.stringify

}

exports.handler = async function(argv){
    const api = new PistonEngine(argv['piston-url']);
    
    const repos = await api.list_repos();
    const repos_obj = await Promise.all(repos.repos.map(({slug}) => api.get_repo(slug)));
    const repo_pkgs = await Promise.all(repos_obj.map(
        async repo => ({
            repo: repo,
            packages: await repo.list_packages().catch(x=>[])
        })
    ))

    const repo = repo_pkgs.find(r => r.packages.find(p=>p.language == argv['language'] && p.language_version == argv['language-version']))
    if(!repo) throw Error("Package could not be located")

    const package = await repo.repo.get_package(argv['language'], argv['language-version'])
    const install = await package.install().catch(x=>x)
    
    console.log(msg_format.color(install));
}