#!/usr/bin/env bash

# install kotlin
# final binary: /opt/kotlinc/bin/kotlinc
# get version: /opt/kotlinc/bin/kotlinc -version
cd /opt
wget https://github.com/JetBrains/kotlin/releases/download/v1.4.10/kotlin-compiler-1.4.10.zip
unzip kotlin-compiler-1.4.10.zip
rm kotlin-compiler-1.4.10.zip
echo 'export PATH=$PATH:/opt/kotlinc/bin' >> /opt/.profile