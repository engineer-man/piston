#!/bin/bash

PREFIX=$(realpath $(dirname $0))

mkdir -p build/iverilog
cd build/iverilog
curl -L https://github.com/steveicarus/iverilog/archive/refs/tags/v11_0.tar.gz -o iverilog.tar.gz
tar xzf iverilog.tar.gz --strip-components=1

chmod +x ./autoconf.sh
./autoconf.sh
./configure --prefix="$PREFIX"
make -j$(nproc)
make install -j$(nproc)

cd ../../
rm -rf build
