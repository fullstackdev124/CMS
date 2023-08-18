FROM node:16-slim
MAINTAINER Danilo Santoro <danilo.santoro@gmail.com>

ARG BACKEND_HTTPS_PORT
ARG INSTANCE_DOMAIN
ARG TELCO_HTTP_PORT
ARG INSTANCE_NAME
ARG DB_ROOT_PASS
ARG HADOOP_PORT
ARG REDIS_PORT
ARG DB_USER
ARG DB_PASS
ARG DB_NAME
ARG DB_PORT
ARG DB_HOST
ARG HOST_IP

ENV BACKEND_HTTPS_PORT $BACKEND_HTTPS_PORT
ENV INSTANCE_DOMAIN $INSTANCE_DOMAIN
ENV TELCO_HTTP_PORT $TELCO_HTTP_PORT
ENV INSTANCE_NAME $INSTANCE_NAME
ENV DB_ROOT_PASS $DB_ROOT_PASS
ENV HADOOP_PORT $HADOOP_PORT
ENV REDIS_PORT $REDIS_PORT
ENV DB_USER $DB_USER
ENV DB_PASS $DB_PASS
ENV DB_NAME $DB_NAME
ENV DB_PORT $DB_PORT
ENV DB_HOST $DB_HOST
ENV HOST_IP $HOST_IP

COPY ./bin/looper.sh /usr/local/bin/looper.sh
COPY ./bin/boot_run.sh /usr/local/bin/boot_run.sh
COPY ./bin/wait-for.sh /usr/local/bin/wait-for.sh

RUN mkdir -p /app

WORKDIR /app

COPY --chown=node /content/ecms-backend/package*.json ./

COPY --chown=node /content/ecms-backend/. .

RUN npm install pm2 -g

RUN chown root.root /usr/local/bin/* \
    && chmod 700 /usr/local/bin/looper.sh \
    && chmod 700 /usr/local/bin/boot_run.sh \
    && apt update && apt -f -y install stunnel4

COPY ./conf/etc/stunnel4 /etc/default/stunnel4
COPY ./conf/etc/apissl.conf /etc/stunnel/apissl.conf

EXPOSE $TELCO_HTTP_PORT $BACKEND_HTTPS_PORT

ENTRYPOINT ["/usr/local/bin/boot_run.sh"]
