#!/usr/bin/env bash
curl -L "https://github.com/llvm/llvm-project/releases/download/llvmorg-12.0.1/clang+llvm-12.0.1-x86_64-linux-gnu-ubuntu-16.04.tar.xz" -o llvm-ir.tar.xz

tar xf llvm-ir.tar.xz clang+llvm-12.0.1-x86_64-linux-gnu-ubuntu-/bin --strip-components=1

rm llvm-ir.tar.xz
