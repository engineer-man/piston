#!/bin/bash

PREFIX=$(realpath $(dirname $0))

mkdir build
cd build

curl https://cloud.r-project.org/src/base/R-4/R-4.1.1.tar.gz -o R.tar.gz
tar xzf R.tar.gz --strip-components 1

./configure --prefix="$PREFIX" --with-x=no
make -j$(nproc)
make install -j$(nproc)

cd ../
rm -rf build
