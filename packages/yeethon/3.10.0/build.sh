#!/bin/bash

PREFIX=$(realpath $(dirname $0))

mkdir -p build

cd build

git clone https://github.com/Yeethon/cyeethon
cd cyeethon

# Building and installing yeethon
./configure --prefix "$PREFIX" --with-ensurepip=install
make -j$(nproc)
make install -j$(nproc)

# Cleaning up
cd ../../ && rm -rf build

# This is alpha version of python, hence most of the libraries are not compatible with python3.10.0
# As a result, they will not be compatible with yeethon3.10 too
# bin/pip3 install numpy scipy pandas pycrypto whoosh bcrypt passlib
