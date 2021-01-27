#!/usr/bin/env bash

# install swift
# final binary: /opt/swift/swift-5.1.5-RELEASE-ubuntu18.04/usr/bin/swift
# get version: /opt/swift/swift-5.1.5-RELEASE-ubuntu18.04/usr/bin/swift --version
cd /opt && mkdir swift && cd swift
wget https://swift.org/builds/swift-5.1.5-release/ubuntu1804/swift-5.1.5-RELEASE/swift-5.1.5-RELEASE-ubuntu18.04.tar.gz
tar -xzf swift-5.1.5-RELEASE-ubuntu18.04.tar.gz
echo 'export PATH=$PATH:/opt/swift/swift-5.1.5-RELEASE-ubuntu18.04/usr/bin' >> /opt/.profile
