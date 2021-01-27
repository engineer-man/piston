# LXC Container Build

Requires: `lxc`, `lxc-net`, `packer` (Hashicorp Packer)

To build: `packer build -var 'apt_mirror=[apt mirror]' -var 'make_threads=[-j flag]' piston.pkr.hcl`

After roughly 30 minutes (on an i7-4790k), you should have an image built