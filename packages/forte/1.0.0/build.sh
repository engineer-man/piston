#!/bin/bash

# the forter interpreter requries ruby
source ../../ruby/3.0.1/build.sh

mkdir -p build

git clone -q "https://github.com/judofyr/forter" build/forter
cd build/forter

mv bin/* ../../bin/
mv lib/* ../../lib/

cd ../../
rm -rf build
