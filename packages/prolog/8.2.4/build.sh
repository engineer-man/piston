#!/bin/bash

PREFIX=$(realpath $(dirname $0))

mkdir -p build

cd build

# Source compile
curl -L "https://www.swi-prolog.org/download/stable/src/swipl-8.2.4.tar.gz" -o swipl.tar.gz
tar xzf swipl.tar.gz --strip-components=1
rm swipl.tar.gz

mkdir build
cd build
cmake -DCMAKE_INSTALL_PREFIX="$PREFIX" -DSWIPL_PACKAGES_JAVA=OFF -DSWIPL_PACKAGES_X=OFF -DMULTI_THREADED=OFF -DINSTALL_DOCUMENTATION=OFF ..
make -j$(nproc)
make install -j$(nproc)

cd ../../

rm -rf build
