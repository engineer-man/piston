#!/bin/bash

PREFIX=$(realpath $(dirname $0))

mkdir -p build

cd build

curl "https://cache.ruby-lang.org/pub/ruby/2.5/ruby-2.5.1.tar.gz" -o ruby.tar.gz
tar xzf ruby.tar.gz --strip-components=1
rm ruby.tar.gz

./configure --prefix "$PREFIX"
make -j$(nproc)
make install -j$(nproc)

cd ..

rm -rf build 

