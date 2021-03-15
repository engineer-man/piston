#!/usr/bin/env bash

# Put instructions to build your package in here
PREFIX=$(realpath $(dirname $0))

mkdir -p build

cd build

curl -L "https://www.nasm.us/pub/nasm/releasebuilds/2.15.05/nasm-2.15.05.tar.gz" -o nasm.tar.gz

tar xzf nasm.tar.gz --strip-components=1

# === autoconf based ===
./configure --prefix "$PREFIX"

make -j$(nproc)
make install -j$(nproc)
cd ../
rm -rf build

