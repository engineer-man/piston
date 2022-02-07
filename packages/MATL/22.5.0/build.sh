#!/usr/bin/env bash

# build octave as dependency
source ../../octave/6.2.0/build.sh

# curl MATL 22.5.0
curl -L "https://github.com/lmendo/MATL/archive/refs/tags/22.5.0.tar.gz" -o MATL.tar.xz
tar xf MATL.tar.xz --strip-components=1
rm MATL.tar.xz