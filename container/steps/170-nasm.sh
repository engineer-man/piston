#!/usr/bin/env bash

# install nasm
# final binary: /opt/nasm/nasm-2.14.02/nasm
# get version: /opt/nasm/nasm-2.14.02/nasm -v
cd /opt && mkdir nasm && cd nasm
wget https://www.nasm.us/pub/nasm/releasebuilds/2.14.02/nasm-2.14.02.tar.gz
tar -xzf nasm-2.14.02.tar.gz
cd nasm-2.14.02
./configure
make -j$MAKE_THREADS
echo 'export PATH=$PATH:/opt/nasm/nasm-2.14.02' >> /opt/.profile
