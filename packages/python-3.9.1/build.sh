#!/bin/bash

mkdir -p build/tmp build/python
cd build

curl "https://www.python.org/ftp/python/3.9.1/Python-3.9.1.tgz" -o python.tar.gz
tar xzf python.tar.gz --strip-components=1 -C python

cd python


./configure --prefix /piston/packages/python/3.9.1/python-3.9.1
make -j$(nproc)
DESTDIR=build/tmp make altinstall -j$(nproc)


mv build/tmp/piston/packages/python/3.9.1/python-3.9.1 ../../output


