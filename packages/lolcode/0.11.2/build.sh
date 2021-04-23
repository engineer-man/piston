#!/usr/bin/env bash

PREFIX=$(realpath $(dirname $0))

# Cloning lolcode source
git clone https://github.com/justinmeza/lci.git lolcode
cd lolcode

# Building and installing lolcode
cmake -DCMAKE_INSTALL_PREFIX:STRING="$PREFIX" .
make -j$(nproc)
make install -j$(nproc)

# Cleaning up
cd ../ && rm -rf lolcode
