#!/bin/bash

PREFIX=$(realpath $(dirname $0))

mkdir -p build
cd build

# Download and extract ruby
curl "https://cache.ruby-lang.org/pub/ruby/3.0/ruby-3.0.1.tar.gz" -o ruby.tar.gz
tar xzf ruby.tar.gz --strip-components=1
rm ruby.tar.gz

# Autoconf based
./configure --prefix "$PREFIX"
make -j$(nproc)
make install -j$(nproc)

#  Cleanup
cd ..
rm -rf build 

