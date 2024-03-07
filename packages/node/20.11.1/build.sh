#!/bin/bash
curl "https://nodejs.org/dist/v20.11.1/node-v20.11.1-linux-x64.tar.xz" -o node.tar.xz
tar xf node.tar.xz --strip-components=1
rm node.tar.xz