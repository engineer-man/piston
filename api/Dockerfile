FROM node:15.8.0-alpine3.13
RUN apk add --no-cache gnupg tar bash coreutils shadow util-linux
RUN userdel -r node
RUN for i in $(seq 1000 1500); do \
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