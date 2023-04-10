#!/bin/bash

PREFIX=$(realpath $(dirname $0))

mkdir -p build/mono build/mono-basic
cd build

curl "https://download.mono-project.com/sources/mono/mono-6.12.0.182.tar.xz" -o mono.tar.xz
curl -L "https://github.com/mono/mono-basic/archive/refs/tags/4.7.tar.gz" -o mono-basic.tar.gz
tar xf mono.tar.xz --strip-components=1 -C mono
tar xf mono-basic.tar.gz --strip-components=1 -C mono-basic

# Compiling Mono
cd mono

./configure --prefix "$PREFIX"

make -j$(nproc)
make install -j$(nproc)

export PATH="$PREFIX/bin:$PATH"  # To be able to use mono commands

# Compiling mono-basic
cd ../mono-basic
./configure --prefix="$PREFIX"

make -j$(nproc) PLATFORM="linux"  # Avoids conflict with the $PLATFORM variable we have
make install -j$(nproc) PLATFORM="linux"

# Remove redundant files
cd ../../
rm -rf build
