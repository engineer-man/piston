#!/usr/bin/env bash

# install java
# final binary: /opt/java/jdk-14/bin/java
# get version: /opt/java/jdk-14/bin/java -version
cd /opt && mkdir java && cd java
wget https://download.java.net/java/GA/jdk14/076bab302c7b4508975440c56f6cc26a/36/GPL/openjdk-14_linux-x64_bin.tar.gz
tar -xzf openjdk-14_linux-x64_bin.tar.gz
echo 'export PATH=$PATH:/opt/java/jdk-14/bin' >> /opt/.profile
