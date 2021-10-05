#!/usr/bin/env bash
echo "Starting Piston API"

echo "Checking presense of nix store"
if [[ ! -f "/nix/piston_detected" ]]; then
    echo "Nix Store is not loaded, assuming /nix has been mounted - copying contents"
    cp -r /var/nix /nix
fi

echo "Launching Piston API"
node src
