#!/usr/bin/env bash

# Put instructions to build your package in here
PREFIX=$(realpath $(dirname $0))

git clone https://github.com/fabianishere/brainfuck.git

cd brainfuck

mkdir -p build
cd build

cmake -DCMAKE_INSTALL_PREFIX=$PREFIX/ -DENABLE_EDITLINE=OFF ..

make -j$(nproc)
make install -j$(nproc)

cd ../../
rm -rf brainfuck
