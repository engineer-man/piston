#!/usr/bin/env bash

# build prolog 8.2.4 as dependency
source ../../prolog/8.2.4/build.sh

# curl brachylog 1.0.0
curl -L "https://github.com/JCumin/Brachylog/archive/refs/tags/v1.0-ascii.tar.gz" -o brachylog.tar.gz
tar xzf brachylog.tar.gz --strip-components=1
rm brachylog.tar.gz

# move swi prolog to working directory
cp bin/swipl swipl

# give execution permission to swipl
chmod +x swipl

# add some code the branchylog.pl so we don't have to escape backslashes while using the interactive mode
echo '

:-feature(argv, [Code, Stdin]), run_from_atom(Code, Stdin, _), halt.' >> prolog_parser/brachylog.pl