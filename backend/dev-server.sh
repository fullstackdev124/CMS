#!/bin/bash
nodepids=$(netstat -plutan | grep LISTEN | grep 3002 | awk '{ print $7 }' | cut -d '/' -f1)

for nodepid in ${nodepids[@]}; do
	echo "Stopping PID :"$nodepid
	kill -9 $nodepid
done

while [ true ]; do
	echo "Restarting dev server ..."
	npm run debug
	sleep 1;
done
