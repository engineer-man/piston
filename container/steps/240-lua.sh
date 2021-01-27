#!/usr/bin/env bash

# install lua
# final binary: /opt/lua/lua54/src/lua
# get version: /opt/lua/lua54/src/lua -v
cd /opt && mkdir lua && cd lua
wget https://sourceforge.net/projects/luabinaries/files/5.4.0/Docs%20and%20Sources/lua-5.4.0_Sources.tar.gz/download
tar -xzf download
cd lua54
make -j$MAKE_THREADS
echo 'export PATH=$PATH:/opt/lua/lua54/src' >> /opt/.profile