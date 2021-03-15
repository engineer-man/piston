#!/usr/bin/env bash

# Put instructions to build your package in here
PREFIX=$(realpath $(dirname $0))

mkdir -p build

cd build

curl "https://ftp.gnu.org/gnu/bash/bash-5.1.tar.gz" -o bash.tar.gz

tar xzf bash.tar.gz --strip-components=1

# === autoconf based ===
./configure --prefix "$PREFIX"

make -j$(nproc)
make install -j$(nproc)
cd ../
rm -rf build

