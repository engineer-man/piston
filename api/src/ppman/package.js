const logger = require('logplease').create('ppman/package');
const semver = require('semver');
const config = require('../config');
const globals = require('../globals');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs/promises');
const fss = require('fs');
const cp = require('child_process');
const crypto = require('crypto');
const runtime = require('../runtime');

class Package {

    constructor({ language, version, download, checksum }){
        this.language = language;
        this.version = semver.parse(version);
        this.checksum = checksum;
        this.download = download;
    }

    get installed() {
        return fss.exists_sync(path.join(this.install_path, globals.pkg_installed_file));
    }

    get install_path() {
        return path.join(
            config.data_directory,
            globals.data_directories.packages,
            this.language,
            this.version.raw
        );
    }

    async install() {
        if (this.installed) {
            throw new Error('Already installed');
        }

        logger.info(`Installing ${this.language}-${this.version.raw}`);

        if (fss.exists_sync(this.install_path)) {
            logger.warn(`${this.language}-${this.version.raw} has residual files. Removing them.`);
            await fs.rm(this.install_path, { recursive: true, force: true });
        }

        logger.debug(`Making directory ${this.install_path}`);
        await fs.mkdir(this.install_path, {recursive: true});

        logger.debug(`Downloading package from ${this.download} in to ${this.install_path}`);
        const pkgpath = path.join(this.install_path, 'pkg.tar.gz');
        const download = await fetch(this.download);

        const file_stream = fss.create_write_stream(pkgpath);
        await new Promise((resolve, reject) => {
            download.body.pipe(file_stream);
            download.body.on('error', reject);

            file_stream.on('finish', resolve);
        });

        logger.debug('Validating checksums');
        logger.debug(`Assert sha256(pkg.tar.gz) == ${this.checksum}`);
        const cs = crypto.create_hash("sha256")
            .update(fss.readFileSync(pkgpath))
            .digest('hex');

        if (cs !== this.checksum) {
            throw new Error(`Checksum miss-match want: ${val} got: ${cs}`);
        }

        logger.debug(`Extracting package files from archive ${pkgpath} in to ${this.install_path}`);

        await new Promise((resolve, reject) => {
            const proc = cp.exec(`bash -c 'cd "${this.install_path}" && tar xzf ${pkgpath}'`);

            proc.once('exit', (code, _) => {
                code === 0 ? resolve() : reject();
            });

            proc.stdout.pipe(process.stdout);
            proc.stderr.pipe(process.stderr);

            proc.once('error', reject);
        });

        logger.debug('Registering runtime');
        new runtime.Runtime(this.install_path);

        logger.debug('Caching environment');
        const get_env_command = `cd ${this.install_path}; source environment; env`;

        const envout = await new Promise((resolve, reject) => {
            let stdout = '';

            const proc = cp
                .spawn(
                    'env',
                    ['-i','bash','-c',`${get_env_command}`],
                    {
                        stdio: ['ignore', 'pipe', 'pipe']
                    }
                );

            proc.once('exit', (code, _) => {
                code === 0 ? resolve() : reject();
            });

            proc.stdout.on('data', data => {
                stdout += data;
            });

            proc.once('error', reject);
        });

        const filtered_env = envout
            .split('\n')
            .filter(l => !['PWD','OLDPWD','_', 'SHLVL'].includes(l.split('=',2)[0]))
            .join('\n');

        await fs.write_file(path.join(this.install_path, '.env'), filtered_env);

        logger.debug('Writing installed state to disk');
        await fs.write_file(path.join(this.install_path, globals.pkg_installed_file), Date.now().toString());

        logger.info(`Installed ${this.language}-${this.version.raw}`);

        return {
            language: this.language,
            version: this.version.raw
        };
    }

}

module.exports = {
    Package
};
