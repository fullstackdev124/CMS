export interface IZabbixNode {
	hostid: string; // "10084",
	proxy_hostid: string; // "0",
	host: string; // "Zabbix server",
	status: string; // "0",
	disable_until: string; // "0",
	error: string; // "",
	available: string; // "1",
	errors_from: string; // "0",
	lastaccess: string; // "0",
	ipmi_authtype: string; // "-1",
	ipmi_privilege: string; // "2",
	ipmi_username: string; // "",
	ipmi_password: string; // "",
	ipmi_disable_until: string; // "0",
	ipmi_available: string; // "0",
	snmp_disable_until: string; // "0",
	snmp_available: string; // "0",
	maintenanceid: string; // "0",
	maintenance_status: string; // "0",
	maintenance_type: string; // "0",
	maintenance_from: string; // "0",
	ipmi_errors_from: string; // "0",
	snmp_errors_from: string; // "0",
	ipmi_error: string; // "",
	snmp_error: string; // "",
	jmx_disable_until: string; // "0",
	jmx_available: string; // "0",
	jmx_errors_from: string; // "0",
	jmx_error: string; // "",
	name: string; // "Zabbix server",
	flags: string; // "0",
	templateid: string; // "0",
	description: string; // "",
	tls_connect: string; // "1",
	tls_accept: string; // "1",
	tls_issuer: string; // "",
	tls_subject: string; // "",
	tls_psk_identity: string; // "",
	tls_psk: string; // "",
	proxy_address: string; // "",
	auto_compress: string; // "1"
}

export interface IZabbixAlert {
	eventid: string;
	source: number;
	object: number;
	objectid: string;
	clock: number;
	ns: number;
	r_eventid: number;
	r_clock: number;
	r_ns: number;
	correlationid: number;
	userid: number;
	name: string;
	acknowledged: number;
	severity: number;
	suppressed: number;
}
