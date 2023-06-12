#!/bin/bash

PREFIX=$(realpath $(dirname $0))

mkdir -p build

cd build

curl https://git.xslendi.xyz/slendi/3Days/archive/main.tar.gz -o 3days.tar.gz

tar xzf 3days.tar.gz --strip-components=1
rm 3days.tar.gz

make

cp -v 3d_loader $PREFIX/.
cp -rv T $PREFIX/.

cd ..

rm -rf build

