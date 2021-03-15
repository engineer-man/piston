#!/bin/bash

source ../../erlang/23.0.0/build.sh

export PATH=$PWD/bin:$PATH

PREFIX=$(realpath $(dirname $0))

mkdir -p build

cd build

curl -L "https://github.com/elixir-lang/elixir/archive/v1.11.3.tar.gz" -o elixir.tar.gz
tar xzf elixir.tar.gz --strip-components=1
rm elixir.tar.gz

./configure --prefix "$PREFIX"
make -j$(nproc)

cd ..

cp -r build/bin .
cp -r build/lib .

rm -rf build
