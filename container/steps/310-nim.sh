#!/usr/bin/env bash

# install nim
# final binary: /opt/nim/bin/nim
# get version: /opt/nim/bin/nim -v
cd /opt && mkdir nim && cd nim
wget https://nim-lang.org/download/nim-1.4.0-linux_x64.tar.xz
unxz nim-1.4.0-linux_x64.tar.xz
tar -xf nim-1.4.0-linux_x64.tar
cd nim-1.4.0
./install.sh /opt
echo 'export PATH=$PATH:/opt/nim/bin' >> /opt/.profile