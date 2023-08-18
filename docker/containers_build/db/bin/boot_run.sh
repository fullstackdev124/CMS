#!/bin/bash
# MySQL Docker bootstrap

INSTANCE_NAME=${INSTANCE_DOMAIN:-"Tech Fusion ITc"}
INSTANCE_DOMAIN=${INSTANCE_DOMAIN:-"techfusion.it"}

# Calcola i parametri di rete necessari
LS=`/usr/bin/which ls`
RM=`/usr/bin/which rm`
TR=`/usr/bin/which tr`
WC=`/usr/bin/which wc`
AWK=`/usr/bin/which awk`
CUT=`/usr/bin/which cut`
SED=`/usr/bin/which sed`
FIND=`/usr/bin/which find`
GREP=`/usr/bin/which grep`
ECHO=`/usr/bin/which echo`
SORT=`/usr/bin/which sort`
CHOWN=`/usr/bin/which chown`
EGREP=`/usr/bin/which egrep`
MKDIR=`/usr/bin/which mkdir`
MYSQL=`/usr/bin/which mysql`
TOUCH=`/usr/bin/which touch`
MYSQLD=`/usr/bin/which mysqld`
SUPRV=`/usr/bin/which supervisord`

# Add default binding hosts
echo "" >> /etc/hosts
echo "# Addedd by boot_run.sh script" >> /etc/hosts
IPS=`$AWK '/32 host/ { print i } {i=$2}' /proc/net/fib_trie | $SORT -u | $EGREP -v 127.0.0.1`
for IP in $IPS;
do
	echo "$IP	voip.${INSTANCE_DOMAIN}" >> /etc/hosts
done

# Generate Certs if not there
if [ ! -d "/var/run/certs/" ] || [ ! -f "/var/run/certs/cert.crt" ] || [ ! -f "/var/run/certs/cert.key" ]; then
        /usr/sbin/generate-cert.sh -C ${INSTANCE_DOMAIN} -O "${INSTANCE_NAME}" -d /var/run/certs
fi

# Reconfigure DB Daemon
DB_SERVERID=`echo $HOST_IP | sed 's/\.//g'`
$FIND /etc/mysql -type f -name "*" -exec $SED -i'' -e "s/{{HOST_IP}}/$HOST_IP/g" {} +
$FIND /etc/mysql -type f -name "*" -exec $SED -i'' -e "s/{{DB_PORT}}/$DB_PORT/g" {} +
$FIND /etc/mysql -type f -name "*" -exec $SED -i'' -e "s/{{DB_SERVERID}}/$DB_SERVERID/g" {} +

## Start Supervised Daemons
$SUPRV -l /var/log/supervisor/startup.$$.log -y 10000000 -z 3 -e error
echo "Waiting for DB Daemon startup at 127.0.0.1:$DB_PORT"

## Wait for Db Container to Startup
/usr/local/bin/wait-for.sh 127.0.0.1:$DB_PORT -t 3600

## LOG File
LFILE="/tmp/schema_install.$$.log"

# MySQL Config AUTH -- With Startup Password
MYSQL_AUTH="-uroot -proot"
if [ -f "/var/lib/mysql/initialized" ]; then
	MYSQL_AUTH="-uroot -p$DB_ROOT_PASS"
fi

# Check for Database Existance
echo "Checking for database existance!"
DATABASES=`$MYSQL $MYSQL_AUTH -h localhost -e "SHOW DATABASES\G;" | $GREP 'Database:' | $CUT -d' ' -f2 | $TR '\n' '|'` >> $LFILE 2>&1
if [ -z "$DATABASES" ]; then
	echo "Env already initialized ($DATABASES), using password ..."
	MYSQL_AUTH="-uroot -p${DB_ROOT_PASS}"
	DATABASES=`$MYSQL $MYSQL_AUTH -h localhost -e "SHOW DATABASES\G;" | $GREP 'Database:' | $CUT -d' ' -f2 | $TR '\n' '|'` >> $LFILE 2>&1
fi
echo "Databases found: $DATABASES"

INITIALIZED=0

if [[ "$DATABASES" == *"ecms"* ]]; then
	echo "eCMS DB already exists!";
else
	echo -n "Creating eCMS database ...";
	# $SED -i "s/{{INSTANCE_DOMAIN}}/$INSTANCE_DOMAIN/g" /root/schemas/ecms.sql
	$MYSQL $MYSQL_AUTH -h localhost < /root/schemas/ecms.sql >> $LFILE 2>&1
	INITIALIZED=1
	echo " done.";
fi

if [[ "$DATABASES" == *"opensips"* ]]; then
	echo "CoreSIP OpenSIPs DB already exists!";
else
	echo -n "Creating OpenSIPs database ...";
	$MYSQL $MYSQL_AUTH -h localhost < /root/schemas/opensips.sql >> $LFILE 2>&1
	echo " done.";
fi

if [[ "$DATABASES" == *"bigdata"* ]]; then
	echo "BigData DB already exists!";
else
	echo -n "Creating BigData database ...";
	$MYSQL $MYSQL_AUTH -h localhost < /root/schemas/bigdata.sql >> $LFILE 2>&1
	echo " done.";
fi

# Adding default users
if [ $INITIALIZED -eq 1 ]; then
	echo -n "Updating DB Privileges ... ";

	# Domains based entry ... this needs to be tuned up!
	$ECHO "CREATE USER '$DB_USER'@'%.$INSTANCE_DOMAIN' IDENTIFIED WITH mysql_native_password BY '$DB_PASS'" | $MYSQL $MYSQL_AUTH -h localhost >> $LFILE 2>&1
	$ECHO "CREATE USER 'root'@'%' IDENTIFIED WITH mysql_native_password BY '$DB_ROOT_PASS'" | $MYSQL $MYSQL_AUTH -h localhost >> $LFILE 2>&1
	$ECHO "CREATE USER '$DB_USER'@'%' IDENTIFIED WITH mysql_native_password BY '$DB_PASS'" | $MYSQL $MYSQL_AUTH -h localhost >> $LFILE 2>&1
	$ECHO "GRANT ALL PRIVILEGES ON *.* TO '$DB_USER'@'%.$INSTANCE_DOMAIN'" | $MYSQL $MYSQL_AUTH -h localhost >> $LFILE 2>&1
	$ECHO "GRANT ALL PRIVILEGES ON *.* TO '$DB_USER'@'%'" | $MYSQL $MYSQL_AUTH -h localhost >> $LFILE 2>&1
	$ECHO "GRANT ALL PRIVILEGES ON *.* TO 'root'@'%'" | $MYSQL $MYSQL_AUTH -h localhost >> $LFILE 2>&1

	# Replica grants
	DB_REPL_USER=${DB_REPL_USER:-"replicator"}
	DB_REPL_PASS=${DB_REPL_PASS:-"l3tMe.Sync"}
	$ECHO "CREATE USER '$DB_REPL_USER'@'%' IDENTIFIED WITH mysql_native_password BY '$DB_REPL_PASS'" | $MYSQL $MYSQL_AUTH -h localhost >> $LFILE 2>&1
	$ECHO "GRANT REPLICATION SLAVE ON *.* TO '$DB_REPL_USER'@'%'" | $MYSQL $MYSQL_AUTH -h localhost >> $LFILE 2>&1

	# A partire dalla versione 5.7 l'utente root@localhost usa il plugin auth_socket:
	# rollback sulla mysql_native_password authentication
	$ECHO "ALTER USER '$DB_USER'@'%' IDENTIFIED WITH mysql_native_password BY '$DB_PASS'" | $MYSQL $MYSQL_AUTH -h localhost >> $LFILE 2>&1
	$ECHO "ALTER USER 'root'@'%' IDENTIFIED WITH mysql_native_password BY '$DB_ROOT_PASS'" | $MYSQL $MYSQL_AUTH -h localhost >> $LFILE 2>&1
	$ECHO "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '$DB_ROOT_PASS'" | $MYSQL $MYSQL_AUTH -h localhost >> $LFILE 2>&1

	$ECHO "FLUSH PRIVILEGES;" | $MYSQL $MYSQL_AUTH -h localhost >> $LFILE 2>&1

	# Set environment as initialized
	$ECHO "1" > /var/lib/mysql/initialized
	echo " done.";
else
	echo "!!Updating DB privileges not needed!!";
fi

echo "Database container configuration ended!";

# This is a Canary Loop, if main process fails container will stay
# alive for debugging purpose. NOT FOR PRODUCTION ENVIRONMENT.
/usr/local/bin/looper.sh
