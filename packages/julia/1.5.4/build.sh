#!/usr/bin/env bash

# Install location
PREFIX=$(realpath $(dirname $0))

mkdir -p build
cd build

# Download and extract Julia source
curl -L "https://github.com/JuliaLang/julia/releases/download/v1.5.4/julia-1.5.4.tar.gz" -o julia.tar.gz
tar xzf julia.tar.gz --strip-components=1

# Build
make -j$(nproc)
echo "prefix=$PREFIX" > Make.user
make install -j$(nproc)

# Cleanup
cd ..
rm -rf build
