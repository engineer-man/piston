#!/usr/bin/env bash

# install php
# final binary: /usr/local/bin/php
# get version: /usr/local/bin/php -v
cd /opt && mkdir php && cd php
wget https://www.php.net/distributions/php-8.0.0.tar.gz
tar -xzf php-8.0.0.tar.gz
cd php-8.0.0
./configure
make -j$MAKE_THREADS
make install