#!/bin/bash

# Start Crontab
/etc/init.d/cron start

# SyslogNG Docker bootstrap
/etc/init.d/syslog-ng start

# This is a Canary Loop, if main process fails container will stay
# alive for debugging purpose. NOT FOR PRODUCTION ENVIRONMENT.
/usr/local/bin/looper.sh
