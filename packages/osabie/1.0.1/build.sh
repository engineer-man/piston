#!/bin/bash

source ../../elixir/1.11.3/build.sh

export PATH=$PWD/bin:$PATH

PREFIX=$(realpath $(dirname $0))

mkdir -p build

cd build

git clone 'https://github.com/Adriandmen/05AB1E.git' .
mix local.hex --force
mix local.rebar --force
mix deps.get --force
MIX_ENV=prod mix escript.build --force

cd ..

cp -r build/* bin

rm -rf build
