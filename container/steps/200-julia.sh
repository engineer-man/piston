#!/usr/bin/env bash

# install julia
# final binary: /opt/julia/julia-1.5.0/bin/julia
# get version: /opt/julia/julia-1.5.0/bin/julia --version
cd /opt && mkdir julia && cd julia
wget https://julialang-s3.julialang.org/bin/linux/x64/1.5/julia-1.5.0-linux-x86_64.tar.gz
tar -xzf julia-1.5.0-linux-x86_64.tar.gz
echo 'export PATH=$PATH:/opt/julia/julia-1.5.0/bin' >> /opt/.profile
