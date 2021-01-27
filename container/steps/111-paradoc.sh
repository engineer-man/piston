#!/usr/bin/env bash

# install paradoc
# this is not a binary, it is a python module
# therefore it cannot be run directly as it requires python3 to be installed
cd /opt && mkdir paradoc && cd paradoc
git clone https://github.com/betaveros/paradoc.git