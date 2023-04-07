#!/usr/bin/env bash

# Binary install
curl -L "https://swift.org/builds/swift-5.8-release/ubuntu2204/swift-5.8-RELEASE/swift-5.8-RELEASE-ubuntu22.04.tar.gz" -o swift.tar.gz
tar xzf swift.tar.gz --strip-components=2
rm swift.tar.gz