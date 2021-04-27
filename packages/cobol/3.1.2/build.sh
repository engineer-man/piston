#!/usr/bin/env bash

# Put instructions to build your package in here
PREFIX=$(realpath $(dirname $0))

mkdir -p build

cd build

curl -OL "https://downloads.sourceforge.net/project/gnucobol/gnucobol/3.1/gnucobol-3.1.2.tar.xz"

tar xf gnucobol-3.1.2.tar.xz --strip-components=1

# === autoconf based ===
./configure --prefix "$PREFIX" --without-db

make -j$(nproc)
make install -j$(nproc)
cd ../
rm -rf build
