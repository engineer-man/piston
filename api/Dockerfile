FROM buildpack-deps@sha256:d56cd472000631b8faca51f40d4e3f1b20deffa588f9f207fa6c60efb62ba7c4 AS isolate
RUN apt-get update && \
    apt-get install -y --no-install-recommends git libcap-dev && \
    rm -rf /var/lib/apt/lists/* && \
    git clone https://github.com/envicutor/isolate.git /tmp/isolate/ && \
    cd /tmp/isolate && \
    git checkout af6db68042c3aa0ded80787fbb78bc0846ea2114 && \
    make -j$(nproc) install && \
    rm -rf /tmp/*

FROM node:15.10.0-buster-slim

ENV DEBIAN_FRONTEND=noninteractive

RUN dpkg-reconfigure -p critical dash
RUN for i in $(seq 1001 1500); do \
        groupadd -g $i runner$i && \
        useradd -M runner$i -g $i -u $i ; \
    done
RUN apt-get update && \
    apt-get install -y libxml2 gnupg tar coreutils util-linux libc6-dev \
    binutils build-essential locales libpcre3-dev libevent-dev libgmp3-dev \
    libncurses6 libncurses5 libedit-dev libseccomp-dev rename procps python3 \
    libreadline-dev libblas-dev liblapack-dev libpcre3-dev libarpack2-dev \
    libfftw3-dev libglpk-dev libqhull-dev libqrupdate-dev libsuitesparse-dev \
    libsundials-dev libpcre2-dev && \
    rm -rf /var/lib/apt/lists/*
COPY --from=isolate /usr/local/bin/isolate /usr/local/bin
COPY --from=isolate /usr/local/etc/isolate /usr/local/etc/isolate

RUN sed -i '/en_US.UTF-8/s/^# //g' /etc/locale.gen && locale-gen

WORKDIR /piston_api
COPY ["package.json", "package-lock.json", "./"]
RUN npm install
COPY ./src ./src

CMD ["/piston_api/src/docker-entrypoint.sh"]
EXPOSE 2000/tcp
