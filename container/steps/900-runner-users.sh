#!/usr/bin/env bash

# create runnable users and apply limits
for i in {1..150}; do
    useradd -M runner$i
    usermod -d /tmp runner$i
    echo "runner$i soft nproc 64" >> /etc/security/limits.conf
    echo "runner$i hard nproc 64" >> /etc/security/limits.conf
    echo "runner$i soft nofile 2048" >> /etc/security/limits.conf
    echo "runner$i hard nofile 2048" >> /etc/security/limits.conf
done