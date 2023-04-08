#!/usr/bin/env bash

# Download and extract JDK8
curl -L "https://github.com/AdoptOpenJDK/openjdk16-binaries/releases/download/jdk-16.0.1%2B9_openj9-0.26.0/OpenJDK16U-jdk_x64_linux_openj9_16.0.1_9_openj9-0.26.0.tar.gz" -o jdk.tar.gz
tar xzf jdk.tar.gz --strip-components=1
rm jdk.tar.gz

# Download and extract Scala 3
curl -L "https://github.com/lampepfl/dotty/releases/download/3.2.2/scala3-3.2.2.tar.gz" -o scala.tar.gz
tar -xzf scala.tar.gz --strip-components=1
rm scala.tar.gz