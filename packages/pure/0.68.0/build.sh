#!/usr/bin/env bash

PREFIX=$(realpath $(dirname $0))

# Python is available in the container as 'python3' and 'python2', not as 'python'
alias python=python3

# Installing LLVM and clang (the latter is optional but recommended)
curl -OL "http://llvm.org/releases/3.4/llvm-3.4.src.tar.gz"
curl -OL "http://llvm.org/releases/3.4/clang-3.4.src.tar.gz"
tar xfz llvm-3.4.src.tar.gz
tar xfz clang-3.4.src.tar.gz

mv clang-3.4 llvm-3.4/tools/clang
# Cleaning up gzip files.
rm llvm-3.4.src.tar.gz && rm clang-3.4.src.tar.gz
cd llvm-3.4

# Building and installing - LLVM and clang
./configure --prefix="$PREFIX" --enable-optimized --enable-targets=host-only --enable-docs="no" --enable-assertions="no"
make -j$(nproc)
make install -j$(nproc)

# Installing Pure
curl -sSLO "https://github.com/agraef/pure-lang/releases/download/pure-0.68/pure-0.68.tar.gz"
tar xfz pure-0.68.tar.gz
rm pure-0.68.tar.gz
cd pure-0.68

# Building and installing pure-lang
./configure --prefix="$PREFIX" --enable-release --with-tool-prefix="$PREFIX/bin" --with-static-llvm
make -j$(nproc)
make install -j$(nproc)
