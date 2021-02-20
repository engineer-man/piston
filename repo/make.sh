#!/bin/bash
cd /repo
cat password.key | gpg --batch --import private.key
pushd ../packages/python
cat password.key | make sign VERSIONS=3.9.1 && make cleanup
popd
./mkindex.sh