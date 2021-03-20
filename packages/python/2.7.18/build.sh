#!/bin/bash

PREFIX=$(realpath $(dirname $0))

mkdir -p build

cd build

curl "https://www.python.org/ftp/python/2.7.18/Python-2.7.18.tgz" -o python.tar.gz
tar xzf python.tar.gz --strip-components=1
rm python.tar.gz

./configure --prefix "$PREFIX" --with-ensurepip=install
make -j$(nproc)
make install -j$(nproc)

cd ..

rm -rf build 
bin/pip2 install -U pip==20.3.*
# Upgrade pip to latest supported version

bin/pip2 install numpy scipy pycrypto whoosh bcrypt passlib
