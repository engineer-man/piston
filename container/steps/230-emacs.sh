#!/usr/bin/env bash

# install emacs
# final binary: /opt/emacs/emacs-26.3/src/emacs
# get version: /opt/emacs/emacs-26.3/src/emacs --version
cd /opt && mkdir emacs && cd emacs
wget https://mirrors.ocf.berkeley.edu/gnu/emacs/emacs-26.3.tar.xz
tar -xf emacs-26.3.tar.xz
rm emacs-26.3.tar.xz
cd emacs-26.3
./configure --with-gnutls=no
make
echo 'export PATH=$PATH:/opt/emacs/emacs-26.3/src' >> /opt/.profile