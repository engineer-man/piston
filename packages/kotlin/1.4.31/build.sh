#!/usr/bin/env bash

source ../../java/15.0.2/build.sh

curl -L "https://github.com/JetBrains/kotlin/releases/download/v1.4.31/kotlin-compiler-1.4.31.zip" -o kotlin.zip
unzip kotlin.zip
rm kotlin.zip

cp -r kotlinc/* .
rm -rf kotlinc