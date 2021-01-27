#!/usr/bin/env bash

# install golang
# final binary: /opt/go/go/bin/go
# get version: /opt/go/go/bin/go version
cd /opt && mkdir go && cd go
wget https://dl.google.com/go/go1.14.1.linux-amd64.tar.gz
tar -xzf go1.14.1.linux-amd64.tar.gz
echo 'export PATH=$PATH:/opt/go/go/bin' >> /opt/.profile
echo 'export GOROOT=/opt/go/go' >> /opt/.profile
echo 'export GOCACHE=/tmp' >> /opt/.profile
