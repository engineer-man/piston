#!/usr/bin/env bash

packer build piston.pkr.hcl
cd output-piston-bionic && mkdir -p /var/lib/lxc/piston && cd /var/lib/lxc/piston && cp "$OLDPWD/lxc-config" config && tar -xzf "$OLDPWD/rootfs.tar.gz"