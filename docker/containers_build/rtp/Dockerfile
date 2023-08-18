FROM debian:stretch
MAINTAINER "Danilo Santoro <danilo.santoro@gmail.com>"

ARG APT_PROXY
ARG TELCO_HTTP_PORT
ARG RTPPROXY_CTRL_PORT
ARG ADVERTISED_RANGE_LAST
ARG ADVERTISED_RANGE_FIRST
ARG ADVERTISED_SIP_UDP_PORT
ARG ADVERTISED_SIP_TCP_PORT
ARG ADVERTISED_SIP_TLS_PORT
ARG INSTANCE_DOMAIN
ARG INSTANCE_NAME
ARG ADVERTISED_IP
ARG HOST_IP
ARG DB_HOST
ARG DB_PORT
ARG DB_USER
ARG DB_PASS
ARG DB_NAME

ENV APT_PROXY $APT_PROXY
ENV TELCO_HTTP_PORT $TELCO_HTTP_PORT
ENV RTPPROXY_CTRL_PORT $RTPPROXY_CTRL_PORT
ENV ADVERTISED_RANGE_LAST $RTP_RANGE_END
ENV ADVERTISED_RANGE_FIRST $RTP_RANGE_START
ENV ADVERTISED_SIP_UDP_PORT $SBC_SIP_PORT
ENV ADVERTISED_SIP_TCP_PORT $SBC_SIP_PORT
ENV ADVERTISED_SIP_TLS_PORT $SBC_TLS_PORT
ENV INSTANCE_DOMAIN $INSTANCE_DOMAIN
ENV INSTANCE_NAME $INSTANCE_NAME
ENV ADVERTISED_IP $EXTERNAL_IP
ENV HOST_IP $HOST_IP
ENV DB_HOST $DB_HOST
ENV DB_PORT $DB_PORT
ENV DB_USER $DB_USER
ENV DB_PASS $DB_PASS
ENV DB_NAME $DB_NAME

ENV DEBIAN_FRONTEND=noninteractive

USER root

# To avoid internet overload every build
ARG APT_PROXY
ENV APT_PROXY $APT_PROXY
RUN if [ ! -z "$APT_PROXY" ]; then echo "Acquire::http::Proxy \"${APT_PROXY}\";" > /etc/apt/apt.conf.d/02proxy ; fi

RUN apt-get update \
  && apt-get -y --quiet --force-yes upgrade curl iproute2 \
  && apt-get install -y --no-install-recommends ca-certificates gcc g++ make build-essential git \
  iptables-dev libavfilter-dev libevent-dev libpcap-dev libxmlrpc-core-c3-dev markdown cmake \
  libcurl4-openssl-dev libavcodec-extra gperf libspandsp-dev libwebsockets-dev supervisor \
  libjson-glib-dev default-libmysqlclient-dev libhiredis-dev libssl-dev netcat incron \
  && cd /usr/local/src \
  && git clone https://github.com/BelledonneCommunications/bcg729 \
  && cd bcg729 && cmake . && make && make install \
  && cd /usr/local/src \
  && git clone https://github.com/sipwise/rtpengine.git \
  && cd rtpengine \
  && make all && make install \
  && cp /usr/local/src/rtpengine/daemon/rtpengine /usr/local/bin/rtpengine \
  && cp /usr/local/src/rtpengine/recording-daemon/rtpengine-recording /usr/local/bin/rtpengine-recording \
  && rm -Rf /usr/local/src/rtpengine \
  && apt-get purge -y --quiet --force-yes --auto-remove \
  ca-certificates gcc g++ make build-essential git markdown cmake \
#  && rm -rf /var/lib/apt/* \
#  && rm -rf /var/lib/dpkg/* \
#  && rm -rf /var/lib/cache/* \
#  && rm -Rf /var/log/* \
#  && rm -Rf /var/lib/apt/lists/* \
  && rm -Rf /usr/local/src/* \
  && echo " \n\
[program: rtpengine] \n\
command = /usr/local/bin/rtpengine -f -E -L 7 --no-log-timestamps --pidfile /run/rtpengine-daemon.pid --config-file /etc/rtpengine.conf \n\
autostart = true \n\
autorestart = true \n\
" > /etc/supervisor/conf.d/rtpengine.conf \
  && echo " \n\
[program: rtpengine-recording] \n\
command = /usr/local/bin/rtpengine-recording -f -E -L 7 --no-log-timestamps --pidfile=/run/rtpengine-recording-daemon.pid --config-file=/etc/rtpengine-recording.conf \n\
autostart = true \n\
autorestart = true \n\
" > /etc/supervisor/conf.d/rtpengine-recording.conf 

COPY ./content/CDREngine /usr/local/CDREngine
COPY ./conf/service/incron/incron.cfg /etc/incron-import.cfg
COPY ./content/CDREngine/init.d/CDREngine /etc/init.d/CDREngine
COPY ./conf/service/rtpengine/rtpengine.conf /etc/rtpengine.conf
COPY ./conf/service/supervisor/supervisord.conf /etc/supervisor/supervisord.conf
COPY ./conf/service/rtpengine/rtpengine-recording.conf /etc/rtpengine-recording.conf

COPY ./bin/looper.sh /usr/local/bin/looper.sh
COPY ./bin/boot_run.sh /usr/local/bin/boot_run.sh
COPY ./bin/wait-for.sh /usr/local/bin/wait-for.sh

ENTRYPOINT ["/usr/local/bin/boot_run.sh"]
