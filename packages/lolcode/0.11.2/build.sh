#!/usr/bin/env bash

PREFIX=$(realpath $(dirname $0))

# Cloning lolcode source
git clone https://github.com/justinmeza/lci.git lolcode
cd lolcode

# Building and installing lolcode
./install.py --prefix="$PREFIX"

# Cleaning up
cd ../ && rm -rf lolcode