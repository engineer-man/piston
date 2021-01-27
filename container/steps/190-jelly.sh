#!/usr/bin/env bash

# install jelly
cd /opt && mkdir jelly && cd jelly
wget https://github.com/DennisMitchell/jellylanguage/archive/master.zip
unzip master.zip
cd jellylanguage-master
python3.8 -m pip install .
sed -i 's/\/usr\/local\/bin\/python3.8/\/opt\/python3\/Python-3.8.2\/python3.8/' /usr/local/bin/jelly
