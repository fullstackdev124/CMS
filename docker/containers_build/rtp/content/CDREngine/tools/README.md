# recording-push.pl script
This file should be pointed by an asynchronous software like incrontab (inotify) that will monitor
recording directory (/var/spool/rtpproxy/recording) and pass new recording file for processing.

Es.:
	root@metrics1:/usr/local/CDREngine/tools# incrontab -l

	# 0 is for RTPEngine
	# 0 IN_CLOSE_WRITE /usr/local/CDREngine/tools/recording-push.pl $@/$# $#
	/var/spool/rtpproxy/recording IN_MOVED_TO /usr/local/CDREngine/tools/recording-push.pl $@/$# $#

For detailed INotify suite usage refer to maintainer [documentation](http://inotify.aiken.cz/)

# Logrotate file
Remember to add CDREngine.logrotate.d to /etc/logrodate.d folder

# Old recording purge
Add following line to root crontab to avoid stored recording to grow up

	# Remove stored recordings older than 5 days
	00 00 * * * /usr/bin/find /var/spool/rtpproxy/recording/* -mtime +5 -exec rm {} \;
