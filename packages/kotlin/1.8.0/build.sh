#!/usr/bin/env bash

# Download and extract JDK11
curl -L "https://github.com/adoptium/temurin11-binaries/releases/download/jdk-11.0.17%2B8/OpenJDK11U-jdk_x64_linux_hotspot_11.0.17_8.tar.gz" -o jdk.tar.gz
tar xzf jdk.tar.gz --strip-components=1
rm jdk.tar.gz

# Download and extract Kotlin
curl -L "https://github.com/JetBrains/kotlin/releases/download/v1.8.0/kotlin-compiler-1.8.0.zip" -o kotlin.zip
unzip kotlin.zip
rm kotlin.zip
cp -r kotlinc/* .
rm -rf kotlinc
