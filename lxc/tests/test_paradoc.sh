#!/usr/bin/env bash
# add paradoc module to python python
export PYTHONPATH=$PYTHONPATH:/opt/paradoc
# file for test code
test_code=/tmp/paradoc.test
# save test code to file
echo -n iP>$test_code
# pass param to paradoc module and have it print it
echo good | python3.8 -m paradoc $test_code 
# clean test code
rm -f $test_code
