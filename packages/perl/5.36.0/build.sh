#!/bin/bash

PREFIX=$(realpath $(dirname $0))

mkdir -p build

cd build

curl "https://www.cpan.org/src/5.0/perl-5.36.0.tar.gz" -o perl.tar.gz
tar xzf perl.tar.gz --strip-components=1
./Configure -des -Dprefix="$PREFIX"

make -j$(nproc)
make install -j$(nproc)

cd ..

rm -rf build 