#!/bin/bash
# Frontend App Docker bootstrap

INSTANCE_NAME=${INSTANCE_DOMAIN:-"Tech Fusion ITc"}
INSTANCE_DOMAIN=${INSTANCE_DOMAIN:-"techfusion.it"}

if [ ! -d "/var/log/nginx" ]; then
	/bin/mkdir -p /var/log/nginx 
	/bin/ln -sf /dev/stderr /var/log/nginx/error.log 
	/bin/ln -sf /dev/stdout /var/log/nginx/access.log
fi

# Retrieve or renew certificate
/usr/local/bin/get_certs.sh &

# Starts nginx foregrounded
/usr/sbin/nginx -g "daemon off;"
 
# This is a Canary Loop, if main process fails container will stay
# alive for debugging purpose. NOT FOR PRODUCTION ENVIRONMENT.
/usr/local/bin/looper.sh
