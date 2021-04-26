#!/bin/bash

# Groovy depends on JDK8+
mkdir -p java
cd java
curl "https://download.java.net/java/GA/jdk15.0.2/0d1cfde4252546c6931946de8db48ee2/7/GPL/openjdk-15.0.2_linux-x64_bin.tar.gz" -o java.tar.gz
tar xzf java.tar.gz --strip-components=1
rm java.tar.gz
cd ..

# Download Groovy binaries
curl -L "https://groovy.jfrog.io/artifactory/dist-release-local/groovy-zips/apache-groovy-binary-3.0.7.zip" -o groovy.zip
unzip -q groovy.zip
rm groovy.zip
