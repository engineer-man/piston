#!/usr/bin/env bash

while ! ping -c 1 -W 1 1.1.1.1; do
    echo "Waiting for 1.1.1.1 - network is down"
    sleep 1
done
