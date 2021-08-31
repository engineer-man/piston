#!/usr/bin/env bash

# Grab the latest cow source from github
git clone -q https://github.com/Hydrazer/COW.git cow

# Generate the cow binary into bin
mkdir -p bin
sed -i '1i#define NO_GREETINGS' cow/source/cow.cpp
g++ -o bin/cow cow/source/cow.cpp

# Cleanup
rm -rf cow
