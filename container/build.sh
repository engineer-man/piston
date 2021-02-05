#!/bin/bash

python3 -m pip install pyyaml
python3 configure.py
distrobuilder build-lxc build.yaml

