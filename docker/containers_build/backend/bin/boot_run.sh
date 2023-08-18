#!/bin/bash
# Backend App Docker bootstrap

INSTANCE_NAME=${INSTANCE_DOMAIN:-"Tech Fusion ITc"}
INSTANCE_DOMAIN=${INSTANCE_DOMAIN:-"techfusion.it"}

DB_ROOT_PASS=${DB_ROOT_PASS:-"l3tMe.In*"}
DB_PASS=${DB_PASS:-"l3tMe.In*"}
DB_USER=${DB_USER:-"ecms"}
DB_NAME=${DB_NAME:-"ecms"}
DB_HOST=${DB_HOST:-"127.0.0.1"}

REDIS_PORT=${REDIS_PORT:-"6379"}
REDIS_PASS=${REDIS_PASS:-"eYVX37EwVmmxKPCDmwMtyKVge1oLd2t80"}

# Wait for DB/DNS Container to Startup
/usr/local/bin/wait-for.sh ${HOST_IP}:${DB_PORT}

# Configure LB3 Datasource
sed -i "s/{{HOST_IP}}/${HOST_IP}/g" /app/lb3app/server/datasources.json
sed -i "s/{{DB_HOST}}/${DB_HOST}/g" /app/lb3app/server/datasources.json
sed -i "s/{{DB_NAME}}/${DB_NAME}/g" /app/lb3app/server/datasources.json
sed -i "s/{{DB_PORT}}/${DB_PORT}/g" /app/lb3app/server/datasources.json
sed -i "s/{{DB_USER}}/${DB_USER}/g" /app/lb3app/server/datasources.json
sed -i "s/{{DB_PASS}}/${DB_PASS}/g" /app/lb3app/server/datasources.json

# Configure LB3 Config File
sed -i "s/{{HOST_IP}}/${HOST_IP}/g"       /app/lb3app/server/config.json
sed -i "s/{{REDIS_PORT}}/${REDIS_PORT}/g" /app/lb3app/server/config.json
sed -i "s/{{REDIS_PASS}}/${REDIS_PASS}/g" /app/lb3app/server/config.json
sed -i "s/{{HADOOP_PORT}}/${HADOOP_PORT}/g" /app/lb3app/server/config.json

# Configure LB4 Datasource
sed -i "s/{{HOST_IP}}/${HOST_IP}/g" /app/src/datasources/db.datasource.ts
sed -i "s/{{DB_HOST}}/${DB_HOST}/g" /app/src/datasources/db.datasource.ts
sed -i "s/{{DB_NAME}}/${DB_NAME}/g" /app/src/datasources/db.datasource.ts
sed -i "s/{{DB_PORT}}/${DB_PORT}/g" /app/src/datasources/db.datasource.ts
sed -i "s/{{DB_USER}}/${DB_USER}/g" /app/src/datasources/db.datasource.ts
sed -i "s/{{DB_PASS}}/${DB_PASS}/g" /app/src/datasources/db.datasource.ts

# Configure Servers Endpoints
sed -i "s/{{HOST_IP}}/${HOST_IP}/g" /app/src/server.ts
sed -i "s/{{BACKEND_HTTP_PORT}}/${TELCO_HTTP_PORT}/g" /app/src/server.ts
sed -i "s/{{HOST_IP}}/${HOST_IP}/g" /app/src/index.ts
sed -i "s/{{BACKEND_HTTP_PORT}}/${TELCO_HTTP_PORT}/g" /app/src/index.ts

# Configure STunnel Service
sed -i "s/{{HOST_IP}}/${HOST_IP}/g" /etc/stunnel/apissl.conf
sed -i "s/{{BACKEND_HTTP_PORT}}/${BACKEND_HTTP_PORT}/g" /etc/stunnel/apissl.conf
sed -i "s/{{BACKEND_HTTPS_PORT}}/${BACKEND_HTTPS_PORT}/g" /etc/stunnel/apissl.conf

# Add default binding hosts
echo "" >> /etc/hosts
echo "# Addedd by boot_run.sh script" >> /etc/hosts
echo "${HOST_IP}	voip.${INSTANCE_DOMAIN}" >> /etc/hosts

# Install Dependencies
cd /app && npm install

# Compile App
cd /app && npm run rebuild

# Start App With PM2
/usr/local/bin/pm2 flush
cd /app && npm run pm2start

# Startup Stunnel
/etc/init.d/stunnel4 restart

# This is a Canary Loop, if main process fails container will stay
# alive for debugging purpose. NOT FOR PRODUCTION ENVIRONMENT.
/usr/local/bin/looper.sh
