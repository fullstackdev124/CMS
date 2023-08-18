#!/bin/bash
#
# Phone Restart
# opensipsctl fifo t_uac_dlg NOTIFY sip:3864@10.0.20.52 . . '"From: <sip:3864@voip.proxy.com>;tag=8755a8d01a12f7e\r\nTo: <sip:3864@voip.proxy.com>\r\nEvent: check-sync\r\n"'
#
# MWI On/Off
# opensipsctl fifo t_uac_dlg NOTIFY sip:299@voip.proxy.ca . . '"To: <sip:299@voip.proxy.ca>\r\nFrom: <sip:299@voip.proxy.ca>;tag=e17f5bec0b4bfb0bd\r\nEvent: message-summary\r\nContent-Type: application/simple-message-summary\r\nExpires: 3600\r\n"' '"Messages-Waiting: yes\r\nMessage-Account: sip:*97@voip.proxy.ca\r\nVoice-Message: 2/0 (0/0)\r\n"'
# opensipsctl fifo t_uac_dlg NOTIFY sip:235@voip.proxy.ca . . '"To: <sip:299@voip.proxy.ca>\r\nFrom: <sip:299@voip.proxy.ca>;tag=e17f5bec0b4bfb0bac22d\r\nEvent: message-summary\r\nContent-Type: application/simple-message-summary\r\nExpires: 3600\r\n"' '"Messages-Waiting: no\r\nMessage-Account: sip:*97@voip.proxy.ca\r\nVoice-Message: 0/0 (0/0)\r\n"'
# opensipsctl fifo pua_publish sip:7402@voip.proxy.ca 3600 message-summary application/simple-message-summary . . '"Messages-Waiting: yes\r\nMessage-Account: sip:*97@voip.proxy.ca\r\nVoice-Message: 1/0 (0/0)\r\n\r\n"'
# opensipsctl fifo pua_publish sip:7402@voip.proxy.ca 3600 message-summary application/simple-message-summary . . '"Messages-Waiting: no\r\nMessage-Account: sip:*97@voip.proxy.ca\r\nVoice-Message: 0/0 (0/0)\r\n\r\n"'
#
# SIP REFER
# opensipsctl fifo t_uac_dlg REFER sip:7329@10.10.0.141 . . '"From: <7329@voip.proxy.ca>;tag=123456789\r\nTo: <sip:7329@voip.proxy.ca>\r\nRefer-To: <sip:5553312244@voip.proxy.ca>\r\nRefer-Sub: false\r\n"'
#
# Presence State
# "<?xml version='1.0' encoding='UTF-8' standalone='no' ?><presence xmlns='urn:ietf:params:xml:ns:pidf' entity='sip:7400@192.168.150.243' xmlns:e='urn:ietf:params:xml:ns:pidf:status:rpid' xmlns:dm='urn:ietf:params:xml:ns:pidf:data-model' xmlns:ce='urn:cisco:params:xml:ns:pidf:rpid' xmlns:sc='urn:ietf:params:xml:ns:pidf:servcaps'><dm:person><status><basic>open</basic></status><e:activities></e:activities></dm:person><tuple id='cmp-1-1205295'><status><basic>open</basic></status><sc:servcaps><sc:audio>true</sc:audio></sc:servcaps><contact priority='0.8'>sip:7400@192.168.150.243:5060</contact><timestamp>2021-05-18T11:<F3>05:11Z</timestamp></tuple><F3></presence>"
# opensipsctl fifo pua_publish sip:7400@192.168.150.243 3600 presence application/pidf+xml . . "<?xml version='1.0' encoding='UTF-8' standalone='no' ?><presence xmlns='urn:ietf:params:xml:ns:pidf' entity='sip:*127400@192.168.150.243' xmlns:e='urn:ietf:params:xml:ns:pidf:status:rpid' xmlns:dm='urn:ietf:params:xml:ns:pidf:data-model' xmlns:ce='urn:cisco:params:xml:ns:pidf:rpid' xmlns:sc='urn:ietf:params:xml:ns:pidf:servcaps'><dm:person><status><basic>open</basic></status><e:activities></e:activities></dm:person><tuple id='cmp-1-1205294'><status><basic>closed</basic></status><sc:servcaps><sc:audio>true</sc:audio></sc:servcaps><contact priority='0.8'>sip:*127400@192.168.150.243</contact><timestamp>2021-05-20T12:25:11Z</timestamp></tuple></presence>"
# opensipsctl fifo t_uac_dlg NOTIFY sip:7400@192.168.150.243 . . "Event: presence\r\nContent-Type: application/pidf+xml\r\n" "<?xml version='1.0' encoding='UTF-8' standalone='no' ?><presence xmlns='urn:ietf:params:xml:ns:pidf' entity='sip:*127400@192.168.150.243' xmlns:e='urn:ietf:params:xml:ns:pidf:status:rpid' xmlns:dm='urn:ietf:params:xml:ns:pidf:data-model' xmlns:ce='urn:cisco:params:xml:ns:pidf:rpid' xmlns:sc='urn:ietf:params:xml:ns:pidf:servcaps'><dm:person><status><basic>open</basic></status><e:activities></e:activities></dm:person><tuple id='cmp-1-1205294'><status><basic>closed</basic></status><sc:servcaps><sc:audio>true</sc:audio></sc:servcaps><contact priority='0.8'>sip:*127400@192.168.150.243</contact><timestamp>2021-05-20T12:25:11Z</timestamp></tuple></presence>"

while getopts e:s:f: flag
do
    case "${flag}" in
        e) entity=${OPTARG};;
	s) state=${OPTARG};;
	*)
		echo "Usage: $0 -e <entity> -s <entity_state>" >&2
		exit 1
    esac
done

if [ -z "$entity" ]; then
	echo 'Entity parameter (-e) needed' >&2
	exit 1
fi

regex='sips?:[-A-Za-z0-9\+\*&@#%?=~_|!:,.;]*[-A-Za-z0-9\+\*&@#%=~_|]'
if [[ ! $entity =~ $regex ]]; then
	echo "Entity should to be in the format <proto>:[user@]<domain or ip>[:port] (e.g.: sip:*127400@@192.168.4.121)" >&2
	exit 1
fi

if [ -z "$state" ]; then
	echo 'State parameter (-s) needed' >&2
	exit 1
fi

regex='(closed?|open)'
if [[ ! $state =~ $regex ]]; then
	echo "State can have following values: open, closed, close"
	exit 1
fi

/sbin/opensipsctl fifo pua_publish "${entity}" 3600 presence "application/pidf+xml" . . "<?xml version='1.0'?><presence xmlns='urn:ietf:params:xml:ns:pidf' xmlns:dm='urn:ietf:params:xml:ns:pidf:data-model' xmlns:rpid='urn:ietf:params:xml:ns:pidf:rpid' xmlns:c='urn:ietf:params:xml:ns:pidf:cipid' entity='${entity}'><tuple id='0x7ffe29a21700'><status><basic>${state}</basic></status></tuple></presence>"

