#!/usr/bin/env bash

set -e

git clone "https://codeberg.org/ngn/k" k
cd k

git checkout 544d014afd8dd84b18c2011cabd3aa3d76571ca3
make CC=gcc
