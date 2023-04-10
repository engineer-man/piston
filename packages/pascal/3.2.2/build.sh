#!/bin/bash

PREFIX=$(realpath $(dirname $0))

mkdir -p build

cd build
curl -L "https://sourceforge.net/projects/freepascal/files/Linux/3.2.2/fpc-3.2.2.x86_64-linux.tar/download"  -o pascal.tar
tar xf pascal.tar --strip-components=1

# FreePascal uses an interactive installer
./install.sh << ANSWERS
$PREFIX
n
n
n
ANSWERS

cd ..
rm -rf build

# A sample config (needed for each "project") is written to /etc
# We'll copy that into the local lib dir (fpc searches there too on compile)
mkdir lib/fpc/etc
cp -r /etc/fp* lib/fpc/etc/