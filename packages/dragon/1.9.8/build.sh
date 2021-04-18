#!/usr/bin/env bash

# Dragon install
mkdir -p build

cd build

curl "https://dragon-lang.org/Dragon_1.9.8_linux(x86_x64).tar.bz2" -o dragon.tar.bz2
tar xjf dragon.tar.bz2 --strip-components=1

### re-purposed the install script for local install

mkdir -p ../bin
cp dragon ../bin/
chmod +x ../bin/dragon

cp -r runtime ../bin/
chmod +x ../bin/runtime/bin/java

mkdir -p ../usr/share/man/man8
cp ./man/dragon ../usr/share/man/man8/dragon.8
gzip ../usr/share/man/man8/dragon.8

sed -i 's|/bin/runtime/bin/java|$JAVA_RUNTIME|g' ../bin/dragon

###

cd ../
rm -rf build
