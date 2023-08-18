FROM redis:6.2-alpine
MAINTAINER Danilo Santoro <danilo.santoro@gmail.com>

ARG INSTANCE_DOMAIN
ARG INSTANCE_NAME
ARG HOST_IP
ARG DB_HOST
ARG REDIS_PORT

ENV INSTANCE_DOMAIN $INSTANCE_DOMAIN
ENV INSTANCE_NAME $INSTANCE_NAME
ENV HOST_IP $HOST_IP
ENV DB_HOST $DB_HOST
ENV REDIS_PORT $REDIS_PORT
ENV REDIS_PASS $REDIS_PASS

COPY ./bin/looper.sh /usr/local/bin/looper.sh
COPY ./bin/boot_run.sh /usr/local/bin/boot_run.sh
COPY ./bin/wait-for.sh /usr/local/bin/wait-for.sh

CMD ["/usr/local/bin/boot_run.sh"]
