CREATE DATABASE IF NOT EXISTS `bigdata`;
USE `bigdata`;

CREATE TABLE `hostnames` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `request_ip` varchar(45) DEFAULT NULL,
  `hostnames` varchar(400) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `index2` (`request_ip`)
) ENGINE=InnoDB 
;

CREATE TABLE `rpt_call_log_activity1` (
  `id` varchar(200) NOT NULL,
  `call_date` varchar(15) DEFAULT NULL,
  `hostname` varchar(20) DEFAULT NULL,
  `customerid` int(11) DEFAULT NULL,
  `cid` int(11) DEFAULT '0',
  `name` varchar(512) DEFAULT NULL,
  `total_calls` bigint(21) NOT NULL DEFAULT '0',
  `total_time` decimal(32,0) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `index1` (`call_date`),
  KEY `index2` (`call_date`,`hostname`,`customerid`,`name`)
) ENGINE=InnoDB
;

 CREATE TABLE `rpt_call_log_activity2` (
  `id` varchar(200) NOT NULL,
  `call_date` bigint(20) DEFAULT NULL,
  `hostname` varchar(20) DEFAULT NULL,
  `customerid` int(11) DEFAULT NULL,
  `name` varchar(100) DEFAULT NULL,
  `cid` int(11) DEFAULT '0',
  `contact_number` varchar(20) DEFAULT NULL,
  `total_calls` bigint(21) NOT NULL DEFAULT '0',
  `total_time` bigint(21) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `index1` (`call_date`),
  KEY `index2` (`call_date`,`hostname`,`customerid`,`name`,`contact_number`)
) ENGINE=InnoDB
;

 CREATE TABLE `rpt_call_log_hourly_count` (
  `id` varchar(200) NOT NULL,
  `call_date` varchar(15) DEFAULT NULL,
  `hostname` varchar(20) DEFAULT NULL,
  `total_calls` bigint(21) NOT NULL DEFAULT '0',
  `total_time` decimal(32,0) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `index1` (`call_date`),
  KEY `index2` (`call_date`,`hostname`)
) ENGINE=InnoDB
;

 CREATE TABLE `rpt_call_log_status` (
  `id` varchar(200) NOT NULL,
  `call_date` varchar(15) DEFAULT NULL,
  `hostname` varchar(20) DEFAULT NULL,
  `customerid` int(11) DEFAULT NULL,
  `call_status` varchar(20) DEFAULT NULL,
  `total_calls` bigint(21) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `index1` (`call_date`),
  KEY `index2` (`call_date`,`hostname`,`customerid`)
) ENGINE=InnoDB
;

set global log_bin_trust_function_creators=1;
use bigdata;
delimiter //
CREATE FUNCTION `fn_getday`(iDate int,iOffset int) RETURNS char(5) 
begin
  declare cReturn  char(5);
  declare dd datetime;
  set dd = str_to_date(convert(iDate,char(10)),'%Y%m%d%H');
  set dd = date_add(dd, interval iOffset hour );
  set cReturn =  date_format(dd,'%m-%d');
  return cReturn;
END //

CREATE FUNCTION `fn_gethour`(iDate int,iOffset int) RETURNS int(11)
begin
  declare iReturn  int;
  declare dd datetime;
  set dd = str_to_date(convert(iDate,char(10)),'%Y%m%d%H');
  set dd = date_add(dd, interval iOffset hour );
  set iReturn =  convert(date_format(dd,'%H'),UNSIGNED INTEGER);
  return iReturn;
END //


CREATE FUNCTION `fn_getintmonday`(iDate int,iOffset int) RETURNS int(11)
begin
  declare iReturn  int;
  declare dd datetime;
  set iDate = fn_intdate(iDate,iOffset);
  set dd = str_to_date(convert(iDate,char(10)),'%Y%m%d%H');
  set dd = subdate(dd,if(date_format(dd,'%w')=0,7,date_format(dd,'%w'))-1);
  set iReturn =  convert(date_format(dd,'%Y%m%d'),UNSIGNED INTEGER);
  return iReturn;
END //

CREATE FUNCTION `fn_intdate`(iDate int,iOffset int) RETURNS int(11)
begin
  declare iReturn  int;
  declare dd datetime;
  set dd = str_to_date(convert(iDate,char(10)),'%Y%m%d%H');
  set dd = date_add(dd, interval iOffset hour );
  set iReturn =  convert(date_format(dd,'%Y%m%d%H'),UNSIGNED INTEGER);
  return iReturn;
END //
delimiter ;

create user 'bigdata'@'*' identified by 'RkHado@p202!!';
GRANT SELECT ON bigdata.* TO 'bigdata'@'localhost' WITH GRANT OPTION;
FLUSH PRIVILEGES;


