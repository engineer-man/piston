#!/usr/bin/env bash

PREFIX=$(realpath $(dirname $0))

# get sources - only get the latest copy of the relevant files
git clone -q https://github.com/ponylang/ponyc.git ponyc

cd ponyc

# release commit for 0.54.1
git reset --hard 297efcef9f3b7b17b7b2ed11c3ed7365498d6637

# updates all submodules recursively along their tracking branches
# i.e. https://github.com/ponylang/ponyc/blob/main/.gitmodules
git submodule update --recursive --init

# Build the vendored LLVM libraries that are included in the `lib/llvm/src`.
make libs build_flags="-j$(nproc)"
# Configure the CMake build directory.
make configure
# Will build pony and put it in `build/release`.
make build
# Install pony into `$PREFIX`.
make prefix="$PREFIX" install

cd ..
rm -rf ponyc