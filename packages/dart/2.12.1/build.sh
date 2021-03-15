#!/usr/bin/env bash

curl -L "https://storage.googleapis.com/dart-archive/channels/stable/release/2.12.1/sdk/dartsdk-linux-x64-release.zip" -o dart.zip

unzip dart.zip
rm dart.zip

cp -r dart-sdk/* .
rm -rf dart-sdk

chmod -R +rx bin
