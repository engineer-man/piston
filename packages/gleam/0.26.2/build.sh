#!/usr/bin/env bash

# Install Erlang
apt-get update
apt-get install wget -y
wget https://packages.erlang-solutions.com/erlang-solutions_2.0_all.deb
dpkg -i erlang-solutions_2.0_all.deb
apt-get install esl-erlang

# Install Gleam
curl -L "https://github.com/gleam-lang/gleam/releases/download/v0.26.2/gleam-v0.26.2-x86_64-unknown-linux-musl.tar.gz" --output gleam.tar.gz
mkdir gleam
tar -xf gleam.tar.gz -C gleam
