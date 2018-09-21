FROM ubuntu:18.04

RUN apt-get update
RUN apt-get -y install bash-completion
RUN apt-get -y install build-essential
RUN apt-get -y install python
RUN apt-get -y install python3
RUN apt-get -y install ruby
RUN apt-get -y install nodejs
RUN apt-get -y install golang

RUN useradd -m runner

RUN echo 'runner soft nproc 16' >> /etc/security/limits.conf
RUN echo 'runner hard nproc 16' >> /etc/security/limits.conf
RUN echo 'runner soft nofile 128' >> /etc/security/limits.conf
RUN echo 'runner hard nofile 128' >> /etc/security/limits.conf

WORKDIR /tmp
