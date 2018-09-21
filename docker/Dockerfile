FROM ubuntu:18.04

RUN apt-get update
RUN apt-get -y install bash-completion
RUN apt-get -y install build-essential
RUN apt-get -y install python
RUN apt-get -y install python3
RUN apt-get -y install ruby
RUN apt-get -y install nodejs
RUN apt-get -y install golang

RUN useradd -g root runner

RUN echo '@runner soft nproc 64' >> /etc/security/limits.conf
RUN echo '@runner hard nproc 64' >> /etc/security/limits.conf

USER runner
WORKDIR /tmp
