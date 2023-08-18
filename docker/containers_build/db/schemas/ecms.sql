-- MySQL dump 10.13  Distrib 5.7.37, for Linux (x86_64)
--
-- Host: localhost    Database: ecms
-- ------------------------------------------------------
-- Server version	8.0.28

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Temporary table structure for view `ACL`
--

DROP TABLE IF EXISTS `ACL`;
/*!50001 DROP VIEW IF EXISTS `ACL`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `ACL` AS SELECT
 1 AS `id`,
 1 AS `model`,
 1 AS `property`,
 1 AS `accessType`,
 1 AS `permission`,
 1 AS `principalType`,
 1 AS `principalId`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `ACL_template`
--

DROP TABLE IF EXISTS `ACL_template`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ACL_template` (
  `id` int NOT NULL AUTO_INCREMENT,
  `roleName` enum('admin','operator','viewer','$everyone','$authenticated','$unauthenticated','$owner','*') NOT NULL,
  `model` varchar(512) DEFAULT NULL,
  `property` varchar(512) DEFAULT NULL,
  `accessType` varchar(512) DEFAULT NULL,
  `permission` varchar(512) DEFAULT 'ALLOW',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ACL_template`
--

LOCK TABLES `ACL_template` WRITE;
/*!40000 ALTER TABLE `ACL_template` DISABLE KEYS */;
INSERT INTO `ACL_template` VALUES (1,'$authenticated','Customer','*','READ','ALLOW'),(2,'$authenticated','Workflow','*','READ','ALLOW'),(3,'$authenticated','Ticket','*','*','ALLOW'),(4,'$authenticated','Version','*','*','ALLOW'),(5,'$everyone','DashUser','login','*','ALLOW'),(6,'admin','DashUser','*','*','ALLOW'),(7,'operator','DashUser','*','READ','ALLOW'),(8,'admin','Group','*','*','ALLOW'),(9,'operator','Group','*','READ','ALLOW'),(10,'admin','Notification','*','*','ALLOW'),(11,'operator','Notification','*','READ','ALLOW'),(12,'viewer','DashUser','*','*','DENY'),(13,'viewer','Group','*','*','DENY'),(14,'$everyone','Notification','*','*','DENY');
/*!40000 ALTER TABLE `ACL_template` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `AccessToken`
--

DROP TABLE IF EXISTS `AccessToken`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `AccessToken` (
  `id` varchar(255) NOT NULL,
  `ttl` int DEFAULT '86400',
  `scopes` text,
  `srcip` varchar(255) NOT NULL DEFAULT '127.0.0.1',
  `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires` datetime GENERATED ALWAYS AS ((`created` + interval `ttl` second)) STORED,
  `userId` int NOT NULL DEFAULT '-1',
  PRIMARY KEY (`id`),
  KEY `fk_AccessToken_ECMSUser1_idx` (`userId`) USING BTREE,
  CONSTRAINT `fk_AccessToken_ECMSUser1` FOREIGN KEY (`userId`) REFERENCES `User` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `AccessToken`
--

LOCK TABLES `AccessToken` WRITE;
/*!40000 ALTER TABLE `AccessToken` DISABLE KEYS */;
/*!40000 ALTER TABLE `AccessToken` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Role`
--

DROP TABLE IF EXISTS `Role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Role` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(512) NOT NULL,
  `customerId` int DEFAULT NULL,
  `description` varchar(512) DEFAULT NULL,
  `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modified` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `customerId` (`customerId`),
  CONSTRAINT `Role_ibfk_1` FOREIGN KEY (`customerId`) REFERENCES `customer` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Role`
--

LOCK TABLES `Role` WRITE;
/*!40000 ALTER TABLE `Role` DISABLE KEYS */;
INSERT INTO `Role` VALUES (1,'Administrator',1,'Manages all aspects of an account',NOW(),NULL),(2,'Admin',1,'Company Admin',NOW(),NOW()),(3,'User',1,'Normal User',NOW(),NOW());
/*!40000 ALTER TABLE `Role` ENABLE KEYS */;
UNLOCK TABLES;

/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `call_create_admin_role_mapping` AFTER INSERT ON `Role` FOR EACH ROW BEGIN IF NEW.name LIKE 'admin%' THEN call create_admin_role_mapping(NEW.id); END IF; END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `RoleMapping`
--

DROP TABLE IF EXISTS `RoleMapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `RoleMapping` (
  `id` int NOT NULL AUTO_INCREMENT,
  `principalId` int NOT NULL DEFAULT '1',
  `principalType` varchar(512) DEFAULT NULL,
  `customerId` int DEFAULT NULL,
  `roleId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `principalId` (`customerId`),
  KEY `fk_RoleMapping_Role1_idx` (`roleId`),
  KEY `fk_User_Role1` (`principalId`),
  CONSTRAINT `fk_Customer_Role1` FOREIGN KEY (`customerId`) REFERENCES `customer` (`id`),
  CONSTRAINT `fk_RoleMapping_Role1` FOREIGN KEY (`roleId`) REFERENCES `Role` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_User_Role1` FOREIGN KEY (`principalId`) REFERENCES `User` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `RoleMapping`
--

LOCK TABLES `RoleMapping` WRITE;
/*!40000 ALTER TABLE `RoleMapping` DISABLE KEYS */;
INSERT INTO `RoleMapping` VALUES (1,1,'ADMINISTRATOR',NULL,1);
/*!40000 ALTER TABLE `RoleMapping` ENABLE KEYS */;
UNLOCK TABLES;

/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `create_defaultsubs_ticket` AFTER INSERT ON `RoleMapping` FOR EACH ROW BEGIN
IF (NEW.principalType = 'USER') THEN
	IF EXISTS (SELECT * FROM Role r WHERE r.id = NEW.roleId AND r.description NOT LIKE "Customer%")
	THEN call add_subch_subscription("ticket","default",NEW.principalId);
	END IF;
END IF;

END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Temporary table structure for view `RoleMapping_R2R`
--

DROP TABLE IF EXISTS `RoleMapping_R2R`;
/*!50001 DROP VIEW IF EXISTS `RoleMapping_R2R`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `RoleMapping_R2R` AS SELECT
 1 AS `id`,
 1 AS `principalType`,
 1 AS `principalId`,
 1 AS `roleId`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary table structure for view `RoleMapping_U2R`
--

DROP TABLE IF EXISTS `RoleMapping_U2R`;
/*!50001 DROP VIEW IF EXISTS `RoleMapping_U2R`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `RoleMapping_U2R` AS SELECT
 1 AS `id`,
 1 AS `principalType`,
 1 AS `principalId`,
 1 AS `roleId`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `User`
--

DROP TABLE IF EXISTS `User`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `User` (
  `id` int NOT NULL AUTO_INCREMENT,
  `activated` tinyint NOT NULL DEFAULT '1',
  `username` varchar(255) NOT NULL,
  `password` varchar(32) NOT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `email` varchar(512) DEFAULT NULL,
  `emailVerified` tinyint(1) NOT NULL DEFAULT '0',
  `verificationToken` varchar(512) DEFAULT NULL,
  `realm` varchar(512) DEFAULT NULL,
  `customerId` int DEFAULT NULL,
  `note` varchar(255) NOT NULL DEFAULT '',
  `firstName` varchar(64) DEFAULT NULL,
  `lastName` varchar(64) DEFAULT NULL,
  `primaryAdmin` tinyint(1) DEFAULT NULL,
  `timezone` varchar(8) DEFAULT '-00:00',
  `ui_settings` json DEFAULT NULL,
  `languagesId` int unsigned NOT NULL DEFAULT '1',
  `last_login` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username_UNIQUE` (`username`),
  KEY `fk_customer_utente1_idx` (`customerId`),
  KEY `fk_languages_User` (`languagesId`),
  CONSTRAINT `fk_customer_User` FOREIGN KEY (`customerId`) REFERENCES `customer` (`id`),
  CONSTRAINT `fk_languages_User` FOREIGN KEY (`languagesId`) REFERENCES `languages` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `User`
--

LOCK TABLES `User` WRITE;
/*!40000 ALTER TABLE `User` DISABLE KEYS */;
INSERT INTO `User` VALUES (1,1,'admin','admin',NULL,'cms@techfusion.it',1,NULL,NULL,1,'','CMS','Administrator',1,'-08:00',NULL,1,NULL);
/*!40000 ALTER TABLE `User` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `addressee`
--

DROP TABLE IF EXISTS `addressee`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `addressee` (
  `id` int NOT NULL AUTO_INCREMENT,
  `notificationId` int NOT NULL,
  `userId` int NOT NULL,
  `sent` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `ack` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_destinatario_notifica1_idx` (`notificationId`),
  KEY `fk_destinatario_utente1_idx` (`userId`),
  CONSTRAINT `fk_addressee_Notification` FOREIGN KEY (`notificationId`) REFERENCES `notification` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_addressee_User` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `addressee`
--

LOCK TABLES `addressee` WRITE;
/*!40000 ALTER TABLE `addressee` DISABLE KEYS */;
/*!40000 ALTER TABLE `addressee` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attachment`
--

DROP TABLE IF EXISTS `attachment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `attachment` (
  `id` int NOT NULL AUTO_INCREMENT,
  `versionId` int NOT NULL,
  `nome` varchar(255) NOT NULL,
  `url` varchar(255) NOT NULL,
  `note` varchar(1024) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deletedAt` timestamp NULL DEFAULT NULL,
  `isDeleted` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_allegato_versione1_idx` (`versionId`),
  CONSTRAINT `fk_attachment_Version` FOREIGN KEY (`versionId`) REFERENCES `version` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attachment`
--

LOCK TABLES `attachment` WRITE;
/*!40000 ALTER TABLE `attachment` DISABLE KEYS */;
/*!40000 ALTER TABLE `attachment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bound`
--

DROP TABLE IF EXISTS `bound`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `bound` (
  `id` int NOT NULL AUTO_INCREMENT,
  `subscriptionId` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `operator` varchar(255) NOT NULL,
  `operand` varchar(255) NOT NULL,
  `value` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deletedAt` timestamp NULL DEFAULT NULL,
  `isDeleted` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_vincolo_sottoscrizione1_idx` (`subscriptionId`),
  CONSTRAINT `fk_bound_subscription` FOREIGN KEY (`subscriptionId`) REFERENCES `subscription` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bound`
--

LOCK TABLES `bound` WRITE;
/*!40000 ALTER TABLE `bound` DISABLE KEYS */;
/*!40000 ALTER TABLE `bound` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `call_log`
--

DROP TABLE IF EXISTS `call_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `call_log` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `call_id` varchar(128) NOT NULL,
  `call_direction` enum('INBOUND','OUTBOUND') DEFAULT NULL,
  `caller_number` varchar(54) NOT NULL,
  `tracking_number` varchar(16) DEFAULT NULL,
  `caller_contactId` int DEFAULT NULL,
  `customerId` int DEFAULT NULL,
  `opnumberId` int DEFAULT NULL,
  `session_data` text,
  `callrecordingId` int DEFAULT NULL,
  `metrics` text,
  `routingId` int DEFAULT NULL,
  `flag` int NOT NULL,
  `call_terminated` tinyint NOT NULL,
  `call_status` varchar(3) DEFAULT NULL,
  `call_status_message` varchar(64) DEFAULT NULL,
  `duration` int DEFAULT NULL,
  `ms_duration` int DEFAULT NULL,
  `setuptime` int DEFAULT NULL,
  `created` datetime DEFAULT NULL,
  `recording_enable` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `call_log`
--

LOCK TABLES `call_log` WRITE;
/*!40000 ALTER TABLE `call_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `call_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `call_log_support`
--

DROP TABLE IF EXISTS `call_log_support`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `call_log_support` (
  `id` int NOT NULL,
  `call_id` varchar(128) DEFAULT NULL,
  `call_direction` enum('inbound','outbound') NOT NULL DEFAULT 'inbound',
  `caller_number` varchar(64) DEFAULT NULL,
  `tracking_number` varchar(16) DEFAULT NULL,
  `customerId` int DEFAULT NULL,
  `tracking_source_name` varchar(128) DEFAULT NULL,
  `routing_address` varchar(256) DEFAULT NULL,
  `receiving_number` varchar(16) DEFAULT NULL,
  `metrics` text,
  `flag` int NOT NULL DEFAULT '0',
  `call_terminated` tinyint unsigned NOT NULL DEFAULT '1',
  `call_status` varchar(3) NOT NULL DEFAULT '200',
  `call_status_message` varchar(64) DEFAULT NULL,
  `duration` int unsigned NOT NULL DEFAULT '0',
  `ms_duration` int unsigned NOT NULL DEFAULT '0',
  `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `call_id` (`call_id`),
  KEY `created` (`created`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `call_log_support`
--

LOCK TABLES `call_log_support` WRITE;
/*!40000 ALTER TABLE `call_log_support` DISABLE KEYS */;
/*!40000 ALTER TABLE `call_log_support` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `call_recording`
--

DROP TABLE IF EXISTS `call_recording`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `call_recording` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(128) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `content` longtext,
  `duration` int unsigned NOT NULL DEFAULT '0',
  `tags` text,
  `visible` int unsigned NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `call_recording`
--

LOCK TABLES `call_recording` WRITE;
/*!40000 ALTER TABLE `call_recording` DISABLE KEYS */;
/*!40000 ALTER TABLE `call_recording` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `casbin_rule`
--

DROP TABLE IF EXISTS `casbin_rule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `casbin_rule` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ptype` varchar(255) DEFAULT NULL,
  `v0` varchar(255) DEFAULT NULL,
  `v1` varchar(255) DEFAULT NULL,
  `v2` varchar(255) DEFAULT NULL,
  `v3` varchar(255) DEFAULT NULL,
  `v4` varchar(255) DEFAULT NULL,
  `v5` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `casbin_rule`
--

LOCK TABLES `casbin_rule` WRITE;
/*!40000 ALTER TABLE `casbin_rule` DISABLE KEYS */;
INSERT INTO `casbin_rule` VALUES (1,'p','1','/api/v1/ecms/*','GET',NULL,NULL,NULL),(2,'p','1','/api/v1/ecms/*','POST',NULL,NULL,NULL),(3,'p','1','/api/v1/ecms/*','PUT',NULL,NULL,NULL),(4,'p','1','/api/v1/ecms/*','DELETE',NULL,NULL,NULL);
/*!40000 ALTER TABLE `casbin_rule` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contact_type`
--

DROP TABLE IF EXISTS `contact_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `contact_type` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL,
  `label` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name_UNIQUE` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contact_type`
--

LOCK TABLES `contact_type` WRITE;
/*!40000 ALTER TABLE `contact_type` DISABLE KEYS */;
INSERT INTO `contact_type` VALUES (1,'email','EMAIL'),(2,'sms','SMS');
/*!40000 ALTER TABLE `contact_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `country`
--

DROP TABLE IF EXISTS `country`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `country` (
  `id` int NOT NULL AUTO_INCREMENT,
  `iso` char(2) NOT NULL,
  `name` varchar(80) NOT NULL,
  `nicename` varchar(80) NOT NULL,
  `iso3` char(3) DEFAULT NULL,
  `numcode` smallint DEFAULT NULL,
  `phonecode` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `country`
--

LOCK TABLES `country` WRITE;
/*!40000 ALTER TABLE `country` DISABLE KEYS */;
INSERT INTO `country` VALUES (1,'AF','AFGHANISTAN','Afghanistan','AFG',4,93),(2,'AL','ALBANIA','Albania','ALB',8,355),(3,'DZ','ALGERIA','Algeria','DZA',12,213),(4,'AS','AMERICAN SAMOA','American Samoa','ASM',16,1684),(5,'AD','ANDORRA','Andorra','AND',20,376),(6,'AO','ANGOLA','Angola','AGO',24,244),(7,'AI','ANGUILLA','Anguilla','AIA',660,1264),(8,'AQ','ANTARCTICA','Antarctica',NULL,NULL,0),(9,'AG','ANTIGUA AND BARBUDA','Antigua and Barbuda','ATG',28,1268),(10,'AR','ARGENTINA','Argentina','ARG',32,54),(11,'AM','ARMENIA','Armenia','ARM',51,374),(12,'AW','ARUBA','Aruba','ABW',533,297),(13,'AU','AUSTRALIA','Australia','AUS',36,61),(14,'AT','AUSTRIA','Austria','AUT',40,43),(15,'AZ','AZERBAIJAN','Azerbaijan','AZE',31,994),(16,'BS','BAHAMAS','Bahamas','BHS',44,1242),(17,'BH','BAHRAIN','Bahrain','BHR',48,973),(18,'BD','BANGLADESH','Bangladesh','BGD',50,880),(19,'BB','BARBADOS','Barbados','BRB',52,1246),(20,'BY','BELARUS','Belarus','BLR',112,375),(21,'BE','BELGIUM','Belgium','BEL',56,32),(22,'BZ','BELIZE','Belize','BLZ',84,501),(23,'BJ','BENIN','Benin','BEN',204,229),(24,'BM','BERMUDA','Bermuda','BMU',60,1441),(25,'BT','BHUTAN','Bhutan','BTN',64,975),(26,'BO','BOLIVIA','Bolivia','BOL',68,591),(27,'BA','BOSNIA AND HERZEGOVINA','Bosnia and Herzegovina','BIH',70,387),(28,'BW','BOTSWANA','Botswana','BWA',72,267),(29,'BV','BOUVET ISLAND','Bouvet Island',NULL,NULL,0),(30,'BR','BRAZIL','Brazil','BRA',76,55),(31,'IO','BRITISH INDIAN OCEAN TERRITORY','British Indian Ocean Territory',NULL,NULL,246),(32,'BN','BRUNEI DARUSSALAM','Brunei Darussalam','BRN',96,673),(33,'BG','BULGARIA','Bulgaria','BGR',100,359),(34,'BF','BURKINA FASO','Burkina Faso','BFA',854,226),(35,'BI','BURUNDI','Burundi','BDI',108,257),(36,'KH','CAMBODIA','Cambodia','KHM',116,855),(37,'CM','CAMEROON','Cameroon','CMR',120,237),(38,'CA','CANADA','Canada','CAN',124,1),(39,'CV','CAPE VERDE','Cape Verde','CPV',132,238),(40,'KY','CAYMAN ISLANDS','Cayman Islands','CYM',136,1345),(41,'CF','CENTRAL AFRICAN REPUBLIC','Central African Republic','CAF',140,236),(42,'TD','CHAD','Chad','TCD',148,235),(43,'CL','CHILE','Chile','CHL',152,56),(44,'CN','CHINA','China','CHN',156,86),(45,'CX','CHRISTMAS ISLAND','Christmas Island',NULL,NULL,61),(46,'CC','COCOS (KEELING) ISLANDS','Cocos (Keeling) Islands',NULL,NULL,672),(47,'CO','COLOMBIA','Colombia','COL',170,57),(48,'KM','COMOROS','Comoros','COM',174,269),(49,'CG','CONGO','Congo','COG',178,242),(50,'CD','CONGO, THE DEMOCRATIC REPUBLIC OF THE','Congo, the Democratic Republic of the','COD',180,242),(51,'CK','COOK ISLANDS','Cook Islands','COK',184,682),(52,'CR','COSTA RICA','Costa Rica','CRI',188,506),(53,'CI','COTE D\'IVOIRE','Cote D\'Ivoire','CIV',384,225),(54,'HR','CROATIA','Croatia','HRV',191,385),(55,'CU','CUBA','Cuba','CUB',192,53),(56,'CY','CYPRUS','Cyprus','CYP',196,357),(57,'CZ','CZECH REPUBLIC','Czech Republic','CZE',203,420),(58,'DK','DENMARK','Denmark','DNK',208,45),(59,'DJ','DJIBOUTI','Djibouti','DJI',262,253),(60,'DM','DOMINICA','Dominica','DMA',212,1767),(61,'DO','DOMINICAN REPUBLIC','Dominican Republic','DOM',214,1809),(62,'EC','ECUADOR','Ecuador','ECU',218,593),(63,'EG','EGYPT','Egypt','EGY',818,20),(64,'SV','EL SALVADOR','El Salvador','SLV',222,503),(65,'GQ','EQUATORIAL GUINEA','Equatorial Guinea','GNQ',226,240),(66,'ER','ERITREA','Eritrea','ERI',232,291),(67,'EE','ESTONIA','Estonia','EST',233,372),(68,'ET','ETHIOPIA','Ethiopia','ETH',231,251),(69,'FK','FALKLAND ISLANDS (MALVINAS)','Falkland Islands (Malvinas)','FLK',238,500),(70,'FO','FAROE ISLANDS','Faroe Islands','FRO',234,298),(71,'FJ','FIJI','Fiji','FJI',242,679),(72,'FI','FINLAND','Finland','FIN',246,358),(73,'FR','FRANCE','France','FRA',250,33),(74,'GF','FRENCH GUIANA','French Guiana','GUF',254,594),(75,'PF','FRENCH POLYNESIA','French Polynesia','PYF',258,689),(76,'TF','FRENCH SOUTHERN TERRITORIES','French Southern Territories',NULL,NULL,0),(77,'GA','GABON','Gabon','GAB',266,241),(78,'GM','GAMBIA','Gambia','GMB',270,220),(79,'GE','GEORGIA','Georgia','GEO',268,995),(80,'DE','GERMANY','Germany','DEU',276,49),(81,'GH','GHANA','Ghana','GHA',288,233),(82,'GI','GIBRALTAR','Gibraltar','GIB',292,350),(83,'GR','GREECE','Greece','GRC',300,30),(84,'GL','GREENLAND','Greenland','GRL',304,299),(85,'GD','GRENADA','Grenada','GRD',308,1473),(86,'GP','GUADELOUPE','Guadeloupe','GLP',312,590),(87,'GU','GUAM','Guam','GUM',316,1671),(88,'GT','GUATEMALA','Guatemala','GTM',320,502),(89,'GN','GUINEA','Guinea','GIN',324,224),(90,'GW','GUINEA-BISSAU','Guinea-Bissau','GNB',624,245),(91,'GY','GUYANA','Guyana','GUY',328,592),(92,'HT','HAITI','Haiti','HTI',332,509),(93,'HM','HEARD ISLAND AND MCDONALD ISLANDS','Heard Island and Mcdonald Islands',NULL,NULL,0),(94,'VA','HOLY SEE (VATICAN CITY STATE)','Holy See (Vatican City State)','VAT',336,39),(95,'HN','HONDURAS','Honduras','HND',340,504),(96,'HK','HONG KONG','Hong Kong','HKG',344,852),(97,'HU','HUNGARY','Hungary','HUN',348,36),(98,'IS','ICELAND','Iceland','ISL',352,354),(99,'IN','INDIA','India','IND',356,91),(100,'ID','INDONESIA','Indonesia','IDN',360,62),(101,'IR','IRAN, ISLAMIC REPUBLIC OF','Iran, Islamic Republic of','IRN',364,98),(102,'IQ','IRAQ','Iraq','IRQ',368,964),(103,'IE','IRELAND','Ireland','IRL',372,353),(104,'IL','ISRAEL','Israel','ISR',376,972),(105,'IT','ITALY','Italy','ITA',380,39),(106,'JM','JAMAICA','Jamaica','JAM',388,1876),(107,'JP','JAPAN','Japan','JPN',392,81),(108,'JO','JORDAN','Jordan','JOR',400,962),(109,'KZ','KAZAKHSTAN','Kazakhstan','KAZ',398,7),(110,'KE','KENYA','Kenya','KEN',404,254),(111,'KI','KIRIBATI','Kiribati','KIR',296,686),(112,'KP','KOREA, DEMOCRATIC PEOPLE\'S REPUBLIC OF','Korea, Democratic People\'s Republic of','PRK',408,850),(113,'KR','KOREA, REPUBLIC OF','Korea, Republic of','KOR',410,82),(114,'KW','KUWAIT','Kuwait','KWT',414,965),(115,'KG','KYRGYZSTAN','Kyrgyzstan','KGZ',417,996),(116,'LA','LAO PEOPLE\'S DEMOCRATIC REPUBLIC','Lao People\'s Democratic Republic','LAO',418,856),(117,'LV','LATVIA','Latvia','LVA',428,371),(118,'LB','LEBANON','Lebanon','LBN',422,961),(119,'LS','LESOTHO','Lesotho','LSO',426,266),(120,'LR','LIBERIA','Liberia','LBR',430,231),(121,'LY','LIBYAN ARAB JAMAHIRIYA','Libyan Arab Jamahiriya','LBY',434,218),(122,'LI','LIECHTENSTEIN','Liechtenstein','LIE',438,423),(123,'LT','LITHUANIA','Lithuania','LTU',440,370),(124,'LU','LUXEMBOURG','Luxembourg','LUX',442,352),(125,'MO','MACAO','Macao','MAC',446,853),(126,'MK','MACEDONIA, THE FORMER YUGOSLAV REPUBLIC OF','Macedonia, the Former Yugoslav Republic of','MKD',807,389),(127,'MG','MADAGASCAR','Madagascar','MDG',450,261),(128,'MW','MALAWI','Malawi','MWI',454,265),(129,'MY','MALAYSIA','Malaysia','MYS',458,60),(130,'MV','MALDIVES','Maldives','MDV',462,960),(131,'ML','MALI','Mali','MLI',466,223),(132,'MT','MALTA','Malta','MLT',470,356),(133,'MH','MARSHALL ISLANDS','Marshall Islands','MHL',584,692),(134,'MQ','MARTINIQUE','Martinique','MTQ',474,596),(135,'MR','MAURITANIA','Mauritania','MRT',478,222),(136,'MU','MAURITIUS','Mauritius','MUS',480,230),(137,'YT','MAYOTTE','Mayotte',NULL,NULL,269),(138,'MX','MEXICO','Mexico','MEX',484,52),(139,'FM','MICRONESIA, FEDERATED STATES OF','Micronesia, Federated States of','FSM',583,691),(140,'MD','MOLDOVA, REPUBLIC OF','Moldova, Republic of','MDA',498,373),(141,'MC','MONACO','Monaco','MCO',492,377),(142,'MN','MONGOLIA','Mongolia','MNG',496,976),(143,'MS','MONTSERRAT','Montserrat','MSR',500,1664),(144,'MA','MOROCCO','Morocco','MAR',504,212),(145,'MZ','MOZAMBIQUE','Mozambique','MOZ',508,258),(146,'MM','MYANMAR','Myanmar','MMR',104,95),(147,'NA','NAMIBIA','Namibia','NAM',516,264),(148,'NR','NAURU','Nauru','NRU',520,674),(149,'NP','NEPAL','Nepal','NPL',524,977),(150,'NL','NETHERLANDS','Netherlands','NLD',528,31),(151,'AN','NETHERLANDS ANTILLES','Netherlands Antilles','ANT',530,599),(152,'NC','NEW CALEDONIA','New Caledonia','NCL',540,687),(153,'NZ','NEW ZEALAND','New Zealand','NZL',554,64),(154,'NI','NICARAGUA','Nicaragua','NIC',558,505),(155,'NE','NIGER','Niger','NER',562,227),(156,'NG','NIGERIA','Nigeria','NGA',566,234),(157,'NU','NIUE','Niue','NIU',570,683),(158,'NF','NORFOLK ISLAND','Norfolk Island','NFK',574,672),(159,'MP','NORTHERN MARIANA ISLANDS','Northern Mariana Islands','MNP',580,1670),(160,'NO','NORWAY','Norway','NOR',578,47),(161,'OM','OMAN','Oman','OMN',512,968),(162,'PK','PAKISTAN','Pakistan','PAK',586,92),(163,'PW','PALAU','Palau','PLW',585,680),(164,'PS','PALESTINIAN TERRITORY, OCCUPIED','Palestinian Territory, Occupied',NULL,NULL,970),(165,'PA','PANAMA','Panama','PAN',591,507),(166,'PG','PAPUA NEW GUINEA','Papua New Guinea','PNG',598,675),(167,'PY','PARAGUAY','Paraguay','PRY',600,595),(168,'PE','PERU','Peru','PER',604,51),(169,'PH','PHILIPPINES','Philippines','PHL',608,63),(170,'PN','PITCAIRN','Pitcairn','PCN',612,0),(171,'PL','POLAND','Poland','POL',616,48),(172,'PT','PORTUGAL','Portugal','PRT',620,351),(173,'PR','PUERTO RICO','Puerto Rico','PRI',630,1787),(174,'QA','QATAR','Qatar','QAT',634,974),(175,'RE','REUNION','Reunion','REU',638,262),(176,'RO','ROMANIA','Romania','ROM',642,40),(177,'RU','RUSSIAN FEDERATION','Russian Federation','RUS',643,70),(178,'RW','RWANDA','Rwanda','RWA',646,250),(179,'SH','SAINT HELENA','Saint Helena','SHN',654,290),(180,'KN','SAINT KITTS AND NEVIS','Saint Kitts and Nevis','KNA',659,1869),(181,'LC','SAINT LUCIA','Saint Lucia','LCA',662,1758),(182,'PM','SAINT PIERRE AND MIQUELON','Saint Pierre and Miquelon','SPM',666,508),(183,'VC','SAINT VINCENT AND THE GRENADINES','Saint Vincent and the Grenadines','VCT',670,1784),(184,'WS','SAMOA','Samoa','WSM',882,684),(185,'SM','SAN MARINO','San Marino','SMR',674,378),(186,'ST','SAO TOME AND PRINCIPE','Sao Tome and Principe','STP',678,239),(187,'SA','SAUDI ARABIA','Saudi Arabia','SAU',682,966),(188,'SN','SENEGAL','Senegal','SEN',686,221),(189,'CS','SERBIA AND MONTENEGRO','Serbia and Montenegro',NULL,NULL,381),(190,'SC','SEYCHELLES','Seychelles','SYC',690,248),(191,'SL','SIERRA LEONE','Sierra Leone','SLE',694,232),(192,'SG','SINGAPORE','Singapore','SGP',702,65),(193,'SK','SLOVAKIA','Slovakia','SVK',703,421),(194,'SI','SLOVENIA','Slovenia','SVN',705,386),(195,'SB','SOLOMON ISLANDS','Solomon Islands','SLB',90,677),(196,'SO','SOMALIA','Somalia','SOM',706,252),(197,'ZA','SOUTH AFRICA','South Africa','ZAF',710,27),(198,'GS','SOUTH GEORGIA AND THE SOUTH SANDWICH ISLANDS','South Georgia and the South Sandwich Islands',NULL,NULL,0),(199,'ES','SPAIN','Spain','ESP',724,34),(200,'LK','SRI LANKA','Sri Lanka','LKA',144,94),(201,'SD','SUDAN','Sudan','SDN',736,249),(202,'SR','SURINAME','Suriname','SUR',740,597),(203,'SJ','SVALBARD AND JAN MAYEN','Svalbard and Jan Mayen','SJM',744,47),(204,'SZ','SWAZILAND','Swaziland','SWZ',748,268),(205,'SE','SWEDEN','Sweden','SWE',752,46),(206,'CH','SWITZERLAND','Switzerland','CHE',756,41),(207,'SY','SYRIAN ARAB REPUBLIC','Syrian Arab Republic','SYR',760,963),(208,'TW','TAIWAN, PROVINCE OF CHINA','Taiwan, Province of China','TWN',158,886),(209,'TJ','TAJIKISTAN','Tajikistan','TJK',762,992),(210,'TZ','TANZANIA, UNITED REPUBLIC OF','Tanzania, United Republic of','TZA',834,255),(211,'TH','THAILAND','Thailand','THA',764,66),(212,'TL','TIMOR-LESTE','Timor-Leste',NULL,NULL,670),(213,'TG','TOGO','Togo','TGO',768,228),(214,'TK','TOKELAU','Tokelau','TKL',772,690),(215,'TO','TONGA','Tonga','TON',776,676),(216,'TT','TRINIDAD AND TOBAGO','Trinidad and Tobago','TTO',780,1868),(217,'TN','TUNISIA','Tunisia','TUN',788,216),(218,'TR','TURKEY','Turkey','TUR',792,90),(219,'TM','TURKMENISTAN','Turkmenistan','TKM',795,7370),(220,'TC','TURKS AND CAICOS ISLANDS','Turks and Caicos Islands','TCA',796,1649),(221,'TV','TUVALU','Tuvalu','TUV',798,688),(222,'UG','UGANDA','Uganda','UGA',800,256),(223,'UA','UKRAINE','Ukraine','UKR',804,380),(224,'AE','UNITED ARAB EMIRATES','United Arab Emirates','ARE',784,971),(225,'GB','UNITED KINGDOM','United Kingdom','GBR',826,44),(226,'US','UNITED STATES','United States','USA',840,1),(227,'UM','UNITED STATES MINOR OUTLYING ISLANDS','United States Minor Outlying Islands',NULL,NULL,1),(228,'UY','URUGUAY','Uruguay','URY',858,598),(229,'UZ','UZBEKISTAN','Uzbekistan','UZB',860,998),(230,'VU','VANUATU','Vanuatu','VUT',548,678),(231,'VE','VENEZUELA','Venezuela','VEN',862,58),(232,'VN','VIET NAM','Viet Nam','VNM',704,84),(233,'VG','VIRGIN ISLANDS, BRITISH','Virgin Islands, British','VGB',92,1284),(234,'VI','VIRGIN ISLANDS, U.S.','Virgin Islands, U.s.','VIR',850,1340),(235,'WF','WALLIS AND FUTUNA','Wallis and Futuna','WLF',876,681),(236,'EH','WESTERN SAHARA','Western Sahara','ESH',732,212),(237,'YE','YEMEN','Yemen','YEM',887,967),(238,'ZM','ZAMBIA','Zambia','ZMB',894,260),(239,'ZW','ZIMBABWE','Zimbabwe','ZWE',716,263);
/*!40000 ALTER TABLE `country` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer`
--

DROP TABLE IF EXISTS `customer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `customer` (
  `id` int NOT NULL AUTO_INCREMENT,
  `enabled` tinyint DEFAULT NULL,
  `firstName` varchar(32) DEFAULT NULL,
  `lastName` varchar(32) DEFAULT NULL,
  `vatNumber` varchar(32) DEFAULT NULL,
  `companyName` varchar(255) NOT NULL,
  `billingEmail` varchar(255) DEFAULT NULL,
  `contactEmail` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `city` varchar(64) DEFAULT NULL,
  `state` varchar(64) DEFAULT NULL,
  `zip` varchar(10) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `companyID` varchar(32) DEFAULT NULL,
  `recording_enable` enum('0','1') DEFAULT NULL,
  `balance` float unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer`
--

LOCK TABLES `customer` WRITE;
/*!40000 ALTER TABLE `customer` DISABLE KEYS */;
INSERT INTO `customer` VALUES (1,0,'Default','Customer','IT16249491008','Tech Fusion ITc','ecms@techfusion.it','ecms@techfusion.it','Via Nazionale, 1','Roma','Italia','00100','+39 (348) 2513-178','Default',NULL,0);
/*!40000 ALTER TABLE `customer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_products_rel`
--

DROP TABLE IF EXISTS `customer_products_rel`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `customer_products_rel` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customerId` int NOT NULL,
  `productId` int unsigned NOT NULL,
  `quantity` int unsigned NOT NULL DEFAULT '1',
  `sub_ref` varchar(128) DEFAULT NULL,
  `price_ref` varchar(128) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UNIQUE` (`customerId`,`productId`),
  KEY `customer_products_rel_ibfk_2_idx` (`productId`),
  KEY `customer_products_rel_ibfk_1_idx` (`customerId`),
  CONSTRAINT `customer_products_rel_ibfk_1` FOREIGN KEY (`customerId`) REFERENCES `customer` (`id`),
  CONSTRAINT `customer_products_rel_ibfk_2` FOREIGN KEY (`productId`) REFERENCES `product_variation` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_products_rel`
--

LOCK TABLES `customer_products_rel` WRITE;
/*!40000 ALTER TABLE `customer_products_rel` DISABLE KEYS */;
/*!40000 ALTER TABLE `customer_products_rel` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `document`
--

DROP TABLE IF EXISTS `document`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `document` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customerId` int DEFAULT NULL,
  `documentTypeId` int NOT NULL,
  `nome` varchar(255) NOT NULL,
  `url` varchar(255) NOT NULL,
  `note` varchar(1024) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_document_customer1_idx` (`customerId`),
  KEY `fk_document_document_type1_idx` (`documentTypeId`),
  CONSTRAINT `fk_document_customer1` FOREIGN KEY (`customerId`) REFERENCES `customer` (`id`),
  CONSTRAINT `fk_document_document_type1` FOREIGN KEY (`documentTypeId`) REFERENCES `document_type` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document`
--

LOCK TABLES `document` WRITE;
/*!40000 ALTER TABLE `document` DISABLE KEYS */;
/*!40000 ALTER TABLE `document` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `document_type`
--

DROP TABLE IF EXISTS `document_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `document_type` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL,
  `label` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name_UNIQUE` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_type`
--

LOCK TABLES `document_type` WRITE;
/*!40000 ALTER TABLE `document_type` DISABLE KEYS */;
INSERT INTO `document_type` VALUES (1,'DefaultTPL',NULL);
/*!40000 ALTER TABLE `document_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fs_users`
--

DROP TABLE IF EXISTS `fs_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fs_users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `isActive` tinyint NOT NULL DEFAULT '1',
  `username` varchar(512) NOT NULL,
  `password` varchar(512) NOT NULL,
  `realm` varchar(512) DEFAULT NULL,
  `note` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username_UNIQUE` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fs_users`
--

LOCK TABLES `fs_users` WRITE;
/*!40000 ALTER TABLE `fs_users` DISABLE KEYS */;
INSERT INTO `fs_users` VALUES (1,1,'admin','admin',NULL,'');
/*!40000 ALTER TABLE `fs_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `group`
--

DROP TABLE IF EXISTS `group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `group` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name_UNIQUE` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `group`
--

LOCK TABLES `group` WRITE;
/*!40000 ALTER TABLE `group` DISABLE KEYS */;
INSERT INTO `group` VALUES (1,'Administrators',NULL),(2,'Users',NULL);
/*!40000 ALTER TABLE `group` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `group_membership`
--

DROP TABLE IF EXISTS `group_membership`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `group_membership` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `groupId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deletedAt` timestamp NULL DEFAULT NULL,
  `isDeleted` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_utenti_gruppi_utente1_idx` (`userId`),
  KEY `fk_utenti_gruppi_gruppo1_idx` (`groupId`),
  CONSTRAINT `fk_membership_Group` FOREIGN KEY (`groupId`) REFERENCES `group` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_membership_User` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `group_membership`
--

LOCK TABLES `group_membership` WRITE;
/*!40000 ALTER TABLE `group_membership` DISABLE KEYS */;
/*!40000 ALTER TABLE `group_membership` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gui_permission`
--

DROP TABLE IF EXISTS `gui_permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `gui_permission` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL,
  `label` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name_UNIQUE` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gui_permission`
--

LOCK TABLES `gui_permission` WRITE;
/*!40000 ALTER TABLE `gui_permission` DISABLE KEYS */;
INSERT INTO `gui_permission` VALUES (1,'DENY',NULL),(2,'READONLY',NULL),(3,'PERMITALL',NULL);
/*!40000 ALTER TABLE `gui_permission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gui_section`
--

DROP TABLE IF EXISTS `gui_section`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `gui_section` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `fqdn` varchar(255) NOT NULL,
  `groupName` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name_UNIQUE` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gui_section`
--

LOCK TABLES `gui_section` WRITE;
/*!40000 ALTER TABLE `gui_section` DISABLE KEYS */;
INSERT INTO `gui_section` VALUES (1,'Customer','','User Management'),(2,'Role','','User Management'),(3,'User','','User Management'),(4,'CallLogs','','Activity Logs'),(5,'AddNumbers','','Number Management'),(6,'TrackingNumbers','','Number Management'),(7,'ReceivingNumbers','','Routing'),(8,'SipGateways','','Routing'),(9,'TrackingSources','','Call Source'),(10,'ActivityReports','','Reports'),(11,'Overview','','Reports');
/*!40000 ALTER TABLE `gui_section` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gui_visibility`
--

DROP TABLE IF EXISTS `gui_visibility`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `gui_visibility` (
  `id` int NOT NULL AUTO_INCREMENT,
  `guisectionId` int NOT NULL,
  `guipermissionId` int NOT NULL,
  `roleId` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `gui_visibility_uq` (`guisectionId`,`guipermissionId`,`roleId`),
  KEY `fk_gui_visibility_gui_section1_idx` (`guisectionId`),
  KEY `fk_gui_visibility_gui_permission1_idx` (`guipermissionId`),
  KEY `fk_gui_visibility_User1_idx` (`roleId`),
  CONSTRAINT `fk_gui_visibility_gui_permission1` FOREIGN KEY (`guipermissionId`) REFERENCES `gui_permission` (`id`),
  CONSTRAINT `fk_gui_visibility_gui_section1` FOREIGN KEY (`guisectionId`) REFERENCES `gui_section` (`id`),
  CONSTRAINT `fk_gui_visibility_role1` FOREIGN KEY (`roleId`) REFERENCES `Role` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gui_visibility`
--

LOCK TABLES `gui_visibility` WRITE;
/*!40000 ALTER TABLE `gui_visibility` DISABLE KEYS */;
INSERT INTO `gui_visibility` VALUES (1,1,3,1),(2,2,3,1),(3,3,3,1),(4,4,3,1),(5,5,3,1),(6,6,3,1),(7,7,3,1),(8,8,3,1),(9,9,3,1),(10,10,3,1),(11,11,3,1);
/*!40000 ALTER TABLE `gui_visibility` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `languages`
--

DROP TABLE IF EXISTS `languages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `languages` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` char(49) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL,
  `iso` char(2) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb3 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `languages`
--

LOCK TABLES `languages` WRITE;
/*!40000 ALTER TABLE `languages` DISABLE KEYS */;
INSERT INTO `languages` VALUES (1,'English','en'),(2,'Afar','aa'),(3,'Abkhazian','ab'),(4,'Afrikaans','af'),(5,'Amharic','am'),(6,'Arabic','ar'),(7,'Assamese','as'),(8,'Aymara','ay'),(9,'Azerbaijani','az'),(10,'Bashkir','ba'),(11,'Belarusian','be'),(12,'Bulgarian','bg'),(13,'Bihari','bh'),(14,'Bislama','bi'),(15,'Bengali/Bangla','bn'),(16,'Tibetan','bo'),(17,'Breton','br'),(18,'Catalan','ca'),(19,'Corsican','co'),(20,'Czech','cs'),(21,'Welsh','cy'),(22,'Danish','da'),(23,'German','de'),(24,'Bhutani','dz'),(25,'Greek','el'),(26,'Esperanto','eo'),(27,'Spanish','es'),(28,'Estonian','et'),(29,'Basque','eu'),(30,'Persian','fa'),(31,'Finnish','fi'),(32,'Fiji','fj'),(33,'Faeroese','fo'),(34,'French','fr'),(35,'Frisian','fy'),(36,'Irish','ga'),(37,'Scots/Gaelic','gd'),(38,'Galician','gl'),(39,'Guarani','gn'),(40,'Gujarati','gu'),(41,'Hausa','ha'),(42,'Hindi','hi'),(43,'Croatian','hr'),(44,'Hungarian','hu'),(45,'Armenian','hy'),(46,'Interlingua','ia'),(47,'Interlingue','ie'),(48,'Inupiak','ik'),(49,'Indonesian','in'),(50,'Icelandic','is'),(51,'Italian','it'),(52,'Hebrew','iw'),(53,'Japanese','ja'),(54,'Yiddish','ji'),(55,'Javanese','jw'),(56,'Georgian','ka'),(57,'Kazakh','kk'),(58,'Greenlandic','kl'),(59,'Cambodian','km'),(60,'Kannada','kn'),(61,'Korean','ko'),(62,'Kashmiri','ks'),(63,'Kurdish','ku'),(64,'Kirghiz','ky'),(65,'Latin','la'),(66,'Lingala','ln'),(67,'Laothian','lo'),(68,'Lithuanian','lt'),(69,'Latvian/Lettish','lv'),(70,'Malagasy','mg'),(71,'Maori','mi'),(72,'Macedonian','mk'),(73,'Malayalam','ml'),(74,'Mongolian','mn'),(75,'Moldavian','mo'),(76,'Marathi','mr'),(77,'Malay','ms'),(78,'Maltese','mt'),(79,'Burmese','my'),(80,'Nauru','na'),(81,'Nepali','ne'),(82,'Dutch','nl'),(83,'Norwegian','no'),(84,'Occitan','oc'),(85,'(Afan)/Oromoor/Oriya','om'),(86,'Punjabi','pa'),(87,'Polish','pl'),(88,'Pashto/Pushto','ps'),(89,'Portuguese','pt'),(90,'Quechua','qu'),(91,'Rhaeto-Romance','rm'),(92,'Kirundi','rn'),(93,'Romanian','ro'),(94,'Russian','ru'),(95,'Kinyarwanda','rw'),(96,'Sanskrit','sa'),(97,'Sindhi','sd'),(98,'Sangro','sg'),(99,'Serbo-Croatian','sh'),(100,'Singhalese','si'),(101,'Slovak','sk'),(102,'Slovenian','sl'),(103,'Samoan','sm'),(104,'Shona','sn'),(105,'Somali','so'),(106,'Albanian','sq'),(107,'Serbian','sr'),(108,'Siswati','ss'),(109,'Sesotho','st'),(110,'Sundanese','su'),(111,'Swedish','sv'),(112,'Swahili','sw'),(113,'Tamil','ta'),(114,'Telugu','te'),(115,'Tajik','tg'),(116,'Thai','th'),(117,'Tigrinya','ti'),(118,'Turkmen','tk'),(119,'Tagalog','tl'),(120,'Setswana','tn'),(121,'Tonga','to'),(122,'Turkish','tr'),(123,'Tsonga','ts'),(124,'Tatar','tt'),(125,'Twi','tw'),(126,'Ukrainian','uk'),(127,'Urdu','ur'),(128,'Uzbek','uz'),(129,'Vietnamese','vi'),(130,'Volapuk','vo'),(131,'Wolof','wo'),(132,'Xhosa','xh'),(133,'Yoruba','yo'),(134,'Chinese','zh'),(135,'Zulu','zu');
/*!40000 ALTER TABLE `languages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lerg`
--

DROP TABLE IF EXISTS `lerg`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `lerg` (
  `npa` varchar(3) NOT NULL,
  `nxx` varchar(3) NOT NULL,
  `thousands` varchar(1) NOT NULL DEFAULT '',
  `state` varchar(2) DEFAULT NULL,
  `company` varchar(30) DEFAULT NULL,
  `ocn` varchar(4) DEFAULT NULL,
  `ratecenter` varchar(14) DEFAULT NULL,
  `clli` varchar(12) DEFAULT NULL,
  `assign_date` varchar(10) DEFAULT NULL,
  `prefix_type` varchar(10) DEFAULT NULL,
  `switch_name` varchar(32) DEFAULT NULL,
  `switch_type` varchar(62) DEFAULT NULL,
  `lata` varchar(5) DEFAULT NULL,
  `country` varchar(120) DEFAULT NULL,
  PRIMARY KEY (`npa`,`nxx`,`thousands`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lerg`
--

LOCK TABLES `lerg` WRITE;
/*!40000 ALTER TABLE `lerg` DISABLE KEYS */;
/*!40000 ALTER TABLE `lerg` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lerg_npanxx`
--

DROP TABLE IF EXISTS `lerg_npanxx`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `lerg_npanxx` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `npa` varchar(5) NOT NULL,
  `nxx` varchar(5) NOT NULL,
  `npanxx` varchar(10) NOT NULL DEFAULT '',
  `city` varchar(50) DEFAULT NULL,
  `state` varchar(2) DEFAULT NULL,
  `zip` varchar(6) DEFAULT NULL,
  `county` varchar(120) DEFAULT NULL,
  `country` varchar(120) DEFAULT NULL,
  `company` varchar(30) DEFAULT NULL,
  `ratecenter` varchar(14) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `npa` (`npa`),
  KEY `nxx` (`nxx`),
  KEY `npanxx` (`npanxx`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lerg_npanxx`
--

LOCK TABLES `lerg_npanxx` WRITE;
/*!40000 ALTER TABLE `lerg_npanxx` DISABLE KEYS */;
/*!40000 ALTER TABLE `lerg_npanxx` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification`
--

DROP TABLE IF EXISTS `notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notification` (
  `id` int NOT NULL AUTO_INCREMENT,
  `text` varchar(1024) NOT NULL,
  `versionId` int DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deletedAt` timestamp NULL DEFAULT NULL,
  `isDeleted` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_notifica_versione1_idx` (`versionId`),
  CONSTRAINT `fk_notifica_versione1` FOREIGN KEY (`versionId`) REFERENCES `version` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification`
--

LOCK TABLES `notification` WRITE;
/*!40000 ALTER TABLE `notification` DISABLE KEYS */;
/*!40000 ALTER TABLE `notification` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `observer`
--

DROP TABLE IF EXISTS `observer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `observer` (
  `id` int NOT NULL AUTO_INCREMENT,
  `versionId` int NOT NULL,
  `userId` int DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deletedAt` timestamp NULL DEFAULT NULL,
  `isDeleted` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_osservatore_versione1_idx` (`versionId`),
  KEY `fk_osservatore_utente1_idx` (`userId`),
  CONSTRAINT `fk_observer_User` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_observer_Version` FOREIGN KEY (`versionId`) REFERENCES `version` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `observer`
--

LOCK TABLES `observer` WRITE;
/*!40000 ALTER TABLE `observer` DISABLE KEYS */;
/*!40000 ALTER TABLE `observer` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `add_observer_subs` AFTER INSERT ON `observer` FOR EACH ROW call add_subch_subscription("version",NEW.versionId,NEW.userId) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `del_observer_subs` AFTER DELETE ON `observer` FOR EACH ROW CALL `del_subch_subscription`("version", OLD.versionId, OLD.userId) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `op_number`
--

DROP TABLE IF EXISTS `op_number`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `op_number` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `customerId` int DEFAULT NULL,
  `receiving_numberId` int DEFAULT NULL,
  `tracking_number` varchar(255) NOT NULL,
  `tracking_sourceId` int DEFAULT NULL,
  `sip_gatewayId` int DEFAULT NULL,
  `routing_action` enum('FORWARD_TO','REMAP_FORWARD_TO') DEFAULT NULL,
  `phonebook_id` int DEFAULT NULL,
  `notifications` tinyint DEFAULT NULL,
  `text_support` tinyint DEFAULT NULL,
  `number_tags` varchar(1024) DEFAULT NULL,
  `failsafe_number` varchar(255) DEFAULT NULL,
  `renewal_date` timestamp NULL DEFAULT NULL,
  `active` tinyint DEFAULT NULL,
  `description` varchar(2048) DEFAULT NULL,
  `recording_enable` enum('0','1') DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `op_number`
--

LOCK TABLES `op_number` WRITE;
/*!40000 ALTER TABLE `op_number` DISABLE KEYS */;
INSERT INTO `op_number` VALUES (1,1,NULL,'0000000000',1,NULL,NULL,NULL,0,0,NULL,NULL,NULL,0,'Unmatched tracking numbers',NULL);
/*!40000 ALTER TABLE `op_number` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_method`
--

DROP TABLE IF EXISTS `payment_method`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payment_method` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` enum('card','bank') NOT NULL DEFAULT 'card',
  `currency` varchar(5) NOT NULL DEFAULT 'USD',
  `name` varchar(64) DEFAULT 'noname',
  `number` varchar(128) DEFAULT NULL,
  `exp_date` timestamp NULL DEFAULT NULL,
  `cvv` int DEFAULT NULL,
  `description` varchar(45) DEFAULT NULL,
  `customerId` int NOT NULL,
  PRIMARY KEY (`customerId`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  CONSTRAINT `payment_customer_fk1` FOREIGN KEY (`customerId`) REFERENCES `customer` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_method`
--

LOCK TABLES `payment_method` WRITE;
/*!40000 ALTER TABLE `payment_method` DISABLE KEYS */;
/*!40000 ALTER TABLE `payment_method` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_transaction`
--

DROP TABLE IF EXISTS `payment_transaction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payment_transaction` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `customerId` int NOT NULL,
  `paymentId` int NOT NULL,
  `productId` int unsigned NOT NULL,
  `amount` float NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `payment_transaction_fk1_idx` (`customerId`),
  KEY `payment_transaction_fk2_idx` (`paymentId`),
  KEY `payment_transaction_fk3_idx` (`productId`),
  CONSTRAINT `payment_transaction_fk1` FOREIGN KEY (`customerId`) REFERENCES `customer` (`id`),
  CONSTRAINT `payment_transaction_fk2` FOREIGN KEY (`paymentId`) REFERENCES `payment_method` (`id`),
  CONSTRAINT `payment_transaction_fk3` FOREIGN KEY (`productId`) REFERENCES `product` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_transaction`
--

LOCK TABLES `payment_transaction` WRITE;
/*!40000 ALTER TABLE `payment_transaction` DISABLE KEYS */;
/*!40000 ALTER TABLE `payment_transaction` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `phonebook`
--

DROP TABLE IF EXISTS `phonebook`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `phonebook` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(128) NOT NULL,
  `email` varchar(320) DEFAULT NULL,
  `street` varchar(512) DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `state` varchar(255) DEFAULT NULL,
  `country` varchar(255) DEFAULT NULL,
  `postal_code` varchar(10) DEFAULT NULL,
  `contact_number` varchar(64) DEFAULT NULL,
  `note` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `phonebook`
--

LOCK TABLES `phonebook` WRITE;
/*!40000 ALTER TABLE `phonebook` DISABLE KEYS */;
/*!40000 ALTER TABLE `phonebook` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `update_lerginfos_before_insert` BEFORE INSERT ON `phonebook` FOR EACH ROW BEGIN

DECLARE l_city VARCHAR(50);
DECLARE l_state VARCHAR(5);
DECLARE l_country VARCHAR(5);
SET l_city = (SELECT `ratecenter` FROM `lerg` WHERE `npa`=(SUBSTRING(NEW.contact_number, 3,3)) AND `nxx`=(SUBSTRING(NEW.contact_number, 6,3)) LIMIT 1);
SET l_state = (SELECT `state` FROM `lerg` WHERE `npa`=(SUBSTRING(NEW.contact_number, 3,3)) AND `nxx`=(SUBSTRING(NEW.contact_number, 6,3)) LIMIT 1);
SET l_country = (SELECT `country` FROM `lerg` WHERE `npa`=(SUBSTRING(NEW.contact_number, 3,3)) AND `nxx`=(SUBSTRING(NEW.contact_number, 6,3)) LIMIT 1);

IF ((NEW.`contact_number` IS NOT NULL) AND (NEW.`contact_number` LIKE '+%')) THEN
	SET NEW.`city` = l_city;
	SET NEW.`state` = l_state;
   	SET NEW.`country` = l_country;
END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `update_lerginfos_before_update` BEFORE UPDATE ON `phonebook` FOR EACH ROW BEGIN

DECLARE l_city VARCHAR(50);
DECLARE l_state VARCHAR(5);
DECLARE l_country VARCHAR(5);
SET l_city = (SELECT `ratecenter` FROM `lerg` WHERE `npa`=(SUBSTRING(NEW.contact_number, 3,3)) AND `nxx`=(SUBSTRING(NEW.contact_number, 6,3)) LIMIT 1);
SET l_state = (SELECT `state` FROM `lerg` WHERE `npa`=(SUBSTRING(NEW.contact_number, 3,3)) AND `nxx`=(SUBSTRING(NEW.contact_number, 6,3)) LIMIT 1);
SET l_country = (SELECT `country` FROM `lerg` WHERE `npa`=(SUBSTRING(NEW.contact_number, 3,3)) AND `nxx`=(SUBSTRING(NEW.contact_number, 6,3)) LIMIT 1);

IF ((NEW.`contact_number` IS NOT NULL) AND (NEW.`contact_number` LIKE '+%')) THEN
	SET NEW.`city` = l_city;
	SET NEW.`state` = l_state;
   	SET NEW.`country` = l_country;
END IF;

END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `price_discount`
--

DROP TABLE IF EXISTS `price_discount`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `price_discount` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(128) NOT NULL,
  `discount` float unsigned NOT NULL DEFAULT '0',
  `description` blob,
  PRIMARY KEY (`id`),
  KEY `price_discount_idx` (`name`,`discount`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `price_discount`
--

LOCK TABLES `price_discount` WRITE;
/*!40000 ALTER TABLE `price_discount` DISABLE KEYS */;
/*!40000 ALTER TABLE `price_discount` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product`
--

DROP TABLE IF EXISTS `product`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `product` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `sku` varchar(128) NOT NULL,
  `token` varchar(128) DEFAULT NULL,
  `name` varchar(256) DEFAULT NULL,
  `group` varchar(45) DEFAULT NULL,
  `description` varchar(512) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sku_UNIQUE` (`sku`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product`
--

LOCK TABLES `product` WRITE;
/*!40000 ALTER TABLE `product` DISABLE KEYS */;
INSERT INTO `product` VALUES (1,'ecms-plan-performance-1',NULL,'Performance','plans','Performance basic plan');
/*!40000 ALTER TABLE `product` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_variation`
--

DROP TABLE IF EXISTS `product_variation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `product_variation` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `recur` enum('none','request','onetime','hour','day','week','month','year') NOT NULL DEFAULT 'none',
  `price` float NOT NULL DEFAULT '0',
  `productId` int unsigned NOT NULL,
  `currency` varchar(10) DEFAULT NULL,
  `max_quantity` int unsigned NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `fk_product_variation_1_idx` (`productId`),
  CONSTRAINT `fk_product_variation_1` FOREIGN KEY (`productId`) REFERENCES `product` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_variation`
--

LOCK TABLES `product_variation` WRITE;
/*!40000 ALTER TABLE `product_variation` DISABLE KEYS */;
INSERT INTO `product_variation` VALUES (1,'month',39,1,'USD',1),(2,'year',374.4,1,'USD',1);
/*!40000 ALTER TABLE `product_variation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `receiving_number`
--

DROP TABLE IF EXISTS `receiving_number`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `receiving_number` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `number` varchar(64) NOT NULL,
  `description` text,
  `customerId` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `receiving_number`
--

LOCK TABLES `receiving_number` WRITE;
/*!40000 ALTER TABLE `receiving_number` DISABLE KEYS */;
/*!40000 ALTER TABLE `receiving_number` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `redis_channel`
--

DROP TABLE IF EXISTS `redis_channel`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `redis_channel` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `redis_channel`
--

LOCK TABLES `redis_channel` WRITE;
/*!40000 ALTER TABLE `redis_channel` DISABLE KEYS */;
INSERT INTO `redis_channel` VALUES (1,'it.tech.ecms.version'),(2,'it.tech.ecms.ticket'),(3,'it.tech.ecms.growl'),(4,'it.tech.ecms.chat');
/*!40000 ALTER TABLE `redis_channel` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `call_create_default_subchannel` AFTER INSERT ON `redis_channel` FOR EACH ROW call create_default_subchannel(NEW.id) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `redis_subchannel`
--

DROP TABLE IF EXISTS `redis_subchannel`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `redis_subchannel` (
  `id` int NOT NULL AUTO_INCREMENT,
  `redisChannelId` int NOT NULL,
  `value` varchar(255) NOT NULL DEFAULT 'default',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_chan_subch` (`redisChannelId`,`value`) USING BTREE,
  KEY `fk_redis_subchannel_redis_channel1_idx` (`redisChannelId`),
  CONSTRAINT `fk_redis_subchannel_redis_channel1` FOREIGN KEY (`redisChannelId`) REFERENCES `redis_channel` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `redis_subchannel`
--

LOCK TABLES `redis_subchannel` WRITE;
/*!40000 ALTER TABLE `redis_subchannel` DISABLE KEYS */;
/*!40000 ALTER TABLE `redis_subchannel` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `redis_subscription`
--

DROP TABLE IF EXISTS `redis_subscription`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `redis_subscription` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `redisSubchannelId` int NOT NULL,
  `publish` tinyint NOT NULL DEFAULT '0',
  `methods` varchar(1024) NOT NULL DEFAULT '*',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deletedAt` timestamp NULL DEFAULT NULL,
  `isDeleted` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_subchannel_subs` (`userId`,`redisSubchannelId`),
  KEY `fk_channel_subs_User1_idx` (`userId`),
  KEY `fk_channel_subscription_redis_subchannel1_idx` (`redisSubchannelId`),
  CONSTRAINT `fk_channel_subs_User1` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_channel_subscription_redis_subchannel1` FOREIGN KEY (`redisSubchannelId`) REFERENCES `redis_subchannel` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `redis_subscription`
--

LOCK TABLES `redis_subscription` WRITE;
/*!40000 ALTER TABLE `redis_subscription` DISABLE KEYS */;
/*!40000 ALTER TABLE `redis_subscription` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary table structure for view `redis_subscription_view`
--

DROP TABLE IF EXISTS `redis_subscription_view`;
/*!50001 DROP VIEW IF EXISTS `redis_subscription_view`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `redis_subscription_view` AS SELECT
 1 AS `username`,
 1 AS `channel`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `routing_action`
--

DROP TABLE IF EXISTS `routing_action`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `routing_action` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `action` enum('forward_to','remap_forward_to') NOT NULL DEFAULT 'forward_to',
  `sip_gatewayId` int unsigned DEFAULT NULL,
  `receiving_numberId` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `routing_action_ibfk_1` (`sip_gatewayId`),
  KEY `receiving_numberId` (`receiving_numberId`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `routing_action`
--

LOCK TABLES `routing_action` WRITE;
/*!40000 ALTER TABLE `routing_action` DISABLE KEYS */;
/*!40000 ALTER TABLE `routing_action` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `service_providers`
--

DROP TABLE IF EXISTS `service_providers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `service_providers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `customerId` int DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `endpoint_url` varchar(2048) NOT NULL,
  `username` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name_UNIQUE` (`name`),
  KEY `customerId_fk` (`customerId`),
  CONSTRAINT `customerId_fk` FOREIGN KEY (`customerId`) REFERENCES `customer` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `service_providers`
--

LOCK TABLES `service_providers` WRITE;
/*!40000 ALTER TABLE `service_providers` DISABLE KEYS */;
/*!40000 ALTER TABLE `service_providers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sip_gateways`
--

DROP TABLE IF EXISTS `sip_gateways`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sip_gateways` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(128) NOT NULL,
  `address` varchar(256) NOT NULL,
  `port` int NOT NULL,
  `digits_strip` int DEFAULT NULL,
  `description` text NOT NULL,
  `customerId` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sip_gateways`
--

LOCK TABLES `sip_gateways` WRITE;
/*!40000 ALTER TABLE `sip_gateways` DISABLE KEYS */;
/*!40000 ALTER TABLE `sip_gateways` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `state`
--

DROP TABLE IF EXISTS `state`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `state` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL,
  `label` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name_UNIQUE` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `state`
--

LOCK TABLES `state` WRITE;
/*!40000 ALTER TABLE `state` DISABLE KEYS */;
INSERT INTO `state` VALUES (1,'NEW','New'),(2,'ASSIGNED','Assigned'),(3,'SUSPENDED','Suspended'),(4,'CLOSED','Closed'),(5,'REOPENED','Reopened');
/*!40000 ALTER TABLE `state` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscription`
--

DROP TABLE IF EXISTS `subscription`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `subscription` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customerId` int DEFAULT NULL,
  `serviceId` int unsigned NOT NULL,
  `startDate` timestamp NULL DEFAULT NULL,
  `endDate` timestamp NULL DEFAULT NULL,
  `readonly` tinyint NOT NULL DEFAULT '0',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deletedAt` timestamp NULL DEFAULT NULL,
  `isDeleted` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_sottoscrizione_cliente1_idx` (`customerId`),
  KEY `fk_sottoscrizione_servizio1_idx` (`serviceId`),
  CONSTRAINT `fk_subscription_customer` FOREIGN KEY (`customerId`) REFERENCES `customer` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_subscription_serviceprovider` FOREIGN KEY (`serviceId`) REFERENCES `service_providers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscription`
--

LOCK TABLES `subscription` WRITE;
/*!40000 ALTER TABLE `subscription` DISABLE KEYS */;
/*!40000 ALTER TABLE `subscription` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket`
--

DROP TABLE IF EXISTS `ticket`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ticket` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customerId` int DEFAULT NULL,
  `serviceId` int unsigned NOT NULL,
  `slaTimeout` timestamp NULL DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `creator` int NOT NULL DEFAULT '1',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deletedAt` timestamp NULL DEFAULT NULL,
  `isDeleted` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_ticket_cliente1_idx` (`customerId`),
  KEY `fk_ticket_servizio1_idx` (`serviceId`),
  KEY `fk_ticket_User1_idx` (`creator`),
  CONSTRAINT `fk_ticket_Creator` FOREIGN KEY (`creator`) REFERENCES `User` (`id`),
  CONSTRAINT `fk_ticket_Customer` FOREIGN KEY (`customerId`) REFERENCES `customer` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_ticket_ServiceProvider` FOREIGN KEY (`serviceId`) REFERENCES `service_providers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket`
--

LOCK TABLES `ticket` WRITE;
/*!40000 ALTER TABLE `ticket` DISABLE KEYS */;
/*!40000 ALTER TABLE `ticket` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `create_ticket_subch_and_subscribe` AFTER INSERT ON `ticket` FOR EACH ROW BEGIN
call create_subch("ticket",NEW.id);
call add_subch_subscription("ticket",NEW.id,NEW.creator);
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `tracking_sources`
--

DROP TABLE IF EXISTS `tracking_sources`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tracking_sources` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(512) NOT NULL,
  `type` enum('onsite','offsite') NOT NULL,
  `position` int unsigned NOT NULL DEFAULT '0',
  `last_touch` tinyint unsigned NOT NULL DEFAULT '0',
  `global_unique` int unsigned DEFAULT NULL,
  `customerId` int DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `description` text,
  PRIMARY KEY (`id`),
  KEY `index_ts_name` (`name`),
  KEY `customerId` (`customerId`),
  CONSTRAINT `tracking_sources_ibfk_1` FOREIGN KEY (`customerId`) REFERENCES `customer` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tracking_sources`
--

LOCK TABLES `tracking_sources` WRITE;
/*!40000 ALTER TABLE `tracking_sources` DISABLE KEYS */;
INSERT INTO `tracking_sources` VALUES (1,'OTHERS','offsite',0,0,NULL,1,'2022-02-26 14:35:23',NULL);
/*!40000 ALTER TABLE `tracking_sources` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tsources_phonebook_rel`
--

DROP TABLE IF EXISTS `tsources_phonebook_rel`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tsources_phonebook_rel` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `tsourceId` int NOT NULL,
  `pbookId` int unsigned NOT NULL,
  `counter` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tsource_pbook_index` (`tsourceId`,`pbookId`),
  KEY `pbookId` (`pbookId`),
  CONSTRAINT `tsources_phonebook_rel_ibfk_1` FOREIGN KEY (`pbookId`) REFERENCES `phonebook` (`id`),
  CONSTRAINT `tsources_phonebook_rel_ibfk_2` FOREIGN KEY (`tsourceId`) REFERENCES `tracking_sources` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tsources_phonebook_rel`
--

LOCK TABLES `tsources_phonebook_rel` WRITE;
/*!40000 ALTER TABLE `tsources_phonebook_rel` DISABLE KEYS */;
/*!40000 ALTER TABLE `tsources_phonebook_rel` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_contact`
--

DROP TABLE IF EXISTS `user_contact`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_contact` (
  `id` int NOT NULL AUTO_INCREMENT,
  `contacttypeId` int NOT NULL DEFAULT '1',
  `userId` int DEFAULT NULL,
  `value` varchar(255) NOT NULL,
  `verification_code` int DEFAULT NULL,
  `verified` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_contact_idx` (`contacttypeId`,`value`),
  KEY `fk_UserContact_ContactType1_idx` (`contacttypeId`),
  KEY `fk_UserContact_CerberoUser1_idx` (`userId`),
  CONSTRAINT `fk_user_contact_ContactType` FOREIGN KEY (`contacttypeId`) REFERENCES `contact_type` (`id`),
  CONSTRAINT `fk_user_contact_User` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_contact`
--

LOCK TABLES `user_contact` WRITE;
/*!40000 ALTER TABLE `user_contact` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_contact` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `version`
--

DROP TABLE IF EXISTS `version`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `version` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ticketId` int NOT NULL,
  `owner` int DEFAULT NULL,
  `version` int NOT NULL DEFAULT '1',
  `priority` int NOT NULL DEFAULT '0',
  `state` int NOT NULL,
  `scheduledSince` timestamp NULL DEFAULT NULL,
  `scheduledTo` timestamp NULL DEFAULT NULL,
  `note` varchar(1024) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deletedAt` timestamp NULL DEFAULT NULL,
  `isDeleted` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_version_ticket1_idx` (`ticketId`),
  KEY `fk_versione_stato1_idx` (`state`),
  KEY `fk_versione_utente1_idx` (`owner`),
  CONSTRAINT `fk_version_State` FOREIGN KEY (`state`) REFERENCES `state` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_version_Ticket` FOREIGN KEY (`ticketId`) REFERENCES `ticket` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_version_User` FOREIGN KEY (`owner`) REFERENCES `User` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `version`
--

LOCK TABLES `version` WRITE;
/*!40000 ALTER TABLE `version` DISABLE KEYS */;
/*!40000 ALTER TABLE `version` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `create_version_subch_and_subscribe` AFTER INSERT ON `version` FOR EACH ROW BEGIN

DECLARE prev_ver INTEGER DEFAULT 0;
DECLARE finished INTEGER DEFAULT 0;
DECLARE prev_vers CURSOR FOR SELECT id from version where ticketId=NEW.ticketId AND version != NEW.version;
DECLARE CONTINUE HANDLER FOR NOT FOUND SET finished = 1;

OPEN prev_vers;
del_subs: LOOP

	FETCH prev_vers INTO prev_ver;

	IF finished = 1 THEN
		LEAVE del_subs;
	END IF;

	call delete_subch("version",prev_ver);

END LOOP del_subs;
CLOSE prev_vers;

call create_subch("version",NEW.id);

IF (NEW.owner IS NOT NULL) THEN
	call add_subch_subscription("version",NEW.id,NEW.owner);
END IF;

END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `whitelist`
--

DROP TABLE IF EXISTS `whitelist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `whitelist` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `ip` char(50) NOT NULL,
  `mask` tinyint NOT NULL DEFAULT '32',
  `port` smallint unsigned NOT NULL DEFAULT '0',
  `proto` char(4) NOT NULL DEFAULT 'any',
  `pattern` varchar(512) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `whitelist`
--

LOCK TABLES `whitelist` WRITE;
/*!40000 ALTER TABLE `whitelist` DISABLE KEYS */;
INSERT INTO `whitelist` VALUES (1,'127.0.0.1',32,0,'any',NULL);
/*!40000 ALTER TABLE `whitelist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `workflow`
--

DROP TABLE IF EXISTS `workflow`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `workflow` (
  `id` int NOT NULL AUTO_INCREMENT,
  `origin` int NOT NULL,
  `target` int NOT NULL,
  `action` varchar(255) NOT NULL DEFAULT '',
  `supervisor_needed` tinyint NOT NULL DEFAULT '0',
  `last_login` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_workflow_stato1_idx` (`origin`),
  KEY `fk_workflow_stato2_idx` (`target`),
  CONSTRAINT `fk_workflow_Origin` FOREIGN KEY (`origin`) REFERENCES `state` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_workflow_Target` FOREIGN KEY (`target`) REFERENCES `state` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `workflow`
--

LOCK TABLES `workflow` WRITE;
/*!40000 ALTER TABLE `workflow` DISABLE KEYS */;
INSERT INTO `workflow` VALUES (1,1,2,'Assign',1,NULL),(2,2,2,'Reassign',1,NULL),(3,2,3,'Suspend',0,NULL),(4,3,2,'Recover',0,NULL),(5,2,4,'Close',0,NULL),(6,1,4,'Reject',1,NULL),(7,4,5,'Reopen',0,NULL);
/*!40000 ALTER TABLE `workflow` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'ecms'
--

--
-- Dumping routines for database 'ecms'
--

--
-- Final view structure for view `ACL`
--

/*!50001 DROP VIEW IF EXISTS `ACL`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `ACL` AS select `at`.`id` AS `id`,`at`.`model` AS `model`,`at`.`property` AS `property`,`at`.`accessType` AS `accessType`,`at`.`permission` AS `permission`,'ROLE' AS `principalType`,`at`.`roleName` AS `principalId` from `ACL_template` `at` where (`at`.`roleName` like '$%') union all select ((`r`.`id` * 10000) + `at`.`id`) AS `r.id*10000 + at.id`,`at`.`model` AS `model`,`at`.`property` AS `property`,`at`.`accessType` AS `accessType`,`at`.`permission` AS `permission`,'ROLE' AS `principalType`,`r`.`name` AS `principalId` from (`ACL_template` `at` join `Role` `r` on(regexp_like(`r`.`name`,`at`.`roleName`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `RoleMapping_R2R`
--

/*!50001 DROP VIEW IF EXISTS `RoleMapping_R2R`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `RoleMapping_R2R` AS select `RoleMapping`.`id` AS `id`,'ROLE' AS `principalType`,`RoleMapping`.`principalId` AS `principalId`,`RoleMapping`.`roleId` AS `roleId` from `RoleMapping` where (`RoleMapping`.`principalType` = 'ROLE') */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `RoleMapping_U2R`
--

/*!50001 DROP VIEW IF EXISTS `RoleMapping_U2R`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `RoleMapping_U2R` AS select `RoleMapping`.`id` AS `id`,'USER' AS `principalType`,`RoleMapping`.`principalId` AS `principalId`,`RoleMapping`.`roleId` AS `roleId` from `RoleMapping` where (`RoleMapping`.`principalType` = 'USER') */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `redis_subscription_view`
--

/*!50001 DROP VIEW IF EXISTS `redis_subscription_view`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `redis_subscription_view` AS select `u`.`username` AS `username`,concat(`rc`.`name`,'.',`rsubch`.`value`) AS `channel` from (((`redis_subscription` `rsubs` join `User` `u` on((`u`.`id` = `rsubs`.`userId`))) join `redis_subchannel` `rsubch` on((`rsubch`.`id` = `rsubs`.`redisSubchannelId`))) join `redis_channel` `rc` on((`rc`.`id` = `rsubch`.`redisChannelId`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2022-04-12 17:04:59
