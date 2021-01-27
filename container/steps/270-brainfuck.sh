#!/usr/bin/env bash

# install brainfuck
cd /opt && mkdir bf && cd bf
git clone https://github.com/texus/Brainfuck-interpreter
cd Brainfuck-interpreter
echo 'export PATH=$PATH:/opt/bf/Brainfuck-interpreter' >> /opt/.profile
source /opt/.profile
