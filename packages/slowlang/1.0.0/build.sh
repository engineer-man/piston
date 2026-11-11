#!/usr/bin/env bash

# source python 3.12
source ../../python/3.12.0/build.sh

# clone slowlang
git clone -q 'https://github.com/sebin-gg/slowlang' slowlang

cd slowlang

# pin to a known commit on main
git checkout 6c14e78

cd ..
