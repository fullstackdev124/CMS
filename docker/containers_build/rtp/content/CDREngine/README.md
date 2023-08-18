# CDREngine Software
CDREngine software actively listen to OpenSIPs accounting log file for new records, parse them and store them in 
a database table. Before start it be careful to setup configuration file according to your needs

Same software is also deployed for listening in a folder where CDR files get dynamically created (just like FreeSBC).

CDREngine is built using perl interpreted language and is auto consistent: **<root_folder>/CDREngine** should contains
all needed libraries (it strictly depends by target operative system).

To configure CDREngine will be enough correctly compiling configuration file below:

##### config/cdrengine.conf
	{
		# Database reference where store CDR parsed records
		"db": {
			"type": "mysql",
			"user": "root",
			"pass": "l3tMe.In",
			"dbnm": "opensips",
			"host": "localhost"
		},
		# File (or folder) where listen for incoming CDR records 
		"accounting": {
			"source_file": "/var/log/opensips/opensips-acc.log"
		},
		# An array containing all destinations of RESTful services that will receive parsed cdr
		# records by CDREngine (usually dash-ws-srv backend). Upload URIs are exclusive (get 
		# sequentially tested): CDR records are dispatched only to the first answering 
		# destination
		"upload_uris": [
			"http://lab.techfusion.it:3001/api/v1/CallLogs/raw_cdr_record",
		#	"http://test1.techfusion.it:3001/api/v1/CallLogs/raw_cdr_record",
		#	"http://test2.techfusion.it:3001/api/v1/CallLogs/raw_cdr_record"
		],
		# An arrau containing all destination of RESTful services that will receive parsed cdr
		# in order to backup them (mirror hosts). Replication URIs are inclusive (get 
		# sequentially tested): CDR records are dispatched to all answering
		# destinations
		"replication_uris": [
		#	"http://backup.techfusion.it:3001/api/v1/CallLogs/raw_cdr_record"
		],
		# This is a debug file to track down all CDREngine operation
		"system": {
			"debug_log": "/var/log/CDREngine/mmonitor_accounting.log"
		}
	}

**cdrengine.conf** is a json syntax driven file that supports comments by using **#** character

## Init file
To let CDREngine automatically starts, you can copy file in **init.d/** local folder to /etc/init.d system folder
and enabling it according to your OS specs.

___Before starting CDREngine please install tools inside **tools/** folder (refer to related [README](tools/README.md) file).___
