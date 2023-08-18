FROM ubuntu:focal
MAINTAINER Danilo Santoro <danilo.santoro@gmail.com>

ARG INSTANCE_DOMAIN
ARG INSTANCE_NAME
ARG DB_ROOT_PASS
ARG HOST_IP
ARG DB_PORT
ARG DB_USER
ARG DB_PASS
ARG DB_NAME

ENV INSTANCE_DOMAIN $INSTANCE_DOMAIN
ENV INSTANCE_NAME $INSTANCE_NAME
ENV DB_ROOT_PASS $DB_ROOT_PASS
ENV HOST_IP $HOST_IP
ENV DB_PORT $DB_PORT
ENV DB_USER $DB_USER
ENV DB_PASS $DB_PASS
ENV DB_NAME $DB_NAME

ENV DEBIAN_FRONTEND noninteractive

# To avoid internet overload every build
ARG APT_PROXY
ENV APT_PROXY $APT_PROXY
RUN if [ ! -z "$APT_PROXY" ]; then echo "Acquire::http::Proxy \"${APT_PROXY}\";" > /etc/apt/apt.conf.d/02proxy ; fi

RUN apt-get update
RUN apt-get install -yq --no-install-recommends netcat curl gnupg sudo lsb-release debconf-utils supervisor wget

COPY ./packages /root/packages

RUN echo "mysql-server mysql-server/root_password password root" | debconf-set-selections \
&&  echo "mysql-community-server mysql-community-server/root-pass password root" | debconf-set-selections \
&&  echo "mysql-community-server mysql-community-server/re-root-pass password root" | debconf-set-selections \
&&  echo "mysql-community-server mysql-server/default-auth-override select Use Legacy Authentication Method (Retain MySQL 5.x Compatibility)" | debconf-set-selections \
&&  dpkg -i /root/packages/*.deb \
&&  sudo apt-get update && apt-get install -y mysql-server \
&&  echo " \n\
[program: mysql] \n\
#command = nohup mysqld_safe --user=root --default-authentication-plugin=mysql_native_password \n\
command = mysqld_safe --user=root \n\
autostart = true \n\
autorestart = true \n\
" > /etc/supervisor/conf.d/mysql.conf

COPY ./schemas /root/schemas
COPY ./conf/service /etc/mysql
COPY ./bin/looper.sh /usr/local/bin/looper.sh
COPY ./bin/boot_run.sh /usr/local/bin/boot_run.sh
COPY ./bin/wait-for.sh /usr/local/bin/wait-for.sh
COPY ./bin/generate-cert.sh /usr/sbin/generate-cert.sh

CMD ["/usr/local/bin/boot_run.sh"]
