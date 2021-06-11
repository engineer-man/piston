#!/usr/bin/env bash

mkdir -p bin
cd bin/

curl -L "https://ziglang.org/download/0.8.0/zig-linux-x86_64-0.8.0.tar.xz" -o zig.tar.xz
tar xf zig.tar.xz --strip-components=1
rm zig.tar.xz

cd ../
