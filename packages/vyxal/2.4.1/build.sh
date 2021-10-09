#!/usr/bin/env bash

# get Python source
source ../../python/3.9.4/build.sh

# add regex and pwn modules
bin/pip3 install regex pwn

# make vyxal directory
mkdir vyxal
cd vyxal

# Vyxal install
curl -L "https://github.com/Vyxal/Vyxal/archive/refs/tags/v2.4.1.tar.gz" -o vyxal.tar.xz
tar xf vyxal.tar.xz --strip-components=1
rm vyxal.tar.xz

cd ..