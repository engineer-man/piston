#!/usr/bin/env bash

[[ -d "bin" ]] && exit 0
PREFIX=$(realpath $(dirname $0))

curl -L "https://github.com/Jamesbarford/holyc-lang/archive/refs/tags/beta-v0.0.9.zip" -o holyc.zip
unzip ./holyc.zip
cd ./holyc-lang-beta-v0.0.9

mkdir "${PREFIX}"/lib

make \
    INSTALL_PREFIX="${PREFIX}"
make install
rm -f ./holyc.zip 
