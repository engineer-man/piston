const logger = require('logplease').create('ppman/routes');
const semver = require('semver');
const fetch = require('node-fetch');
const config = require('../config');
const { Package } = require('./package');

const get_package_list = async () => {
    const repo_content = await fetch(config.repo_url).then(x => x.text());

    const entries = repo_content
        .split('\n')
        .filter(x => x.length > 0);

    return entries.map(line => {
        const [ language, version, checksum, download ] = line.split(',', 4);

        return new Package({
            language,
            version,
            checksum,
            download
        });
    });
};

const get_package = async (lang, version) => {
    const packages = await get_package_list();

    const candidates = packages
        .filter(pkg => {
            return pkg.language == lang && semver.satisfies(pkg.version, version)
        });

    candidates.sort((a, b) => semver.rcompare(a.version, b.version));

    return candidates[0] || null;
};

module.exports = {

    // GET /packages
    async package_list(req, res) {
        logger.debug('Request to list packages');

        const packages = await get_package_list();

        packages = packages
            .map(pkg => {
                    return {
                        language: pkg.language,
                        language_version: pkg.version.raw,
                        installed: pkg.installed
                    };
                });

        return res
            .status(200)
            .send(packages);
    },

    // POST /packages/:language/:version
    async package_install(req, res) {
        logger.debug('Request to install package');

        const pkg = await get_package(req.params.language, req.params.version);

        if (pkg == null) {
            return res
                .status(404)
                .send({
                    message: `Requested package ${req.params.language}-${req.params.version} does not exist`
                });
        }

        try {
            const response = await pkg.install();

            return res
                .status(200)
                .send(response);
        } catch(e) {
            logger.error(`Error while installing package ${pkg.language}-${pkg.version}:`, e.message);

            return res
                .status(500)
                .send({
                    message: e.message
                });
        }
    },

    // DELETE /packages/:language/:version
    async package_uninstall(req, res) {
        return res
            .status(500)
            .send({
                message: 'Not implemented'
            });
    }

};
