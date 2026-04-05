const chalk = require('chalk');
const fs = require('fs/promises');
const minimatch = require('minimatch');
const semver = require('semver');

exports.command = ['spec <specfile>'];
exports.aliases = ['s'];
exports.describe =
    "Install the packages described in the spec file, uninstalling packages which aren't in the list";

function does_match(package, rule) {
    const nameMatch = minimatch(package.language, rule.package_selector);
    const versionMatch = semver.satisfies(
        package.language_version,
        rule.version_selector
    );

    return nameMatch && versionMatch;
}

exports.handler = async ({ axios, specfile }) => {
    const spec_contents = await fs.readFile(specfile);
    const spec_lines = spec_contents.toString().split('\n');

    const rules = [];

    for (const line of spec_lines) {
        const rule = {
            _raw: line.trim(),
            comment: false,
            package_selector: null,
            version_selector: null,
            negate: false,
        };

        if (line.starts_with('#')) {
            rule.comment = true;
        } else {
            let l = line.trim();
            if (line.starts_with('!')) {
                rule.negate = true;
                l = line.slice(1).trim();
            }

            const [pkg, ver] = l.split(' ', 2);
            rule.package_selector = pkg;
            rule.version_selector = ver;
        }

        if (rule._raw.length != 0) rules.push(rule);
    }

    const packages_req = await axios.get('/api/v2/packages');
    const packages = packages_req.data;

    const installed = packages.filter(pkg => pkg.installed);

    let ensure_packages = [];

    for (const rule of rules) {
        if (rule.comment) continue;

        const matches = [];

        if (!rule.negate) {
            for (const package of packages) {
                if (does_match(package, rule)) matches.push(package);
            }

            const latest_matches = matches.filter(pkg => {
                const versions = matches
                    .filter(x => x.language == pkg.language)
                    .map(x => x.language_version)
                    .sort(semver.rcompare);
                return versions[0] == pkg.language_version;
            });

            for (const match of latest_matches) {
                if (
                    !ensure_packages.find(
                        pkg =>
                            pkg.language == match.language &&
                            pkg.language_version == match.language_version
                    )
                )
                    ensure_packages.push(match);
            }
        } else {
            ensure_packages = ensure_packages.filter(
                pkg => !does_match(pkg, rule)
            );
        }
    }

    const operations = [];

    for (const package of ensure_packages) {
        if (!package.installed)
            operations.push({
                type: 'install',
                package: package.language,
                version: package.language_version,
            });
    }

    for (const installed_package of installed) {
        if (
            !ensure_packages.find(
                pkg =>
                    pkg.language == installed_package.language &&
                    pkg.language_version == installed_package.language_version
            )
        )
            operations.push({
                type: 'uninstall',
                package: installed_package.language,
                version: installed_package.language_version,
            });
    }

    console.log(chalk.bold.yellow('Actions'));
    for (const op of operations) {
        console.log(
            (op.type == 'install'
                ? chalk.green('Install')
                : chalk.red('Uninstall')) + ` ${op.package} ${op.version}`
        );
    }

    if (operations.length == 0) {
        console.log(chalk.gray('None'));
    }

    for (const op of operations) {
        if (op.type == 'install') {
            try {
                const install = await axios.post(`/api/v2/packages`, {
                    language: op.package,
                    version: op.version,
                });

                if (!install.data.language)
                    throw new Error(install.data.message); // Go to exception handler

                console.log(
                    chalk.bold.green('Installed'),
                    op.package,
                    op.version
                );
            } catch (e) {
                console.log(
                    chalk.bold.red('Failed to install') +
                        ` ${op.package} ${op.version}:`,
                    e.message
                );
            }
        } else if (op.type == 'uninstall') {
            try {
                const install = await axios.delete(`/api/v2/packages`, {
                    data: {
                        language: op.package,
                        version: op.version,
                    },
                });

                if (!install.data.language)
                    throw new Error(install.data.message); // Go to exception handler

                console.log(
                    chalk.bold.green('Uninstalled'),
                    op.package,
                    op.version
                );
            } catch (e) {
                console.log(
                    chalk.bold.red('Failed to uninstall') +
                        ` ${op.package} ${op.version}:`,
                    e.message
                );
            }
        }
    }
};
