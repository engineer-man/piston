#!/bin/bash

PREFIX=$(realpath $(dirname $0))

mkdir -p build

cd build

curl "https://github.com/erlang/otp/releases/download/OTP-23.0/otp_src_23.0.tar.gz" -o erlang.tar.gz -L
tar xzf erlang.tar.gz --strip-components=1
rm erlang.tar.gz

export ERL_TOP=$(pwd)
./configure --prefix "$PREFIX"
make -j$(nproc)
make install -j$(nproc)

cd ..

rm -rf build 

