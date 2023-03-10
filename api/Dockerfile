FROM node:15.10.0-buster-slim

ENV DEBIAN_FRONTEND=noninteractive

RUN dpkg-reconfigure -p critical dash
RUN for i in $(seq 1001 1500); do \
        groupadd -g $i runner$i && \
        useradd -M runner$i -g $i -u $i ; \
    done
RUN apt-get update && \
    apt-get install -y git gawk libxml2 gnupg tar coreutils util-linux libc6-dev \
    binutils build-essential locales libpcre3-dev libevent-dev libgmp3-dev \
    libncurses6 libncurses5 libedit-dev libseccomp-dev rename procps python3 \
    libreadline-dev libblas-dev liblapack-dev libpcre3-dev libarpack2-dev \
    libfftw3-dev libglpk-dev libqhull-dev libqrupdate-dev libsuitesparse-dev \
    libsundials-dev libpcre2-dev && \
    rm -rf /var/lib/apt/lists/*

RUN sed -i '/en_US.UTF-8/s/^# //g' /etc/locale.gen && locale-gen

RUN npm install --global pnpm

WORKDIR /piston_api
COPY ["package.json", "pnpm-lock.yaml", "tsconfig.json", "./"]
COPY ./src ./src

RUN pnpm install
RUN pnpm build

COPY ./src/nosocket ./dist/nosocket

RUN make -C ./dist/nosocket/ all && make -C ./dist/nosocket/ install


CMD [ "pnpm", "api"]
EXPOSE 2000/tcp
