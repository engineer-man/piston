#!/usr/bin/env bash
echo "Starting Piston API"

echo "Checking presense of nix store"
if [[ ! -f "/nix/piston_detected" ]]; then
    echo "Nix Store is not loaded, assuming /nix has been mounted - copying contents"
    cp -rp /var/nix/* /nix
fi

echo "Adding nix to env"
. ~/.profile

echo "Launching Piston API"
node src