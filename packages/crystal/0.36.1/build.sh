#!/bin/bash

PREFIX=$(realpath $(dirname $0))

curl -L "https://github.com/crystal-lang/crystal/releases/download/0.36.1/crystal-0.36.1-1-linux-x86_64.tar.gz" -o crystal.tar.gz
tar xzf crystal.tar.gz --strip-components=1
rm crystal.tar.gz
