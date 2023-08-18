#!/bin/bash
# RTPProxy Docker bootstrap
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

TELCO_HTTP_PORT=${TELCO_HTTP_PORT:-"9080"}
RTPPROXY_CTRL_PORT=${RTPPROXY_CTRL_PORT:-"22222"}

# Print main informations
echo "Your IP : [34m${HOST_IP}[0m"
echo "Public IP : [34m${ADVERTISED_IP}[0m"
echo "Advertised wss/IP:PORT : [34m${ADVERTISED_IP}:${ADVERTISED_SIP_UDP_PORT}[0m"
echo "Advertised udp/IP:PORT : [34m${ADVERTISED_IP}:${ADVERTISED_SIP_UDP_PORT}[0m"
echo "Advertised tcp/IP:PORT : [34m${ADVERTISED_IP}:${ADVERTISED_SIP_TCP_PORT}[0m"
echo "Advertised tls/IP:PORT : [34m${ADVERTISED_IP}:${ADVERTISED_SIP_TLS_PORT}[0m"
echo "Advertised RTP Range : [34m${ADVERTISED_RANGE_FIRST}-${ADVERTISED_RANGE_LAST}[0"
echo "[0"

# Configure RTPProxy
sed -i "s/{{HOST_IP}}/${HOST_IP}/g" /etc/default/rtpproxy
sed -i "s/{{INSTANCE_DOMAIN}}/${INSTANCE_DOMAIN}/g" /etc/default/rtpproxy
sed -i "s/{{RTPPROXY_CTRL_PORT}}/${RTPPROXY_CTRL_PORT}/g" /etc/default/rtpproxy

# Configure CDREngine
sed -i "s/{{HOST_IP}}/${HOST_IP}/g" /usr/local/CDREngine/config/cdrengine.conf
sed -i "s/{{DB_USER}}/${DB_USER}/g" /usr/local/CDREngine/config/cdrengine.conf
sed -i "s/{{DB_PASS}}/${DB_PASS}/g" /usr/local/CDREngine/config/cdrengine.conf
sed -i "s/{{TELCO_HTTP_PORT}}/${TELCO_HTTP_PORT}/g" /usr/local/CDREngine/config/cdrengine.conf

# Add default binding hosts
echo "" >> /etc/hosts
echo "# Addedd by boot_run.sh script" >> /etc/hosts
echo "${HOST_IP}	voip.${INSTANCE_DOMAIN}" >> /etc/hosts

# Preparing RTPProxy Environment
if [ ! -d "/var/spool/rtpproxy/recording" ]; then
	mkdir -p /var/spool/rtpproxy/recording
fi

if [ ! -d "/var/spool/rtpproxy/spool" ]; then
	mkdir -p /var/spool/rtpproxy/spool
fi

# Preparing InCron Environment
echo "root" > /etc/incron.allow
/usr/bin/incrontab /etc/incron-import.cfg

# Starting RTPProxy process
/bin/chmod +x /etc/init.d/rtpproxy
/etc/init.d/rtpproxy start

# Starting CDREngine process
/etc/init.d/CDREngine start

# Starting InCron Daemon
/etc/init.d/incron start

# This is a Canary Loop, if main process fails container will stay
# alive for debugging purpose. NOT FOR PRODUCTION ENVIRONMENT.
/usr/local/bin/looper.sh
