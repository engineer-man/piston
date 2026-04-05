exports.command = 'ppman';
exports.aliases = ['pkg'];
exports.describe = 'Package Manager';

exports.builder = yargs => yargs.commandDir('ppman_commands').demandCommand();
