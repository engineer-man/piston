#!/usr/bin/env bash

# Install Erlang
source ../../erlang/23.0.0/build.sh

# Install Gleam
curl -L "https://github.com/gleam-lang/gleam/releases/download/v0.26.2/gleam-v0.26.2-x86_64-unknown-linux-musl.tar.gz" --output gleam.tar.gz
mkdir gleam
tar -xf gleam.tar.gz -C gleam
