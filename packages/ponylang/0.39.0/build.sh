#!/usr/bin/env bash

PREFIX=$(realpath $(dirname $0))

# get sources - only get the latest copy of the relevant files
git clone --depth 1 https://github.com/ponylang/ponyc.git

# updates all submodules recursively along their tracking branches
# i.e. https://github.com/ponylang/ponyc/blob/main/.gitmodules
git submodule update --recursive --init

# build
make -j$(nproc)
# Install pony into `$PREFIX`.
make prefix="$PREFIX" install
