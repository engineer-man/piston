#!/usr/bin/env bash

# Put instructions to build your package in here
PREFIX=$(realpath $(dirname $0))

mkdir -p build

cd build

curl "http://gondor.apana.org.au/~herbert/dash/files/dash-0.5.11.tar.gz" -o dash.tar.gz
tar xzf dash.tar.gz --strip-components=1

./configure --prefix "$PREFIX" &&
make -j$(nproc) &&
make install -j$(nproc)

cd ../

rm -rf build
