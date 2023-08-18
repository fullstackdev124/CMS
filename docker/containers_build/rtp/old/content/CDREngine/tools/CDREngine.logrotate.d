/var/log/CDREngine/*.log {
       copytruncate
       daily
       rotate 7
       delaycompress
       compress
       notifempty
       missingok
}
