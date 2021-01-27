#!/usr/bin/env bash

# install python2
# final binary: /opt/python2/Python-2.7.17/python
# get version: /opt/python2/Python-2.7.17/python -V
cd /opt && mkdir python2 && cd python2
wget https://www.python.org/ftp/python/2.7.17/Python-2.7.17.tar.xz
unxz Python-2.7.17.tar.xz
tar -xf Python-2.7.17.tar
cd Python-2.7.17
./configure
# open Modules/Setup and uncomment zlib line
make -j$MAKE_THREADS
echo 'export PATH=$PATH:/opt/python2/Python-2.7.17' >> /opt/.profile
source /opt/.profile