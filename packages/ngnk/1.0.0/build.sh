#!/usr/bin/env bash

set -e

git clone "https://codeberg.org/ngn/k" k
cd k

git checkout 040f73b56f379a8298cb1747075c9e947dfe0e42
make CC=gcc