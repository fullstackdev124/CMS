FROM ubuntu:focal

MAINTAINER "Danilo Santoro <danilo.santoro@gmail.com>"

ARG ADVERTISED_SIP_UDP_PORT
ARG ADVERTISED_SIP_TCP_PORT
ARG ADVERTISED_SIP_TLS_PORT
ARG ADVERTISED_RANGE_FIRST
ARG ADVERTISED_RANGE_LAST
ARG BACKEND_HTTPS_PORT
ARG INSTANCE_DOMAIN
ARG INSTANCE_NAME
ARG ADVERTISED_IP
ARG HOST_IP
ARG DB_PORT
ARG DB_USER
ARG DB_PASS
ARG DB_NAME

ENV ADVERTISED_SIP_UDP_PORT $ADVERTISED_SIP_UDP_PORT
ENV ADVERTISED_SIP_TCP_PORT $ADVERTISED_SIP_TCP_PORT
ENV ADVERTISED_SIP_TLS_PORT $ADVERTISED_SIP_TLS_PORT
ENV ADVERTISED_RANGE_FIRST $ADVERTISED_RANGE_FIRST
ENV ADVERTISED_RANGE_LAST $ADVERTISED_RANGE_LAST
ENV BACKEND_HTTPS_PORT $BACKEND_HTTPS_PORT
ENV INSTANCE_DOMAIN $INSTANCE_DOMAIN
ENV INSTANCE_NAME $INSTANCE_NAME
ENV ADVERTISED_IP $ADVERTISED_IP
ENV HOST_IP $HOST_IP
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

RUN mkdir -p /packages
COPY packages/* /packages/

RUN apt-get update && apt-get install --no-install-recommends -y sudo netcat screen libatomic1 mysql-common incron \
	libhttp-cookies-perl libhttp-daemon-perl libhttp-date-perl libhttp-message-perl libhttp-negotiate-perl libima-dbi-perl \
	libconfig-json-perl libconfig-simple-perl libdata-dump-perl libdbd-mysql-perl libdbi-perl libdbix-contextualfetch-perl \
	libhtml-form-perl libhtml-format-perl libhtml-parser-perl libhtml-tagset-perl libhtml-template-perl libhtml-tree-perl \
	libalgorithm-diff-perl libalgorithm-diff-xs-perl libalgorithm-merge-perl libaudio-scan-perl libauthen-sasl-perl \
	libtry-tiny-perl libtypes-serialiser-perl libuniversal-moniker-perl liburi-perl liburl-encode-perl libwww-perl \
	libb-hooks-op-check-perl libcgi-fast-perl libcgi-pm-perl libclass-accessor-perl libclass-data-inheritable-perl \
	libfcgi-perl libfile-fcntllock-perl libfile-listing-perl libfile-tail-perl libfont-afm-perl libhash-merge-perl \
	libtext-charwidth-perl libtext-iconv-perl libtext-wrapi18n-perl libtime-piece-mysql-perl libtimedate-perl \
	libimport-into-perl libio-html-perl libio-socket-ssl-perl libio-stringy-perl libjson-perl libjson-xs-perl \
	libclass-dbi-abstractsearch-perl libclass-dbi-mysql-perl libclass-dbi-perl libclass-method-modifiers-perl \
	libdevel-callchecker-perl libdpkg-perl libdynaloader-functions-perl libencode-locale-perl liberror-perl \
	libclass-trigger-perl libclass-xsaccessor-perl libclone-choose-perl libclone-perl libcommon-sense-perl \
	liblwp-useragent-determined-perl libmailtools-perl libmodule-runtime-perl libmoo-perl libnet-http-perl \
	libnet-libidn-perl libnet-smtp-ssl-perl libnet-ssleay-perl libparams-classify-perl  librole-tiny-perl \
	libsql-abstract-limit-perl libsql-abstract-perl libstrictures-perl libsub-name-perl libsub-quote-perl \
	liblingua-en-inflect-perl liblocale-gettext-perl liblwp-mediatypes-perl liblwp-protocol-https-perl \
	libwww-robotrules-perl perl-openssl-defaults rsyslog \
	&& dpkg -i /packages/*.deb \
	&& apt-get clean \
	&& rm -rf /var/lib/apt/lists/* \
	&& echo "local5.* -/var/log/rtpproxy.log" > /etc/rsyslog.d/rtpproxy.conf

RUN apt-get --purge autoremove -y \
	&& apt-get clean

RUN /bin/rm -fr /usr/share/doc/* && \
	/bin/rm -fr /usr/share/man/* && \
	/bin/rm -fr /usr/src && \
	/bin/rm -fr /packages

COPY ./content/CDREngine /usr/local/CDREngine
COPY ./content/CDREngine/init.d/CDREngine /etc/init.d/CDREngine
COPY ./conf/service/incron/incron.cfg /etc/incron-import.cfg
COPY ./conf/service/rtpproxy/rtpproxy /etc/default/rtpproxy

COPY ./bin/looper.sh /usr/local/bin/looper.sh
COPY ./bin/boot_run.sh /usr/local/bin/boot_run.sh
COPY ./bin/wait-for.sh /usr/local/bin/wait-for.sh

RUN /usr/sbin/useradd -U -M rtpproxy -s /usr/sbin/nologin && \
	chown root.root /usr/local/bin/boot_run.sh && \
	chown root.root /usr/local/bin/looper.sh && \
	chmod 700 /usr/local/bin/boot_run.sh && \
	chmod 700 /usr/local/bin/looper.sh 

ENTRYPOINT ["/usr/local/bin/boot_run.sh"]
