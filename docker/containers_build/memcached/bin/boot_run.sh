#!/bin/bash
# MemCached Docker bootstrap

INSTANCE_NAME=${INSTANCE_NAME:-"Imagicle S.p.A."}
INSTANCE_DOMAIN=${INSTANCE_DOMAIN:-"imagicle.com"}

MEMC=`/usr/bin/which memcached`

# Startup Memcached
$MEMC -m $MEMC_MEM -p $MEMC_PORT -u root -l $MEMC_HOST -r

# This is a Canary Loop, if main process fails container will stay
# alive for debugging purpose. NOT FOR PRODUCTION ENVIRONMENT.
/usr/local/bin/looper.sh
