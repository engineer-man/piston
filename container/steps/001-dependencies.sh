#!/usr/bin/env bash

# install all necessary piston dependencies
echo 'source /opt/.profile' >> /opt/.bashrc
echo 'export HOME=/opt' >> /opt/.profile
echo 'export TERM=linux' >> /opt/.profile
echo 'export PATH=$PATH:/opt/.local/bin' >> /opt/.profile
export HOME=/opt
export TERM=linux
sed -i 's/\/root/\/opt/' /etc/passwd
sed -i \
    's~http://archive.ubuntu.com/ubuntu~'"$APT_MIRROR~" \
    /etc/apt/sources.list


apt-get update
apt-get install -y \
    nano wget build-essential pkg-config libxml2-dev \
    libsqlite3-dev mono-complete curl cmake libpython2.7-dev \
    ruby libtinfo-dev unzip git openssl libssl-dev sbcl libevent-dev libffi-dev