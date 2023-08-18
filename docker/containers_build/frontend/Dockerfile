FROM node:16.14.2 as build

MAINTAINER Danilo Santoro <danilo.santoro@gmail.com>

ARG BACKEND_HTTPS_PORT
ARG INSTANCE_DOMAIN
ARG INSTANCE_NAME
ARG LETS_DOMAIN
ARG LETS_EMAIL
ARG HOST_FQDN
ARG HOST_IP

ENV BACKEND_HTTPS_PORT $BACKEND_HTTPS_PORT
ENV INSTANCE_DOMAIN $INSTANCE_DOMAIN
ENV INSTANCE_NAME $INSTANCE_NAME
ENV LETS_DOMAIN $LETS_DOMAIN
ENV LETS_EMAIL $LETS_EMAIL
ENV HOST_FQDN $HOST_FQDN
ENV HOST_IP $HOST_IP

WORKDIR /app/
COPY ./content/ecms-frontend/*.conf /app/
COPY ./content/ecms-frontend/*.json /app/
COPY ./content/ecms-frontend/*.js /app/
COPY ./content/ecms-frontend/browserslist /app/

RUN mkdir -p /app/src/
COPY ./content/ecms-frontend/src /app/src/

RUN cd /app && sed -i "s/{{BACKEND_HTTPS_PORT}}/${BACKEND_HTTPS_PORT}/g" /app/src/environments/*
RUN cd /app && sed -i "s/{{HOST_FQDN}}/${HOST_FQDN}/g" /app/src/environments/environment.tpl.ts
RUN cd /app && cp /app/src/environments/environment.tpl.ts /app/src/environments/environment.ts
RUN cat /app/src/environments/*
RUN cd /app && rm -fr package-lock.json
RUN cd /app && npm cache clean --force
RUN cd /app && npm install npm@latest
RUN cd /app && npm install
RUN cd /app && npm install -g @angular/cli
RUN cd /app && npm install -g @angular-devkit/build-angular
RUN npx browserslist --update-db
RUN cd /app && npm run build

FROM nginx:1.15-alpine

COPY ./bin/looper.sh /usr/local/bin/looper.sh
COPY ./bin/boot_run.sh /usr/local/bin/boot_run.sh
COPY ./bin/get_certs.sh /usr/local/bin/get_certs.sh

RUN apk add certbot bash \
    && mkdir -p /var/log/nginx \
    && rm -rf /usr/share/nginx/html/* \
    && chown root.root /usr/local/bin/* \
    && mkdir -p /usr/share/nginx/certbot \
    && chmod 700 /usr/local/bin/looper.sh \
    && chmod 700 /usr/local/bin/boot_run.sh \
    && ln -sf /dev/stderr /var/log/nginx/error.log \
    && ln -sf /dev/stdout /var/log/nginx/access.log

# Just for debug --- remove next line
# COPY --from=build /app/ /usr/src
COPY --from=build /app/dist/Epic/ /usr/share/nginx/html
COPY --from=build /app/nginx-custom.conf /etc/nginx/conf.d/default.conf

ENTRYPOINT ["/usr/local/bin/boot_run.sh"]
