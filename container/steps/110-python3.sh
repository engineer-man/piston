#!/usr/bin/env bash

# install python3
# final binary: /opt/python3/Python-3.8.2/python
# get version: /opt/python3/Python-3.8.2/python -V
cd /opt && mkdir python3 && cd python3
wget https://www.python.org/ftp/python/3.8.2/Python-3.8.2.tar.xz
unxz Python-3.8.2.tar.xz
tar -xf Python-3.8.2.tar
cd Python-3.8.2
./configure
make -j$MAKE_THREADS
ln -s python python3.8
echo 'export PATH=$PATH:/opt/python3/Python-3.8.2' >> /opt/.profile
source /opt/.profile
curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
python3.8 get-pip.py
