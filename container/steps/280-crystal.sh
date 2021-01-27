#!/usr/bin/env bash

# install crystal
# final binary: /opt/crystal/crystal-0.35.1-1/bin/crystal
# get version: /opt/crystal/crystal-0.35.1-1/bin/crystal -v
cd /opt && mkdir crystal && cd crystal
wget https://github.com/crystal-lang/crystal/releases/download/0.35.1/crystal-0.35.1-1-linux-x86_64.tar.gz
tar -xzf crystal-0.35.1-1-linux-x86_64.tar.gz
echo 'export PATH="$PATH:/opt/crystal/crystal-0.35.1-1/bin:$PATH"' >> /opt/.profile
