#!/usr/bin/env bash

# Put instructions to build your package in here
PREFIX=$(realpath $(dirname $0))

mkdir -p build

cd build

curl "https://ftp.gnu.org/gnu/gawk/gawk-5.1.0.tar.gz" -o gawk.tar.gz

tar xzf gawk.tar.gz --strip-components=1

# === autoconf based ===
./configure --prefix "$PREFIX"

make -j$(nproc)
make install -j$(nproc)
cd ../
rm -rf build

