#!/bin/bash

PREFIX=$(realpath $(dirname $0))

mkdir -p build/mono
cd build

curl "https://download.mono-project.com/sources/mono/mono-6.12.0.122.tar.xz" -o mono.tar.xz
tar xf mono.tar.xz --strip-components=1 -C mono

cd mono

./configure --prefix "$PREFIX"

make -j$(nproc) 
make install -j$(nproc)

cd ../../
rm -rf build

