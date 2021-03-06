#!/bin/bash

curl "https://www.python.org/ftp/python/3.9.1/Python-3.9.1.tgz" -o python.tar.gz
tar xzf python.tar.gz --strip-components=1
rm python.tar.gz

./configure --prefix /piston/packages/python/3.9.1/python-3.9.1
make -j$(nproc)
ln -s python python3.9

