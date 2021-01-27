#!/usr/bin/env bash

# install elixir and erlang
# final binary: /opt/elixir/bin/elixir
# get version: /opt/elixir/bin/elixir --version
# erlang
cd /opt && mkdir erlang && cd erlang
wget http://erlang.org/download/otp_src_23.0.tar.gz
gunzip -c otp_src_23.0.tar.gz | tar xf -
cd otp_src_23.0 && ./configure
make -j$MAKE_THREADS
echo 'export PATH=$PATH:/opt/erlang/otp_src_23.0/bin' >> /opt/.profile
source /opt/.profile
# elixir
cd /opt && mkdir elixir && cd elixir
wget https://github.com/elixir-lang/elixir/releases/download/v1.10.3/Precompiled.zip
mkdir elixir-1.10.3 && unzip Precompiled.zip -d elixir-1.10.3/
echo 'export PATH=$PATH:/opt/elixir/elixir-1.10.3/bin' >> /opt/.profile

