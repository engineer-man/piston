FROM node:15.8.0-alpine3.13
RUN apk add --no-cache gnupg tar bash coreutils util-linux

ENV NODE_ENV=production
WORKDIR /piston_api
COPY ["package.json", "yarn.lock", "./"]
RUN yarn
COPY ./src ./src

CMD [ "node", "src", "-m", "-c", "/piston/config.yaml"]
EXPOSE 6969/tcp