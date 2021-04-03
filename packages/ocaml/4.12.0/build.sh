#!/bin/bash

PREFIX=$(realpath $(dirname $0))

mkdir -p build
cd build

curl -L "https://github.com/ocaml/ocaml/archive/4.12.0.tar.gz" -o ocaml.tar.gz
tar xzf ocaml.tar.gz --strip-components=1
rm ocaml.tar.gz

./configure --prefix="$PREFIX"
make -j$(nproc)
make install -j$(nproc)

cd ..
rm -rf build
