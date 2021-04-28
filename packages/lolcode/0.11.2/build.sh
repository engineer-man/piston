#!/usr/bin/env bash

PREFIX=$(realpath $(dirname $0))

mkdir -p build
cd build

# lolcode release
curl -L "https://github.com/justinmeza/lci/archive/refs/tags/v0.11.2.tar.gz" -o lolcode.tar.gz
tar xzf lolcode.tar.gz --strip-components=1

# Building and installing lolcode
cmake -DCMAKE_INSTALL_PREFIX:STRING="$PREFIX" .
make -j$(nproc)
make install -j$(nproc)

# Cleaning up
cd ../ && rm -rf build
