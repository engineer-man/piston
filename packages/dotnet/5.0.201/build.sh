#!/usr/bin/env bash

curl "https://download.visualstudio.microsoft.com/download/pr/73a9cb2a-1acd-4d20-b864-d12797ca3d40/075dbe1dc3bba4aa85ca420167b861b6/dotnet-sdk-5.0.201-linux-x64.tar.gz" -Lo dotnet.tar.gz
tar xzf dotnet.tar.gz --strip-components=1
rm dotnet.tar.gz

# Cache nuget packages
export DOTNET_CLI_HOME=$PWD
./dotnet new console -o cache_application
./dotnet new console -lang F# -o fs_cache_application
./dotnet new console -lang VB -o vb_cache_application
# This calls a restore on the global-packages index ($DOTNET_CLI_HOME/.nuget/packages)
# If we want to allow more packages, we could add them to this cache_application

rm -rf cache_application fs_cache_application vb_cache_application
# Get rid of it, we don't actually need the application - just the restore
