FROM ubuntu:18.04

WORKDIR /tmp

RUN useradd -m runner

RUN echo 'runner soft nproc 16' >> /etc/security/limits.conf
RUN echo 'runner hard nproc 16' >> /etc/security/limits.conf
RUN echo 'runner soft nofile 256' >> /etc/security/limits.conf
RUN echo 'runner hard nofile 256' >> /etc/security/limits.conf

RUN sed -i 's/http:\/\/archive.ubuntu.com\/ubuntu\//http:\/\/mirror.math.princeton.edu\/pub\/ubuntu\//' /etc/apt/sources.list
RUN apt-get update && \
    echo "tzdata tzdata/Areas select America" > /tmp/tzseed.txt; \
    echo "tzdata tzdata/Zones/America select Chicago" >> /tmp/tzseed.txt; \
    debconf-set-selections /tmp/tzseed.txt && \
    apt-get install -y tzdata && \
    rm /tmp/tzseed.txt && \
    apt-get -y install nano dpkg-dev build-essential python python3 ruby nodejs golang php7.2 r-base mono-complete nasm openjdk-8-jdk
