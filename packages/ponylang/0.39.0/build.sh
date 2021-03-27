#!/usr/bin/env bash

PREFIX=$(realpath $(dirname $0))

# get sources
curl -OL "https://github.com/ponylang/ponyc/archive/refs/tags/0.39.0.tar.gz"
tar xfz 0.39.0.tar.gz

# Build the vendored LLVM libraries that are included in the `lib/llvm/src`.
make libs -j$(nproc)
# Configure the CMake build directory.
make configure
# Will build ponyc and put it in `build/release`.
make build
# Install ponyc into `$PREFIX`.
make prefix="$PREFIX" install -j$(nproc)
