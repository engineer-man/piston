#!/usr/bin/env bash

curl "https://download.visualstudio.microsoft.com/download/pr/022d9abf-35f0-4fd5-8d1c-86056df76e89/477f1ebb70f314054129a9f51e9ec8ec/dotnet-sdk-2.2.207-linux-x64.tar.gz" -Lo dotnet.tar.gz
tar xzf dotnet.tar.gz --strip-components=1
rm dotnet.tar.gz

# Cache nuget packages
export DOTNET_CLI_HOME=$PWD
./dotnet new console -o cache_application

# This calls a restore on the global-packages index ($DOTNET_CLI_HOME/.nuget/packages)
# If we want to allow more packages, we could add them to this cache_application

rm -rf cache_application

# Get rid of it, we don't actually need the application - just the restore