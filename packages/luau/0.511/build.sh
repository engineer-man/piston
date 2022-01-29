#!/usr/bin/env bash

# Put instructions to build your package in here
curl -R -O -L "https://github.com/Roblox/luau/archive/refs/tags/0.511.tar.gz"
tar zxf 0.511.tar.gz
rm 0.511.tar.gz

cd luau-0.511
make config=release luau
cd ..

