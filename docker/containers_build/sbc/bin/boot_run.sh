#!/bin/bash
# OpenSIPS Docker bootstrap

INSTANCE_NAME=${INSTANCE_DOMAIN:-"Tech Fusion ITc"}
INSTANCE_DOMAIN=${INSTANCE_DOMAIN:-"techfusion.it"}

HOST_IP=${HOST_IP:-"127.0.0.1"}
ADVERTISED_IP=${ADVERTISED_IP:-"127.0.0.1"}
ADVERTISED_SIP_WSS_PORT=${ADVERTISED_SIP_WSS_PORT:-"5060"}
ADVERTISED_SIP_UDP_PORT=${ADVERTISED_SIP_UDP_PORT:-"5060"}
ADVERTISED_SIP_TCP_PORT=${ADVERTISED_SIP_TCP_PORT:-"5060"}
ADVERTISED_SIP_TLS_PORT=${ADVERTISED_SIP_TLS_PORT:-"5061"}
ADVERTISED_RANGE_FIRST=${ADVERTISED_RANGE_FIRST:-"20000"}
ADVERTISED_RANGE_LAST=${ADVERTISED_RANGE_LAST:-"20100"}

SHM_MEM=${SHM_MEM:-"2048"}
PKG_MEM=${PKG_MEM:-"512"}

DB_ROOT_PASS=${DB_ROOT_PASS:-"l3tMe.In*"}
DB_PASS=${DB_PASS:-"l3tMe.In*"}
DB_USER=${DB_USER:-"opensips"}
DB_NAME=${DB_NAME:-"opensips"}
DB_HOST=${DB_HOST:-"127.0.0.1"}

TELCO_HTTP_PORT=${TELCO_HTTP_PORT:-"9080"}
REST_ENDPOINT=http://${HOST_IP}:${TELCO_HTTP_PORT}/api/v1
REST_ENDPOINT=$(echo $REST_ENDPOINT | sed -e 's/\//\\\//g')

# Wait for DB/DNS Container to Startup
# /usr/local/bin/wait-for.sh ${HOST_IP}:${DB_PORT}

# Print main informations
echo "Your IP : [34m${HOST_IP}[0m"
echo "Public IP : [34m${ADVERTISED_IP}[0m"
echo "Advertised wss/IP:PORT : [34m${ADVERTISED_IP}:${ADVERTISED_SIP_UDP_PORT}[0m"
echo "Advertised udp/IP:PORT : [34m${ADVERTISED_IP}:${ADVERTISED_SIP_UDP_PORT}[0m"
echo "Advertised tcp/IP:PORT : [34m${ADVERTISED_IP}:${ADVERTISED_SIP_TCP_PORT}[0m"
echo "Advertised tls/IP:PORT : [34m${ADVERTISED_IP}:${ADVERTISED_SIP_TLS_PORT}[0m"
echo "Advertised RTP Range : [34m${ADVERTISED_RANGE_FIRST}-${ADVERTISED_RANGE_LAST}[0"
echo "[0"

# Configure opensips.cfg
sed -i "s/{{SHM_MEM}}/${SHM_MEM}/g" /etc/default/opensips
sed -i "s/{{PKG_MEM}}/${PKG_MEM}/g" /etc/default/opensips
sed -i "s/{{HOST_IP}}/${HOST_IP}/g" /etc/opensips/opensips.cfg
sed -i "s/{{DB_HOST}}/${DB_HOST}/g" /etc/opensips/opensips.cfg
sed -i "s/{{DB_NAME}}/${DB_NAME}/g" /etc/opensips/opensips.cfg
sed -i "s/{{DB_PORT}}/${DB_PORT}/g" /etc/opensips/opensips.cfg
sed -i "s/{{DB_USER}}/${DB_USER}/g" /etc/opensips/opensips.cfg
sed -i "s/{{DB_PASS}}/${DB_PASS}/g" /etc/opensips/opensips.cfg
sed -i "s/{{ADVERTISED_IP}}/${ADVERTISED_IP}/g" /etc/opensips/opensips.cfg
sed -i "s/{{INSTANCE_NAME}}/${INSTANCE_NAME}/g" /etc/opensips/opensips.cfg
sed -i "s/{{REST_ENDPOINT}}/${REST_ENDPOINT}/g" /etc/opensips/opensips.cfg
sed -i "s/{{INSTANCE_DOMAIN}}/${INSTANCE_DOMAIN}/g" /etc/opensips/opensips.cfg
sed -i "s/{{ADVERTISED_WSS_PORT}}/${ADVERTISED_SIP_WSS_PORT}/g" /etc/opensips/opensips.cfg
sed -i "s/{{ADVERTISED_SIP_UDP_PORT}}/${ADVERTISED_SIP_UDP_PORT}/g" /etc/opensips/opensips.cfg
sed -i "s/{{ADVERTISED_SIP_TCP_PORT}}/${ADVERTISED_SIP_TCP_PORT}/g" /etc/opensips/opensips.cfg
sed -i "s/{{ADVERTISED_SIP_TLS_PORT}}/${ADVERTISED_SIP_TLS_PORT}/g" /etc/opensips/opensips.cfg

# Configure NodeUC
sed -i "s/{{HOST_IP}}/${HOST_IP}/g" /srv/nodeuc/config.json
sed -i "s/{{DB_HOST}}/${DB_HOST}/g" /srv/nodeuc/config.json
sed -i "s/{{DB_NAME}}/${DB_NAME}/g" /srv/nodeuc/config.json
sed -i "s/{{DB_PORT}}/${DB_PORT}/g" /srv/nodeuc/config.json
sed -i "s/{{DB_USER}}/${DB_USER}/g" /srv/nodeuc/config.json
sed -i "s/{{DB_PASS}}/${DB_PASS}/g" /srv/nodeuc/config.json
sed -i "s/{{ADVERTISED_SIP_UDP_PORT}}/${ADVERTISED_SIP_UDP_PORT}/g" /srv/nodeuc/config.json

# Add default binding hosts
echo "" >> /etc/hosts
echo "# Addedd by boot_run.sh script" >> /etc/hosts
echo "${HOST_IP}	voip.${INSTANCE_DOMAIN}" >> /etc/hosts

# Generate Certs if not there
if [ ! -d "/var/run/certs/" ] || [ ! -f "/var/run/certs/cert.crt" ] || [ ! -f "/var/run/certs/cert.key" ]; then
	/usr/sbin/generate-cert.sh -C ${INSTANCE_DOMAIN} -O "${INSTANCE_NAME}" -d /var/run/certs
fi

if [ ! -d "/var/run/opensips" ]; then
	/bin/mkdir -p /var/run/opensips
else
	rm -fr /var/run/opensips/opensips.pid
fi
/bin/chown -R root:root /var/run/opensips

if [ ! -d "/var/log/opensips/acc" ]; then
	/bin/mkdir -p /var/log/opensips/acc
fi
/bin/chown -R root:root /var/log/opensips

# Starting RSyslog
/etc/init.d/rsyslog start

# Starting PM2
/usr/local/bin/pm2 flush
/usr/local/bin/pm2 start /srv/nodeuc/nodeuc.js
/usr/local/bin/pm2 save

# Check for OpenSIPs Config Syntax
/sbin/opensips -c
# Starting a OpenSIPs Instance
/sbin/opensips -f /etc/opensips/opensips.cfg -P /var/run/opensips.pid -m $SHM_MEM -M $PKG_MEM

# This is a Canary Loop, if main process fails container will stay
# alive for debugging purpose. NOT FOR PRODUCTION ENVIRONMENT.
/usr/local/bin/looper.sh
