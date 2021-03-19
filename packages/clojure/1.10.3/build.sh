#!/usr/bin/env bash

# Installation location
PREFIX=$(realpath $(dirname $0))

# Clojure depends on Java (build and runtime)
mkdir -p java
cd java
curl "https://download.java.net/java/GA/jdk15.0.2/0d1cfde4252546c6931946de8db48ee2/7/GPL/openjdk-15.0.2_linux-x64_bin.tar.gz" -o java.tar.gz
tar xzf java.tar.gz --strip-components=1
rm java.tar.gz
cd ..

# Clojure depends on Maven (build)
mkdir -p maven
cd maven
curl "https://apache.claz.org/maven/maven-3/3.6.3/binaries/apache-maven-3.6.3-bin.tar.gz" -o maven.tar.gz
tar xzf maven.tar.gz --strip-components=1
rm maven.tar.gz
cd ..

# Adding java and maven to the path for building
export PATH=$PWD/java/bin:$PWD/maven/bin:$PATH
export JAVA_HOME=$PWD/java

# Clojure download
mkdir -p build
cd build
git clone -q "https://github.com/clojure/clojure.git" .
git checkout -b clojure-1.10.3 aaf73b12467df80f5db3e086550a33fee0e1b39e # commit for 1.10.3 release

# Build using maven
mvn -Plocal -Dmaven.test.skip=true package

# Get ridda that m2 bloat from Maven and remove Maven itself
cd ../
rm -rf ~/.m2
rm -rf maven/

# Move the jar for easier reference and cleanup
mkdir -p bin
mv build/clojure.jar bin
rm -rf build
