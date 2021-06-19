#!/bin/bash
curl "https://nodejs.org/dist/v16.3.0/node-v16.3.0-linux-x64.tar.xz" -o node.tar.xz
tar xf node.tar.xz --strip-components=1
rm node.tar.xz
