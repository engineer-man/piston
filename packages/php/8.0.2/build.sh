#!/bin/bash

PREFIX=$(realpath $(dirname $0))

mkdir -p build/php
cd build

curl "https://www.php.net/distributions/php-8.0.2.tar.gz" -o php.tar.gz
tar xzf php.tar.gz --strip-components=1 -C php

cd php


./configure --prefix "$PREFIX"

make -j$(nproc)
make install -j$(nproc)

cd ../../
rm -rf build
