#!/usr/bin/env bash

curl -L "https://sourceforge.net/projects/fbc/files/FreeBASIC-1.08.0/Binaries-Linux/FreeBASIC-1.08.0-linux-x86_64.tar.gz/download" -o freebasic.tar.gz
tar xf freebasic.tar.gz --strip-components=1
rm freebasic.tar.gz
