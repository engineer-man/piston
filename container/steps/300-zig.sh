#!/usr/bin/env bash

# install zig
# final binary: /opt/zig/zig
# get version: /opt/zig/zig version
cd /opt && mkdir zig && cd zig
wget https://ziglang.org/download/0.7.1/zig-linux-x86_64-0.7.1.tar.xz
tar -xf zig-linux-x86_64-0.7.1.tar.xz
mv zig-linux-x86_64-0.7.1 zig
rm zig-linux-x86_64-0.7.1.tar.xz
echo 'export PATH=$PATH:/opt/zig/zig' >> /opt/.profile
