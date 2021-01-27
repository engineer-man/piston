#!/usr/bin/env bash

# install d
# final binary: /opt/d/dmd2/linux/bin64/dmd
# get version: /opt/d/dmd2/linux/bin64/dmd --version
cd /opt && mkdir d && cd d
wget http://downloads.dlang.org/releases/2.x/2.095.0/dmd.2.095.0.linux.tar.xz
unxz dmd.2.095.0.linux.tar.xz
tar -xf dmd.2.095.0.linux.tar
echo 'export PATH=$PATH:/opt/d/dmd2/linux/bin64' >> /opt/.profile
source /opt/.profile
