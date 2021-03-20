#!/usr/bin/env bash

curl "https://download.visualstudio.microsoft.com/download/pr/73a9cb2a-1acd-4d20-b864-d12797ca3d40/075dbe1dc3bba4aa85ca420167b861b6/dotnet-sdk-5.0.201-linux-x64.tar.gz" -Lo dotnet.tar.gz
tar xzf dotnet.tar.gz --strip-components=1
rm dotnet.tar.gz

