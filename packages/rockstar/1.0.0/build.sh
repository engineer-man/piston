#!/bin/bash

# Using the Rocky implementation of the Rockstar spec

# Download Java
source ../../java/15.0.2/build.sh

# Download Rocky and the wrapper
curl -LO "https://github.com/gaborsch/rocky/raw/master/rocky.jar"
curl -LO "https://github.com/gaborsch/rocky/raw/master/rockstar"
chmod +x rockstar
