FROM ubuntu:focal
MAINTAINER Danilo Santoro <danilo.santoro@gmail.com>

ARG MEMC_MEM
ARG MEMC_HOST
ARG MEMC_PORT

ENV MEMC_MEM $MEMC_MEM
ENV MEMC_HOST $MEMC_HOST
ENV MEMC_PORT $MEMC_PORT

# To avoid internet overload every build
ARG APT_PROXY
ENV APT_PROXY $APT_PROXY
RUN if [ ! -z "$APT_PROXY" ]; then echo "Acquire::http::Proxy \"${APT_PROXY}\";" > /etc/apt/apt.conf.d/02proxy ; fi

RUN apt-get update \
	&& DEBIAN_FRONTEND=noninteractive apt-get install -y memcached netcat \
	&& sed 's/^-d/# -d/' -i /etc/memcached.conf \
	&& rm -rf /var/lib/apt/lists/*

COPY ./bin/looper.sh /usr/local/bin/looper.sh
COPY ./bin/boot_run.sh /usr/local/bin/boot_run.sh
COPY ./bin/wait-for.sh /usr/local/bin/wait-for.sh

ENTRYPOINT ["/usr/local/bin/boot_run.sh"]
