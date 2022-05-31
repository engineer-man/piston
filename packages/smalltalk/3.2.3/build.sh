#!/usr/bin/env bash

set -e

curl -L https://ftp.gnu.org/gnu/smalltalk/smalltalk-3.2.3.tar.gz -o smalltalk-3.2.3.tar.gz
tar xzf smalltalk-3.2.3.tar.gz

rm smalltalk-3.2.3.tar.gz

cd smalltalk-3.2.3

./configure
rm libc.la

make
make install

chmod +x gst
cd ..
