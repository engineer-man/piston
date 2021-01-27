#!/usr/bin/env bash

# install rust
# final binary: /usr/local/bin/rustc
# get version: /usr/local/bin/rustc --version
cd /opt && mkdir rust && cd rust
wget https://static.rust-lang.org/dist/rust-1.49.0-x86_64-unknown-linux-gnu.tar.gz
tar -xzf rust-1.49.0-x86_64-unknown-linux-gnu.tar.gz
cd rust-1.49.0-x86_64-unknown-linux-gnu
./install.sh