#!/bin/bash -e

cd /repo

# Make packages
pushd ../packages/python
make build VERSIONS=3.9.1
popd


# Make repo index

./mkindex.sh