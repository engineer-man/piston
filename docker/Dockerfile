FROM ubuntu:18.04

RUN sed -i 's/http:\/\/archive.ubuntu.com\/ubuntu\//http:\/\/mirror.math.princeton.edu\/pub\/ubuntu\//' /etc/apt/sources.list
RUN apt-get update
RUN echo "tzdata tzdata/Areas select America" > /tmp/tzseed.txt; \
    echo "tzdata tzdata/Zones/America select Chicago" >> /tmp/tzseed.txt; \
    debconf-set-selections /tmp/tzseed.txt && \
    apt-get install -y tzdata && \
    rm /tmp/tzseed.txt
RUN apt-get -y install nano dpkg-dev
RUN apt-get -y install build-essential
RUN apt-get -y install python
RUN apt-get -y install python3
RUN apt-get -y install ruby
RUN apt-get -y install nodejs
RUN apt-get -y install golang
RUN apt-get -y install php7.2
RUN apt-get -y install r-base
RUN apt-get -y install mono-complete

RUN useradd -m runner

RUN echo 'runner soft nproc 16' >> /etc/security/limits.conf
RUN echo 'runner hard nproc 16' >> /etc/security/limits.conf
RUN echo 'runner soft nofile 128' >> /etc/security/limits.conf
RUN echo 'runner hard nofile 128' >> /etc/security/limits.conf

WORKDIR /tmp
