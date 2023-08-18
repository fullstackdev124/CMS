FROM node:16-slim
MAINTAINER Danilo Santoro <danilo.santoro@gmail.com>

ARG BACKEND_HTTP_PORT
ARG BACKEND_HTTPS_PORT

ENV BACKEND_HTTP_PORT $BACKEND_HTTP_PORT
ENV BACKEND_HTTPS_PORT $BACKEND_HTTPS_PORT

RUN mkdir -p /app

WORKDIR /app

COPY --chown=node package*.json ./

RUN npm install

COPY --chown=node . .

RUN npm run rebuild

ENV HOST=0.0.0.0 PORT=$BACKEND_HTTP_PORT

EXPOSE $BACKEND_HTTP_PORT $BACKEND_HTTPS_PORT

CMD [ "npm", "run", "start" ]
