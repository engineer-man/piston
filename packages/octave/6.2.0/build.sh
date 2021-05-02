#!/usr/bin/env bash

# Build octave from source
PREFIX=$(realpath $(dirname $0))

mkdir -p build

cd build

curl -L "https://ftpmirror.gnu.org/octave/octave-6.2.0.tar.gz" -o octave.tar.gz

tar xzf octave.tar.gz --strip-components=1

# === autoconf based ===
# Disable support for GUI, HDF5 and Java
./configure --prefix "$PREFIX" --without-opengl --without-qt --without-x --without-hdf5 --disable-java

make -j$(nproc)
make install -j$(nproc)

cd ../
rm -rf build
