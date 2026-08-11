#!/usr/bin/env bash

VERSION=1.82.0

curl -OL "https://static.rust-lang.org/dist/rust-${VERSION}-x86_64-unknown-linux-gnu.tar.gz"
tar xzvf "rust-${VERSION}-x86_64-unknown-linux-gnu.tar.gz"
rm "rust-${VERSION}-x86_64-unknown-linux-gnu.tar.gz"
