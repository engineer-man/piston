#!/usr/bin/env bash

# Put instructions to build your package in here

curl "https://download.java.net/java/early_access/jdk21/22/GPL/openjdk-21-ea+22_linux-x64_bin.tar.gz" -o java.tar.gz

tar xzf java.tar.gz --strip-components=1
rm java.tar.gz

