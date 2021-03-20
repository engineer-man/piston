#!/usr/bin/env bash

PREFIX=$(realpath $(dirname $0))

# Installing LLVM and clang (the latter is optional but recommended)
curl "http://llvm.org/releases/3.4/llvm-3.4.src.tar.gz"
curl "http://llvm.org/releases/3.4/clang-3.4.src.tar.gz"
tar xfvz llvm-3.4.src.tar.gz
tar xfvz clang-3.4.src.tar.gz

mv clang-3.4 llvm-3.4/tools/clang
# Cleaning up gzip files.
rm llvm-3.4.src.tar.gz && rm clang-3.4.src.tar.gz
cd llvm-3.4

# Building and installing - LLVM and clang
./configure --enable-shared --enable-optimized --enable-targets=host-only --prefix "$PREFIX"
make -j$(nproc)
make install -j$(nproc)

# Installing Pure
curl -sSL "https://github.com/agraef/pure-lang/releases/download/pure-0.68/pure-0.68.tar.gz"
tar xfvz pure-0.68.tar.gz
rm pure-0.68.tar.gz
cd pure-0.68

# Building and installing pure-lang
./configure --enable-release --prefix "$PREFIX"
make -j$(nproc)
make install -j$(nproc)
