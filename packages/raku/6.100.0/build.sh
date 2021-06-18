#!/usr/bin/env bash

curl -L "https://rakudo.org/dl/rakudo/rakudo-moar-2021.05-01-linux-x86_64-gcc.tar.gz" -o raku.tar.xz
tar xf raku.tar.xz --strip-components=1
rm raku.tar.xz