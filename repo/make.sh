#!/bin/bash -e

cd /repo

# Make packages
pushd ../packages/
make -j16
popd


# Make repo index

./mkindex.sh