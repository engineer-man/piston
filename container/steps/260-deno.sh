#!/usr/bin/env bash

# install deno
# final binary: /opt/.deno/bin/deno
# get version: /opt/.deno/bin/deno --version
cd /opt && mkdir deno && cd deno
curl -fsSL https://deno.land/x/install/install.sh | sh
echo 'export DENO_INSTALL="/opt/.deno"' >> /opt/.profile
echo 'export PATH="$DENO_INSTALL/bin:$PATH"' >> /opt/.profile
