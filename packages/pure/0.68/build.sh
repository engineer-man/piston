#!/usr/bin/env bash

PREFIX=$(realpath $(dirname $0))

# Installing LLVM and clang (the latter is optional but recommended)
curl "https://releases.llvm.org/3.4.2/llvm-3.4.2.src.tar.gz" -o llvm.tar.gz
curl "https://releases.llvm.org/3.4.2/cfe-3.4.2.src.tar.gz" -o clang.tar.gz
tar xfz llvm.tar.gz --strip-components=1
tar xfz clang.tar.gz --strip-components=1

mv clang llvm/tools/clang
rm llvm.tar.gz && rm clang.tar.gz
cd llvm

# Building and installing - LLVM and clang
./configure --enable-shared --enable-optimized --enable-targets=host-only --prefix "$PREFIX"
make -j$(nproc)
make install -j$(nproc)

# Installing Pure
curl "https://github.com/agraef/pure-lang/releases/download/pure-0.68/pure-0.68.tar.gz" -o pure.tar.gz
tar xzf pure.tar.gz --strip-components=1
rm pure.tar.gz
cd pure

# Building and installing pure-lang
./configure --enable-release --prefix "$PREFIX"
make -j$(nproc)
make install -j$(nproc)
