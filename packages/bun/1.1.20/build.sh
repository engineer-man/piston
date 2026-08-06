#!/bin/bash

curl -L "https://github.com/oven-sh/bun/releases/download/bun-v1.1.20/bun-linux-x64.zip" -o bun.zip
unzip bun.zip
rm bun.zip

cp -r bun-linux-x64/* .
rm -rf bun-linux-x64

chmod +x bun