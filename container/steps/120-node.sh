#!/usr/bin/env bash

# install node.js
# final binary: /opt/nodejs/node-v12.16.1-linux-x64/bin/node
# get version: /opt/nodejs/node-v12.16.1-linux-x64/bin/node -v
cd /opt && mkdir nodejs && cd nodejs
wget https://nodejs.org/dist/v12.16.1/node-v12.16.1-linux-x64.tar.xz
unxz node-v12.16.1-linux-x64.tar.xz
tar -xf node-v12.16.1-linux-x64.tar
echo 'export PATH=$PATH:/opt/nodejs/node-v12.16.1-linux-x64/bin' >> /opt/.profile

cat /opt/.profile