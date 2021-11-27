#!/usr/bin/env bash

# get dotnet 2.2.8 as a dependency for retina
curl "https://download.visualstudio.microsoft.com/download/pr/022d9abf-35f0-4fd5-8d1c-86056df76e89/477f1ebb70f314054129a9f51e9ec8ec/dotnet-sdk-2.2.207-linux-x64.tar.gz" -Lo dotnet.tar.gz
tar xzf dotnet.tar.gz --strip-components=1
rm dotnet.tar.gz

export DOTNET_CLI_HOME=$PWD
./dotnet new console -o cache_application

rm -rf cache_application

# curl retina version 1.2.0
curl -L "https://github.com/m-ender/retina/releases/download/v1.2.0/retina-linux-x64.tar.gz" -o retina.tar.xz
tar xf retina.tar.xz --strip-components=1
rm retina.tar.xz

# move the libhostfxr.so file to the current directory so we don't have to set DOTNET_ROOT
mv host/fxr/2.2.8/libhostfxr.so libhostfxr.so

# give execute permissions to retina
chmod +x Retina