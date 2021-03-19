#!/bin/bash

PREFIX=$(realpath $(dirname $0))

mkdir -p build

cd build

# Prebuilt binary - source *can* be built, but it requires gcc
curl -L "https://nim-lang.org/download/nim-1.4.4-linux_x64.tar.xz" -o nim.tar.xz
tar xf nim.tar.xz --strip-components=1
rm nim.tar.xz

./install.sh "$PREFIX"

cd ../

rm -rf build
