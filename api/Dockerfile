FROM node:15.8.0-buster-slim
RUN dpkg-reconfigure -p critical dash
RUN apt-get update && apt-get install -y libxml2 gnupg tar coreutils util-linux \
  && rm -rf /var/lib/apt/lists/*

RUN for i in $(seq 1001 1500); do \
        groupadd -g $i runner$i && \
        useradd -M runner$i -g $i -u $i ; \
    done

ENV NODE_ENV=production
WORKDIR /piston_api
COPY ["package.json", "yarn.lock", "./"]
RUN yarn
COPY ./src ./src

CMD [ "node", "src", "-m", "-c", "/piston/config.yaml"]
EXPOSE 6969/tcp