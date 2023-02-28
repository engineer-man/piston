import { create } from 'logplease'
import { parse, satisfies, rcompare } from 'semver';
import config from './config';
import * as globals from './globals';
import fetch from 'node-fetch';
import { join } from 'path';
import { rm, mkdir, writeFile, rmdir } from 'fs/promises';
import { existsSync, createWriteStream, createReadStream } from 'fs';
import { exec, spawn } from 'child_process';
import { createHash } from 'crypto';
import { load_package, get_runtime_by_name_and_version } from './runtime';
import chownr from 'chownr';
import { promisify } from 'util';

const logger = create('package', {});
class Package {
    constructor({ language, version, download, checksum }) {
        this.language = language;
        this.version = parse(version);
        this.checksum = checksum;
        this.download = download;
    }

    get installed() {
        return existsSync(
            join(this.install_path, globals.pkg_installed_file)
        );
    }

    get install_path() {
        return join(
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

        if (existsSync(this.install_path)) {
            logger.warn(
                `${this.language}-${this.version.raw} has residual files. Removing them.`
            );
            await rm(this.install_path, { recursive: true, force: true });
        }

        logger.debug(`Making directory ${this.install_path}`);
        await mkdir(this.install_path, { recursive: true });

        logger.debug(
            `Downloading package from ${this.download} in to ${this.install_path}`
        );
        const pkgpath = join(this.install_path, 'pkg.tar.gz');
        const download = await fetch(this.download);

        const file_stream = createWriteStream(pkgpath);
        await new Promise((resolve, reject) => {
            download.body.pipe(file_stream);
            download.body.on('error', reject);

            file_stream.on('finish', resolve);
        });

        logger.debug('Validating checksums');
        logger.debug(`Assert sha256(pkg.tar.gz) == ${this.checksum}`);
        const hash = createHash('sha256');

        const read_stream = createReadStream(pkgpath);
        await new Promise((resolve, reject) => {
            read_stream.on('data', chunk => hash.update(chunk));
            read_stream.on('end', () => resolve());
            read_stream.on('error', error => reject(error));
        });

        const cs = hash.digest('hex');

        if (cs !== this.checksum) {
            throw new Error(
                `Checksum miss-match want: ${this.checksum} got: ${cs}`
            );
        }

        logger.debug(
            `Extracting package files from archive ${pkgpath} in to ${this.install_path}`
        );

        await new Promise((resolve, reject) => {
            const proc = exec(
                `bash -c 'cd "${this.install_path}" && tar xzf ${pkgpath}'`
            );

            proc.once('exit', (code, _) => {
                code === 0 ? resolve() : reject();
            });

            proc.stdout.pipe(process.stdout);
            proc.stderr.pipe(process.stderr);

            proc.once('error', reject);
        });

        logger.debug('Registering runtime');
        load_package(this.install_path);

        logger.debug('Caching environment');
        const get_env_command = `cd ${this.install_path}; source environment; env`;

        const envout = await new Promise((resolve, reject) => {
            let stdout = '';

            const proc = spawn(
                'env',
                ['-i', 'bash', '-c', `${get_env_command}`],
                {
                    stdio: ['ignore', 'pipe', 'pipe'],
                }
            );

            proc.once('exit', (code, _) => {
                code === 0 ? resolve(stdout) : reject();
            });

            proc.stdout.on('data', data => {
                stdout += data;
            });

            proc.once('error', reject);
        });

        const filtered_env = envout
            .split('\n')
            .filter(
                l =>
                    !['PWD', 'OLDPWD', '_', 'SHLVL'].includes(
                        l.split('=', 2)[0]
                    )
            )
            .join('\n');

        await writeFile(join(this.install_path, '.env'), filtered_env);

        logger.debug('Changing Ownership of package directory');
        await promisify(chownr)(this.install_path, 0, 0);

        logger.debug('Writing installed state to disk');
        await writeFile(
            join(this.install_path, globals.pkg_installed_file),
            Date.now().toString()
        );

        logger.info(`Installed ${this.language}-${this.version.raw}`);

        return {
            language: this.language,
            version: this.version.raw,
        };
    }

    async uninstall() {
        logger.info(`Uninstalling ${this.language}-${this.version.raw}`);

        logger.debug('Finding runtime');
        const found_runtime = get_runtime_by_name_and_version(
            this.language,
            this.version.raw
        );

        if (!found_runtime) {
            logger.error(
                `Uninstalling ${this.language}-${this.version.raw} failed: Not installed`
            );
            throw new Error(
                `${this.language}-${this.version.raw} is not installed`
            );
        }

        logger.debug('Unregistering runtime');
        found_runtime.unregister();

        logger.debug('Cleaning files from disk');
        await rmdir(this.install_path, { recursive: true });

        logger.info(`Uninstalled ${this.language}-${this.version.raw}`);

        return {
            language: this.language,
            version: this.version.raw,
        };
    }

    static async get_package_list() {
        const repo_content = await fetch(config.repo_url).then(x => x.text());

        const entries = repo_content.split('\n').filter(x => x.length > 0);

        return entries.map(line => {
            const [language, version, checksum, download] = line.split(',', 4);

            return new Package({
                language,
                version,
                checksum,
                download,
            });
        });
    }

    static async get_package(lang, version) {
        const packages = await Package.get_package_list();

        const candidates = packages.filter(pkg => {
            return (
                pkg.language == lang && satisfies(pkg.version, version)
            );
        });

        candidates.sort((a, b) => rcompare(a.version, b.version));

        return candidates[0] || null;
    }
}

export default Package;
