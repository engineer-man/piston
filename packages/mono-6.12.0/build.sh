#!/bin/bash

mkdir -p build/tmp build/mono
cd build

curl "https://download.mono-project.com/sources/mono/mono-6.12.0.122.tar.xz" -o mono.tar.xz
tar xf mono.tar.xz --strip-components=1 -C mono

cd mono

./configure --prefix /piston/packages/mono/6.12.0/mono-6.12.0

make -j$(nproc) 
DESTDIR=build/tmp make install -j$(nproc)

mv build/tmp/piston/packages/mono/6.12.0/mono-6.12.0 ../../mono-6.12.0

cd ../../
rm -rf build
