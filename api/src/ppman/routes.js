const logger = require('logplease').create('ppman/routes');
const semver = require('semver');
const fetch = require('node-fetch');
const config = require('../config');
const { Package } = require('./package');


async function get_package_list(){
    const repo_content = await fetch(config.repo_url).then(x=>x.text());

    const entries = repo_content.split('\n').filter(x=>x.length > 0);

    return entries.map(line => {
        const [language, version, checksum, download] = line.split(',',4);
        return new Package({language, version, checksum, download});
    })
}


async function get_package(lang, version){
    const packages = await get_package_list();
    const candidates = packages.filter(
        pkg => pkg.language == lang && semver.satisfies(pkg.version, version)
    );
    return candidates.sort((a,b)=>semver.rcompare(a.version,b.version))[0] || null;
}

module.exports = {
  
    async package_list(req, res){
        // GET /packages
        logger.debug('Request to list packages');

        const packages = await get_package_list();

        res.json_success({
            packages: packages.map(pkg=>({
                language: pkg.language,
                language_version: pkg.version.raw,
                installed: pkg.installed
            }))
        });

    },
    async package_install(req,res){
        // POST /packages/:language/:version

        logger.debug('Request to install package');

        const pkg = await get_package(req.params.language, req.params.version);
        if(pkg == null) return res.json_error(`Requested package ${req.params.language}-${req.params.version} does not exist`, 404);

        try{
            const response = await pkg.install();
            return res.json_success(response);
        }catch(err){
            logger.error(`Error while installing package ${pkg.language}-${pkg.version}:`, err.message);
            res.json_error(err.message,500);
        }
        

    },
    async package_uninstall(req,res){
        // DELETE /packages/:language/:version

        //res.json(req.body); //TODO
        res.json_error('not implemented', 500);
    }
};