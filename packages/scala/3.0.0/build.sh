#!/usr/bin/env bash

# Download and extract JDK8
curl -L "https://github.com/AdoptOpenJDK/openjdk8-binaries/releases/download/jdk8u292-b10/OpenJDK8U-jdk_x64_linux_hotspot_8u292b10.tar.gz" -o jdk.tar.gz
tar xzf jdk.tar.gz --strip-components=1
rm jdk.tar.gz

# Download and extract Scala 3
curl -L "https://github.com/lampepfl/dotty/releases/download/3.0.0/scala3-3.0.0.tar.gz" -o scala.tar.gz
tar -xzf scala.tar.gz --strip-components=1
rm scala.tar.gz
