FROM ubuntu:focal
MAINTAINER Danilo Santoro <danilo.santoro@gmail.com>

# To avoid internet overload every build
ARG APT_PROXY
ENV APT_PROXY $APT_PROXY
RUN if [ ! -z "$APT_PROXY" ]; then echo "Acquire::http::Proxy \"${APT_PROXY}\";" > /etc/apt/apt.conf.d/02proxy ; fi

RUN apt-get update \
	&& DEBIAN_FRONTEND=noninteractive apt-get install -y syslog-ng \
	syslog-ng-core \
	syslog-ng-mod-add-contextual-data \
	syslog-ng-mod-extra \
	syslog-ng-mod-geoip \
	syslog-ng-mod-getent \
	syslog-ng-mod-journal \
	syslog-ng-mod-map-value-pairs \
	syslog-ng-mod-python \
	syslog-ng-mod-redis \
	syslog-ng-mod-riemann \
	syslog-ng-mod-smtp \
	syslog-ng-mod-sql \
	syslog-ng-mod-stardate \
	syslog-ng-mod-stomp \
	syslog-ng-mod-tag-parser \
	syslog-ng-mod-xml-parser \
	&& rm -rf /var/lib/apt/lists/*

COPY ./conf/service/syslog/ /etc/syslog-ng/
COPY ./conf/service/logrotate/ /etc/logrotate.d/

COPY ./bin/looper.sh /usr/local/bin/looper.sh
COPY ./bin/boot_run.sh /usr/local/bin/boot_run.sh
COPY ./bin/wait-for.sh /usr/local/bin/wait-for.sh

HEALTHCHECK --interval=2m --timeout=3s --start-period=30s CMD /usr/sbin/syslog-ng-ctl stats || exit 1

ENTRYPOINT ["/usr/local/bin/boot_run.sh"]
