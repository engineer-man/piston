#!/bin/bash
VERSION="18.15.0"
ARCH=$(uname -m)
if [ "$ARCH" = "x86_64" ]; then ARCH="x64"; elif [ "$ARCH" = "aarch64" ]; then ARCH="arm64"; fi
curl "https://nodejs.org/dist/v$VERSION/node-v$VERSION-linux-$ARCH.tar.xz" -o node.tar.xz
tar xf node.tar.xz --strip-components=1
rm node.tar.xz