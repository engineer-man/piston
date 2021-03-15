#!/bin/bash

source ../../python/3.9.1/build.sh

mkdir -p build

git clone -q https://github.com/DennisMitchell/jellylanguage.git build/jelly
cd build/jelly
../../bin/python3.9 setup.py install --optimize=1

cd ../../
rm -rf build
