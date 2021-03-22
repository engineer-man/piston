#!/bin/bash

# Download and install NodeJS
curl "https://nodejs.org/dist/v15.10.0/node-v15.10.0-linux-x64.tar.xz" -o node.tar.xz
tar xf node.tar.xz --strip-components=1
rm node.tar.xz
export PATH=$PWD/bin:$PATH

# Pull Rockstar reference implementation project
git clone -q "https://github.com/RockstarLang/rockstar.git" rockstar
cd rockstar
git reset --hard bc9eedc6acb7c0f31a425cc204dcd93cb3e68936

# Install Satriani dependencies
cd satriani
npm install
cd ../..

# Suppress "(program returned no output)" output at the end of each program
sed -i 's/console.log(result ? result : "(program returned no output)");/if (result) console.log(result);/g' rockstar/satriani/rockstar.js
