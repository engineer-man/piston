#!/usr/bin/env bash

# Scala depends on Java
mkdir -p java
cd java
curl "https://download.java.net/java/GA/jdk15.0.2/0d1cfde4252546c6931946de8db48ee2/7/GPL/openjdk-15.0.2_linux-x64_bin.tar.gz" -o java.tar.gz
tar xzf java.tar.gz --strip-components=1
rm java.tar.gz
cd ..

mkdir -p scala
cd scala
curl -L "https://github.com/lampepfl/dotty/releases/download/3.0.0-RC1/scala3-3.0.0-RC1.tar.gz" -o scala.tar.gz
tar -xzf scala.tar.gz --strip-components=1
rm scala.tar.gz
cd ..
