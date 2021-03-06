#!/bin/bash

mkdir -p build/tmp build/php
cd build

curl "https://www.php.net/distributions/php-8.0.2.tar.gz" -o php.tar.gz
tar xzf php.tar.gz --strip-components=1 -C php

cd php


./configure --prefix /piston/packages/php/8.0.2/php-8.0.2

make -j$(nproc)
INSTALL_ROOT=build/tmp make install -j$(nproc)


mv build/tmp/piston/packages/php/8.0.2/php-8.0.2 ../../php-8.0.2


