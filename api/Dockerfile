FROM node:15.8.0-buster-slim
RUN dpkg-reconfigure -p critical dash
RUN for i in $(seq 1001 1500); do \
        groupadd -g $i runner$i && \
        useradd -M runner$i -g $i -u $i ; \
    done
RUN apt-get update && \
    apt-get install -y libxml2 gnupg tar coreutils util-linux libc6-dev binutils build-essential locales libpcre3-dev libevent-dev libgmp3-dev libncurses6 libncurses5 libedit-dev && \
    rm -rf /var/lib/apt/lists/*

RUN sed -i '/en_US.UTF-8/s/^# //g' /etc/locale.gen && locale-gen

ENV NODE_ENV=production
WORKDIR /piston_api
COPY ["package.json", "yarn.lock", "./"]
RUN yarn
COPY ./src ./src

CMD [ "node", "src", "-m", "-c", "/piston/config.yaml"]
EXPOSE 6969/tcp
