#!/usr/bin/env bash

PREFIX=$(realpath $(dirname $0))

# get sources - only get the latest copy of the relevant files
git clone -q https://github.com/ponylang/ponyc.git ponyc
# release commit for 0.39.0
git reset --hard 85d897b978c5082a1f3264a3a9ad479446d73984

# updates all submodules recursively along their tracking branches
# i.e. https://github.com/ponylang/ponyc/blob/main/.gitmodules
git submodule update --recursive --init

cd ponyc

# build
make -j$(nproc)
# Install pony into `$PREFIX`.
make prefix="$PREFIX" install

rm -rf ponyc