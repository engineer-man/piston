#!/usr/bin/env bash

# Using the precompiled binary packages from https://github.com/annexi-strayline/gnat-packs
compname="gnat-10.3.0-base.tar.xz"
curl -L "https://gnat-packs.annexi-strayline.com/x86_64-linux-gnu/gnat-10.3.0-base.tar.xz" -o $compname

xz -cd $compname | sudo tar xP

#curl -L "https://storage.googleapis.com/dart-archive/channels/stable/release/2.12.1/sdk/dartsdk-linux-x64-release.zip" -o dart.zip
#
#unzip dart.zip
#rm dart.zip
#
#cp -r dart-sdk/* .
#rm -rf dart-sdk
#
#chmod -R +rx bin


