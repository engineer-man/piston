// Globals are things the user shouldn't change in config, but is good to not use inline constants for
const is_docker = require('is-docker');
const fss = require('fs');
const platform = `${is_docker() ? 'docker' : 'baremetal'}-${
    fss.read_file_sync('/etc/os-release')
        .toString()
        .split('\n')
        .find(x=>x.startsWith('ID'))
        .replace('ID=','')
}`;

module.exports = {
    data_directories: {
        packages: 'packages',
        jobs: 'jobs'
    },
    version: require('../package.json').version,
    platform,
    pkg_installed_file: '.ppman-installed' //Used as indication for if a package was installed
};