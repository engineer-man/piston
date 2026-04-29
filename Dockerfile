# Railway-friendly Dockerfile for the Piston API.
#
# Differences from api/Dockerfile (used with docker-compose):
#  * Build context is the repository root (Railway default).
#  * Entrypoint tolerates running without privileged / cgroup v2, so the API
#    can boot on managed platforms such as Railway, Render, Fly.io machines,
#    Cloud Run, etc. When isolate cannot be initialised the API automatically
#    falls back to running code without the isolate sandbox -- this is the
#    only way Piston can execute code on platforms that disallow
#    `--privileged` containers, but it disables the security guarantees that
#    Piston normally provides. Only enable this on trusted, low-volume
#    deployments (personal projects, demos, education).

FROM buildpack-deps:bullseye AS isolate
RUN apt-get update && \
    apt-get install -y --no-install-recommends git libcap-dev && \
    rm -rf /var/lib/apt/lists/* && \
    git clone https://github.com/envicutor/isolate.git /tmp/isolate/ && \
    cd /tmp/isolate && \
    git checkout af6db68042c3aa0ded80787fbb78bc0846ea2114 && \
    make -j$(nproc) install && \
    rm -rf /tmp/*

FROM node:18-bullseye-slim

ENV DEBIAN_FRONTEND=noninteractive

RUN dpkg-reconfigure -p critical dash
RUN apt-get update && \
    apt-get install -y libxml2 gnupg tar coreutils util-linux libc6-dev \
    binutils build-essential locales libpcre3-dev libevent-dev libgmp3-dev \
    libncurses6 libncurses5 libedit-dev libseccomp-dev rename procps python3 \
    libreadline-dev libblas-dev liblapack-dev libpcre3-dev libarpack2-dev \
    libfftw3-dev libglpk-dev libqhull-dev libqrupdate-dev libsuitesparse-dev \
    libsundials-dev libpcre2-dev libcap-dev curl && \
    rm -rf /var/lib/apt/lists/*
RUN useradd -m -d /home/piston piston
COPY --from=isolate /usr/local/bin/isolate /usr/local/bin
COPY --from=isolate /usr/local/etc/isolate /usr/local/etc/isolate

RUN sed -i '/en_US.UTF-8/s/^# //g' /etc/locale.gen && locale-gen

WORKDIR /piston_api
COPY api/package.json api/package-lock.json ./
RUN npm install
COPY api/src ./src

# Pre-create the data directory so we can drop privileges later.
RUN mkdir -p /piston/packages /piston/jobs && \
    chown -R piston:piston /piston

# Default to no-isolate mode on Railway-style deployments. Operators that run
# the container with --privileged + cgroup v2 can override this back to false
# to regain the full isolate sandbox.
ENV PISTON_DISABLE_ISOLATE=true \
    PISTON_BIND_ADDRESS=0.0.0.0:2000 \
    PORT=2000

EXPOSE 2000/tcp

CMD ["/piston_api/src/docker-entrypoint.sh"]
