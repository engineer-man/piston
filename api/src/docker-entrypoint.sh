#!/bin/bash

cd /sys/fs/cgroup && \
mkdir isolate/ && \
echo 1 > isolate/cgroup.procs && \
echo '+cpuset +cpu +io +memory +pids' > cgroup.subtree_control && \
cd isolate && \
mkdir init && \
echo 1 > init/cgroup.procs && \
echo '+cpuset +memory' > cgroup.subtree_control && \
echo "Initialized cgroup" && \
chown -R piston:piston /piston && \
exec su -- piston -c 'ulimit -n 65536 && node /piston_api/src'
