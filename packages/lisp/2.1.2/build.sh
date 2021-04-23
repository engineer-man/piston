#!/usr/bin/env bash

# Put instructions to build your package in here
PREFIX=$(realpath $(dirname $0))

mkdir -p build

cd build

# Prebuilt binary install since source compile requires lisp to be installed already
curl -L "http://prdownloads.sourceforge.net/sbcl/sbcl-2.1.2-x86-64-linux-binary.tar.bz2" -o sbcl.tar.bz2
tar xf sbcl.tar.bz2 --strip-components=1
rm sbcl.tar.bz2

INSTALL_ROOT=$PREFIX sh install.sh

cd ../

rm -rf build
