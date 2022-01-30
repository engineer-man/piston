// Globals are things the user shouldn't change in config, but is good to not use inline constants for

module.exports = {
    data_directories: {
        jobs: 'jobs',
    },
    version: require('../package.json').version,
    clean_directories: ['/dev/shm', '/run/lock', '/tmp', '/var/tmp'],
};
