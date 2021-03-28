#!/usr/bin/env bash

PREFIX=$(realpath $(dirname $0))

# get sources
curl -OL "https://github.com/ponylang/ponyc/archive/refs/tags/0.39.0.tar.gz"
tar xfz 0.39.0.tar.gz
rm 0.39.0.tar.gz

# cd into pony dir that was created from tar extraction.
cd ponyc-0.39.0

# Build the vendored LLVM libraries that are included in the `lib/llvm/src`.
make libs build_flags="-j$(nproc)"
# Configure the CMake build directory.
make configure
# Will build pony and put it in `build/release`.
make build
# Install pony into `$PREFIX`.
make prefix="$PREFIX" install
