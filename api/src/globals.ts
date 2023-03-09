// Globals are things the user shouldn't change in config, but is good to not use inline constants for
import is_docker from 'is-docker';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export const platform = `${is_docker() ? 'docker' : 'baremetal'}-${readFileSync(
    '/etc/os-release'
)
    .toString()
    .split('\n')
    .find(x => x.startsWith('ID'))
    .replace('ID=', '')}`;

export const data_directories = {
    packages: 'packages',
    jobs: 'jobs',
};
// @ts-ignore
export const version: string = require('../package.json').version;

export const pkg_installed_file = '.ppman-installed'; //Used as indication for if a package was installed
export const clean_directories = ['/dev/shm', '/run/lock', '/tmp', '/var/tmp'];
