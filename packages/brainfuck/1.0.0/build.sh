#!/usr/bin/env bash

curl -L "http://mazonka.com/brainf/bff4.c" -o bff4.c
gcc -O3 bff4.c -O bff4
rm bff4.c



