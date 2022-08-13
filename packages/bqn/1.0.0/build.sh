#!/usr/bin/env bash

set -e

git clone "https://github.com/dzaima/CBQN" bqn
cd bqn

git checkout 88f65850fa6ac28bc50886c5942652f21d5be924
make CC=gcc
