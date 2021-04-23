#!/usr/bin/env bash

# Put instructions to build your package in here
PREFIX=$(realpath $(dirname $0))

git clone https://github.com/fabianishere/brainfuck.git

cd brainfuck
git checkout 06f84462e0a96487670a4b8024e3ec531e0377ee


mkdir -p build

cd build

cmake .. -DCMAKE_INSTALL_PREFIX=$PREFIX/ -DENABLE_EDITLINE=OFF

make -j$(nproc)
make install -j$(nproc)

cd ../../
rm -rf brainfuck
