const repos = new Map();
const state = require('../state');
const logger = require('logplease').create('ppman/routes');
const {Repository} = require('./repo');
const semver = require('semver');
const { body, param } = require('express-validator');

async function get_or_construct_repo(slug){
    if(repos.has(slug))return repos.get(slug);
    if(state.state.get('repositories').has(slug)){
        const repo_url = state.state.get('repositories').get(slug);
        const repo = new Repository(slug, repo_url);
        await repo.load();
        repos.set(slug, repo);
        return repo;
    }
    logger.warn(`Requested repo ${slug} does not exist`);
    return null;
}

async function get_package(repo, lang, version){
    var candidates = repo.packages.filter(
        pkg => pkg.language == lang && semver.satisfies(pkg.version, version)
    );
    return candidates.sort((a,b)=>semver.rcompare(a.version,b.version))[0] || null;
}

module.exports = {
    async repo_list(req,res){
        // GET /repos

        logger.debug('Request for repoList');
        res.json_success({
            repos: (await Promise.all(
                [...state.state.get('repositories').keys()].map( async slug => await get_or_construct_repo(slug))
            )).map(repo=>({
                slug: repo.slug,
                url: repo.url,
                packages: repo.packages.length
            }))
        });
    },
    repo_add_validators: [
        body('slug')
            .notEmpty() // eslint-disable-line snakecasejs/snakecasejs
            .bail()
            .isSlug() // eslint-disable-line snakecasejs/snakecasejs
            .bail()
            .not()
            .custom(value=>state.state.get('repositories').keys().includes(value))
            .withMessage('slug is already in use'), // eslint-disable-line snakecasejs/snakecasejs
        body('url')
            .notEmpty() // eslint-disable-line snakecasejs/snakecasejs
            .bail()
            .isURL({require_host: false, require_protocol: true, protocols: ['http','https','file']}) // eslint-disable-line snakecasejs/snakecasejs

    ],
    async repo_add(req, res){
        // POST /repos

        logger.debug(`Request for repoAdd slug=${req.body.slug} url=${req.body.url}`);
        
        const repo_state = state.state.get('repositories');
        
        repo_state.set(req.body.slug, req.body.url);
        logger.info(`Repository ${req.body.slug} added url=${req.body.url}`);

        return res.json_success(req.body.slug);
    },
    repo_info_validators: [
        param('repo_slug')
            .isSlug() // eslint-disable-line snakecasejs/snakecasejs
            .bail()
            .custom(value=>state.state.get('repositories').has(value))
            .withMessage('repository does not exist') // eslint-disable-line snakecasejs/snakecasejs
            .bail()
    ],
    async repo_info(req, res){
        // GET /repos/:slug

        logger.debug(`Request for repoInfo for ${req.params.repo_slug}`);
        const repo = await get_or_construct_repo(req.params.repo_slug);        
        
        res.json_success({
            slug: repo.slug,
            url: repo.url,
            packages: repo.packages.length
        });
    },
    repo_packages_validators: [
        param('repo_slug')
            .isSlug() // eslint-disable-line snakecasejs/snakecasejs
            .bail()
            .custom(value=>state.state.get('repositories').has(value))
            .withMessage('repository does not exist') // eslint-disable-line snakecasejs/snakecasejs
            .bail()
    ],
    async repo_packages(req, res){
        // GET /repos/:slug/packages
        logger.debug('Request to repoPackages');

        const repo = await get_or_construct_repo(req.params.repo_slug);        
        if(repo == null) return res.json_error(`Requested repo ${req.params.repo_slug} does not exist`, 404);

        res.json_success({
            packages: repo.packages.map(pkg=>({
                language: pkg.language,
                language_version: pkg.version.raw,
                installed: pkg.installed
            }))
        });
    },
    package_info_validators: [
        param('repo_slug')
            .isSlug() // eslint-disable-line snakecasejs/snakecasejs
            .bail()
            .custom(value=>state.state.get('repositories').has(value))
            .withMessage('repository does not exist') // eslint-disable-line snakecasejs/snakecasejs
            .bail()
    ],
    async package_info(req, res){
        // GET /repos/:slug/packages/:language/:version

        logger.debug('Request to packageInfo');

        const repo = await get_or_construct_repo(req.params.repo_slug);        

        const pkg = await get_package(repo, req.params.language, req.params.version);
        if(pkg == null) return res.json_error(`Requested package ${req.params.language}-${req.params.version} does not exist`, 404);

        res.json_success({
            language: pkg.language,
            language_version: pkg.version.raw,
            author: pkg.author,
            buildfile: pkg.buildfile,
            size: pkg.size,
            dependencies: pkg.dependencies,
            installed: pkg.installed
        });
    },
    async package_install(req,res){
        // POST /repos/:slug/packages/:language/:version

        logger.debug('Request to packageInstall');

        const repo = await get_or_construct_repo(req.params.repo_slug);        
        const pkg = await get_package(repo, req.params.language, req.params.version);
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
        // DELETE /repos/:slug/packages/:language/:version

        //res.json(req.body); //TODO
        res.json_error('not implemented', 500);
    }
};