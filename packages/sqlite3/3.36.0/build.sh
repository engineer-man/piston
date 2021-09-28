#!/bin/bash
PREFIX=$(realpath $(dirname $0))

curl https://www.sqlite.org/2021/sqlite-amalgamation-3360000.zip -o sqlite.zip
unzip -q sqlite.zip
rm -rf sqlite.zip

gcc -DSQLITE_THREADSAFE=0 -DSQLITE_OMIT_LOAD_EXTENSION sqlite-amalgamation-3360000/shell.c sqlite-amalgamation-3360000/sqlite3.c -o sqlite3

rm -rf sqlite-amalgamation-3360000
