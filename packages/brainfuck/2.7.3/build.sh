#!/usr/bin/env bash

# Put instructions to build your package in here
PREFIX=$(realpath $(dirname $0))

git clone https://github.com/fabianishere/brainfuck.git

cd brainfuck
git checkout 6ea0f173989df4d5ce698e1f3c95f2cd0535ebd1


mkdir -p build

cd build

cmake .. -DCMAKE_INSTALL_PREFIX=$PREFIX/ -DENABLE_EDITLINE=OFF

make -j$(nproc)
make install -j$(nproc)

cd ../../
rm -rf brainfuck
