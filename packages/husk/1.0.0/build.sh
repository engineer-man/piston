#!/usr/bin/env bash

cp ../../haskell/9.0.1/build.sh ./haskell-build.sh
sed -Ei 's/9\.0\.1/8\.10\.7/g' ./haskell-build.sh
source ./haskell-build.sh

# compile Husk from source
git clone -q "https://github.com/barbuz/husk.git"
cd husk
../bin/ghc -O2 Husk

# cleanup
cd ..
rm -f haskell-build.sh