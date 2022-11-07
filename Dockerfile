FROM node:10.18.1-alpine3.11
LABEL maintainer="reyhan@investree.id"

WORKDIR /qa-backend-mocha

COPY package*.json ./

RUN npm install

ENTRYPOINT [ "/usr/local/bin/npm", "run" ]