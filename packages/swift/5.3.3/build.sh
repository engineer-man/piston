#!/usr/bin/env bash

# Binary install
curl -L "https://swift.org/builds/swift-5.3.3-release/ubuntu1804/swift-5.3.3-RELEASE/swift-5.3.3-RELEASE-ubuntu18.04.tar.gz" -o swift.tar.gz
tar xzf swift.tar.gz --strip-components=2
rm swift.tar.gz
