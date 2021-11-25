#!/usr/bin/env bash

# source python 2.7
source ../../python/2.7.18/build.sh

# clone befunge repo
git clone -q 'https://github.com/programble/befungee' befunge93

# go inside befunge93 so we can checkout
cd befunge93

# checkout the version 0.2.0
git checkout tag/v0.2.0

cd ..