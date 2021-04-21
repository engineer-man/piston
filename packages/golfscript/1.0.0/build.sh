#!/usr/bin/env bash

# golfscript was implemented as a Ruby script originally
source ../../ruby/2.5.1/build.sh

curl "http://www.golfscript.com/golfscript/golfscript.rb" -o bin/golfscript.rb

# using the shebang to run it with the right Ruby
sed -i "s|/usr/bin/|$PWD/bin/|g" bin/golfscript.rb
chmod +x bin/golfscript.rb
