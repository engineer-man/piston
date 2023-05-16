#!/usr/bin/env bash

# Put instructions to build your package in here

curl "https://download.java.net/java/early_access/valhalla/20/openjdk-20-valhalla+20-75_linux-x64_bin.tar.gz" -o java.tar.gz

tar xzf java.tar.gz --strip-components=1
rm java.tar.gz

