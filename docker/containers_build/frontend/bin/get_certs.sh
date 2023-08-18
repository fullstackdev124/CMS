#!/bin/bash

# Wait for nginx to be up and running
sleep 5

# Retrieve or renew certificate
/usr/bin/certbot certonly --agree-tos -n -d "$LETS_DOMAIN" --webroot -w /usr/share/nginx/certbot/ -m "$LETS_EMAIL"
/bin/cp "/etc/letsencrypt/live/$LETS_DOMAIN/privkey.pem" "/var/run/certs/cert.key"
/bin/cp "/etc/letsencrypt/live/$LETS_DOMAIN/fullchain.pem" "/var/run/certs/cert.crt"

# Rewake nginx
/usr/bin/pkill -HUP nginx
