FROM ubuntu:focal

MAINTAINER "Danilo Santoro <danilo.santoro@gmail.com>"

ARG ADVERTISED_SIP_UDP_PORT
ARG ADVERTISED_SIP_TCP_PORT
ARG ADVERTISED_SIP_TLS_PORT
ARG ADVERTISED_RANGE_FIRST
ARG ADVERTISED_RANGE_LAST
ARG INSTANCE_DOMAIN
ARG TELCO_HTTP_PORT
ARG TELCO_ENDPOINT
ARG INSTANCE_NAME
ARG ADVERTISED_IP
ARG DB_ROOT_PASS
ARG DB_USER
ARG DB_PASS
ARG DB_NAME
ARG DB_PORT
ARG DB_HOST
ARG HOST_IP

ENV ADVERTISED_SIP_UDP_PORT $ADVERTISED_SIP_UDP_PORT
ENV ADVERTISED_SIP_TCP_PORT $ADVERTISED_SIP_TCP_PORT
ENV ADVERTISED_SIP_TLS_PORT $ADVERTISED_SIP_TLS_PORT
ENV ADVERTISED_RANGE_FIRST $ADVERTISED_RANGE_FIRST
ENV ADVERTISED_RANGE_LAST $ADVERTISED_RANGE_LAST
ENV INSTANCE_DOMAIN $INSTANCE_DOMAIN
ENV TELCO_HTTP_PORT $TELCO_HTTP_PORT
ENV TELCO_ENDPOINT $TELCO_ENDPOINT
ENV INSTANCE_NAME $INSTANCE_NAME
ENV ADVERTISED_IP $ADVERTISED_IP
ENV DB_ROOT_PASS $DB_ROOT_PASS
ENV DB_USER $DB_USER
ENV DB_PASS $DB_PASS
ENV DB_NAME $DB_NAME
ENV DB_PORT $DB_PORT
ENV DB_HOST $DB_HOST
ENV HOST_IP $HOST_IP

ENV DEBIAN_FRONTEND=noninteractive

USER root

# To avoid internet overload every build
ARG APT_PROXY
ENV APT_PROXY $APT_PROXY
RUN if [ ! -z "$APT_PROXY" ]; then echo "Acquire::http::Proxy \"${APT_PROXY}\";" > /etc/apt/apt.conf.d/02proxy ; fi

RUN mkdir -p /packages
COPY packages/* /packages/

RUN apt-get update && apt-get install --no-install-recommends -y sudo apt-utils aptitude default-libmysqlclient-dev libncurses5 libncurses5-dev openssl libradcli4 \
	debhelper libevent-dev curl sngrep libcurl4-openssl-dev libbencode-perl libcrypt-rijndael-perl libdigest-hmac-perl libio-socket-inet6-perl dpkg-dev \
	libconfig-tiny-perl db-util libconfuse2 libjson-c4 libcurl3-gnutls libmaxminddb0 libmicrohttpd12 liblua5.1-0 libmemcached11 libswresample3 expect \
	libsocket6-perl netcat libglib2.0-dev libhiredis-dev libpcre3-dev libssl-dev libxmlrpc-core-c3-dev markdown zlib1g-dev module-assistant dkms \
	libsctp1 libpci3 libsnmp35 libodbc1 libwebsockets15 libavcodec58 libavfilter7 libavformat58 libconfig-simple-perl libcrypt-cbc-perl vim \
	libclass-dbi-mysql-perl libnet-dns-perl libcache-memcached-fast-perl libjson-perl libxml-parser-perl libprotocol-websocket-perl \
	gettext libavcodec-dev libavfilter-dev libavformat-dev libjson-glib-dev libpcap-dev nfs-common libspandsp2 procps libavutil56 \
	nodejs npm node-gyp libnode-dev libnode64 rsyslog \
	&& dpkg -i /packages/*.deb \
	&& apt-get clean \
	&& rm -rf /var/lib/apt/lists/* \
	&& echo "local0.* -/var/log/sbc.log" > /etc/rsyslog.d/sbc.conf \
	&& echo "if \$msg contains 'ACC:' then /var/log/opensips/opensips-acc.log" >> /etc/rsyslog.d/sbc.conf 

COPY ./bin/generate-cert.sh /usr/sbin/generate-cert.sh
RUN /usr/sbin/generate-cert.sh -C $INSTANCE_DOMAIN -O "$INSTANCE_NAME" -d /var/run/certs \
	&& apt-get purge -y pkg-config aptitude build-essential flex m4 \
	&& apt-get --purge autoremove -y \
	&& apt-get clean

RUN /bin/rm -fr /usr/share/doc/* && \
	/bin/rm -fr /usr/share/man/* && \
	/bin/rm -fr /usr/src && \
	/bin/rm -fr /packages

COPY ./content/nodeuc /srv/nodeuc
COPY ./conf/service/opensips/* /etc/opensips/
COPY ./conf/etc/opensips /etc/default/opensips
COPY ./conf/service/rsyslog/rsyslog.conf /etc/rsyslog.conf

COPY ./bin/looper.sh /usr/local/bin/looper.sh
COPY ./bin/boot_run.sh /usr/local/bin/boot_run.sh
COPY ./bin/wait-for.sh /usr/local/bin/wait-for.sh
COPY ./bin/notify_external.sh /usr/local/bin/notify_external.sh

RUN chown root.root /usr/local/bin/boot_run.sh && \
	chown root.root /usr/local/bin/looper.sh && \
	chmod 700 /usr/local/bin/boot_run.sh && \
	chmod 700 /usr/local/bin/looper.sh && \
	npm install pm2 -g

ENTRYPOINT ["/usr/local/bin/boot_run.sh"]
