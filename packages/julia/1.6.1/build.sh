#!/usr/bin/env bash

# Install location
PREFIX=$(realpath $(dirname $0))

mkdir -p build
cd build

# Download and extract Julia source
curl -L "https://github.com/JuliaLang/julia/releases/download/v1.6.1/julia-1.6.1.tar.gz" -o julia.tar.gz
tar xzf julia.tar.gz --strip-components=1

# Build
echo "JULIA_CPU_TARGET=generic;sandybridge,-xsaveopt,clone_all;haswell,-rdrnd,base(1)
prefix=$PREFIX" > Make.user
make -j$(nproc)
make install -j$(nproc)

# Cleanup
cd ..
rm -rf build
