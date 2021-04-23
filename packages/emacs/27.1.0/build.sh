#!/bin/bash

export PATH=$PWD/bin:$PATH

PREFIX=$(realpath $(dirname $0))

mkdir -p build

cd build

# Emacs version 27.1 supports Docker builds
# Otherwise, older versions will work too, but you will have to disable `/proc/sys/kernel/randomize_va_space` which is less secure
curl -L "http://ftpmirror.gnu.org/emacs/emacs-27.1.tar.gz" -o emacs.tar.gz
tar xzf emacs.tar.gz --strip-components=1
rm emacs.tar.gz

# Building without all that X11 stuff
./configure --prefix="$PREFIX" --with-x=no --with-x-toolkit=no --with-xpm=no --with-jpeg=no --with-png=no --with-gif=no --with-tiff=no --with-gnutls=no
make -j$(nproc)
make install -j$(nproc)

cd ..

rm -rf build
