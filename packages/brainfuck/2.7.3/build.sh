#!/usr/bin/env bash

# Put instructions to build your package in here
PREFIX=$(realpath $(dirname $0))

mkdir -p build

git clone https://github.com/fabianishere/brainfuck.git

cd build

cmake -DCMAKE_INSTALL_PREFIX=$PREFIX -DENABLE_EDITLINE=OFF ../brainfuck

make -j$(nproc)
make install -j$(nproc)

cd ../
rm -rf build brainfuck
