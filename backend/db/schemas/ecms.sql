-- Host: localhost    Database: ecms
-- ------------------------------------------------------
-- Server version	8.0.29

CREATE DATABASE IF NOT EXISTS `ecms`;
USE `ecms`;

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for `migration_schema`
--

DROP TABLE IF EXISTS `migration_schema`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migration_schema` (
  `version` VARCHAR(5) NOT NULL,
  `name` TEXT NOT NULL,
  `hash_sum` VARCHAR(50) NOT NULL,
  `date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE INDEX `idx_version` (`version` ASC)
) ENGINE=InnoDB;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Temporary view structure for view `ACL`
--

DROP TABLE IF EXISTS `ACL`;
/*!50001 DROP VIEW IF EXISTS `ACL`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!50503 SET character_set_client = utf8mb4 */;
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
INSERT INTO `ACL_template` VALUES (1,'$authenticated','Customer','*','READ','ALLOW'),(2,'$authenticated','Workflow','*','READ','ALLOW'),(3,'$authenticated','Ticket','*','*','ALLOW'),(4,'$authenticated','Version','*','*','ALLOW'),(5,'$everyone','ECMSUser','login','*','ALLOW'),(6,'admin','ECMSUser','*','*','ALLOW'),(7,'operator','ECMSUser','*','READ','ALLOW'),(8,'admin','Group','*','*','ALLOW'),(9,'operator','Group','*','READ','ALLOW'),(10,'admin','Notification','*','*','ALLOW'),(11,'operator','Notification','*','READ','ALLOW'),(12,'viewer','ECMSUser','*','*','DENY'),(13,'viewer','Group','*','*','DENY'),(14,'$everyone','Notification','*','*','DENY');
/*!40000 ALTER TABLE `ACL_template` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `AccessToken`
--

DROP TABLE IF EXISTS `AccessToken`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
INSERT INTO `AccessToken` (`id`, `ttl`, `scopes`, `srcip`, `created`, `userId`) VALUES ('oYnh2eK16Zxx5dKWD9Go8EGD5GyFzsDH9cz4uFoBYfDPBJlgbr2wJeivFc3xJg0x',1209600,NULL,'127.0.0.1','2022-08-08 13:01:18',2),('rDb8sb9DxeANRWBgjM9WyvomSex4bMQGQkLTSVKzIaxHJKNlLYOhwx5fDV424EcV',1209600,NULL,'127.0.0.1','2022-08-08 19:31:35',3);
/*!40000 ALTER TABLE `AccessToken` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Role`
--

DROP TABLE IF EXISTS `Role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
INSERT INTO `Role` VALUES (1,'Administrator',1,'Manages all aspects of an account','2022-02-26 14:35:20','2022-02-26 14:35:20'),(2,'Admin',1,'Company Admin','2022-02-26 14:35:20','2022-02-26 14:35:20'),(3,'User',1,'Normal User','2022-02-26 14:35:20','2022-02-26 14:35:20'),(4,'DIPVTEL User',2,'DIPVTEL Normal User Role','2022-08-05 10:39:51','2022-08-05 10:39:51'),(5,'DIPVTEL Admin',2,'DIPVTEL Administration Role','2022-08-05 10:39:51','2022-08-05 10:39:51'),(6,'Tax Networks User',3,'Tax Networks Normal User Role','2022-08-08 19:31:15','2022-08-08 19:31:15'),(7,'Tax Networks Admin',3,'Tax Networks Administration Role','2022-08-08 19:31:15','2022-08-08 19:31:15');
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
/*!50503 SET character_set_client = utf8mb4 */;
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
INSERT INTO `RoleMapping` VALUES (1,1,'ADMINISTRATOR',NULL,1),(2,2,'ADMINISTRATOR',2,5),(3,3,'ADMINISTRATOR',3,7);
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
-- Temporary view structure for view `RoleMapping_R2R`
--

DROP TABLE IF EXISTS `RoleMapping_R2R`;
/*!50001 DROP VIEW IF EXISTS `RoleMapping_R2R`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `RoleMapping_R2R` AS SELECT
 1 AS `id`,
 1 AS `principalType`,
 1 AS `principalId`,
 1 AS `roleId`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `RoleMapping_U2R`
--

DROP TABLE IF EXISTS `RoleMapping_U2R`;
/*!50001 DROP VIEW IF EXISTS `RoleMapping_U2R`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!50503 SET character_set_client = utf8mb4 */;
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
  `languagesId` int unsigned NOT NULL DEFAULT '1',
  `tracking_numberId` int unsigned DEFAULT NULL,
  `note` varchar(255) NOT NULL DEFAULT '',
  `firstName` varchar(64) DEFAULT NULL,
  `lastName` varchar(64) DEFAULT NULL,
  `primaryAdmin` tinyint(1) DEFAULT NULL,
  `timezone` varchar(8) DEFAULT '-00:00',
  `ui_settings` json DEFAULT NULL,
  `last_login` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username_UNIQUE` (`username`),
  KEY `fk_customer_utente1_idx` (`customerId`),
  KEY `fk_languages_User` (`languagesId`),
  CONSTRAINT `fk_customer_User` FOREIGN KEY (`customerId`) REFERENCES `customer` (`id`),
  CONSTRAINT `fk_languages_User` FOREIGN KEY (`languagesId`) REFERENCES `languages` (`id`),
  CONSTRAINT `fk_outbound_Number` FOREIGN KEY (`tracking_numberId`) REFERENCES `op_number` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `User`
--

LOCK TABLES `User` WRITE;
/*!40000 ALTER TABLE `User` DISABLE KEYS */;
INSERT INTO `User` VALUES (1,1,'sadmin','L3tMe.In',NULL,'info@techfusion.it',1,NULL,NULL,1,1,NULL,'','CMS','admin',1,'+02:00','{\"darkMode\": true, \"fontSize\": \"font-size-normal\", \"fontStyle\": \"font-opensans\", \"filterMode\": \"filter_options\", \"isGradient\": false, \"lineHeight\": \"line-height-normal\", \"isBoxLayout\": false, \"isBoxShadow\": false, \"isIconColor\": false, \"subMenuIcon\": \"list-a\", \"wordSpacing\": \"word-spacing-normal\", \"customAvatar\": \"data:image/png;base64,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\", \"isHeaderDark\": false, \"isRTLSupport\": false, \"customLogoImg\": \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAAAvCAYAAACmGYWkAAABhGlDQ1BJQ0MgcHJvZmlsZQAAKJF9kT1Iw0AcxV9TtUUrDnYQEcxQnSyIijhqFYpQodQKrTqYXPoFTRqSFBdHwbXg4Mdi1cHFWVcHV0EQ/ABxdHJSdJES/5cUWsR4cNyPd/ced+8AoV5mqtkxDqiaZaTiMTGTXRUDr+hCED0YRpfETH0umUzAc3zdw8fXuyjP8j735+hVciYDfCLxLNMNi3iDeHrT0jnvE4dZUVKIz4nHDLog8SPXZZffOBccFnhm2Ein5onDxGKhjeU2ZkVDJZ4ijiiqRvlCxmWF8xZntVxlzXvyF4Zy2soy12kOIY5FLCEJETKqKKEMC1FaNVJMpGg/5uEfdPxJcsnkKoGRYwEVqJAcP/gf/O7WzE9OuEmhGND5YtsfI0BgF2jUbPv72LYbJ4D/GbjSWv5KHZj5JL3W0iJHQN82cHHd0uQ94HIHGHjSJUNyJD9NIZ8H3s/om7JA/y3Qveb21tzH6QOQpq4SN8DBITBaoOx1j3cH23v790yzvx8KPXJ99GViawAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAAuIwAALiMBeKU/dgAAAAd0SU1FB+YGCAspIttOvp4AAAAZdEVYdENvbW1lbnQAQ3JlYXRlZCB3aXRoIEdJTVBXgQ4XAAAgAElEQVR42u19Z5RUxdb2s6vqdPcEhmHIOScJEiWDEgQRVFBBVIyYMF3FrNfwGq7iVTGgXLIoGVFEESQjoOSch5wZJs/0dJ9TVfv70SPoZXoYEO/7retbrLNYC7qrK+xnh2fvqkP4v3bBTUqJSrXL45pbu6Jh6/qoWK0cPnllFN6f9BYysjORp3Ng2QIAfMKPUollUBNVMXPNbGjPYM/mffhxymJs+Xk7tKfBfGnHR0QoViIOPQd2RdtrWqFSjQpQjkKVapWQkpECz4Yj8yCFOF88KsdVxJzF8+H4HGxauRWzRv+Aw8nHwPbcgUlHolW35rjm1i6o3bgGVvy4CoOG3IHUzNMImxAYDCJCQMYiKaEEJnwyBc3aN8GuDcn4/osfsfGnrTDaXJI5xifGovstndGuZytUqVMRS2evxJ1PDEBaVhq0dcFgOOSgVImy+GneClSqXhGH9xzB0tk/44eJC5CXGwLOs/Z00UKiJGLjAxBSIBQMww154IvYaSKC43cQE+cHMxDMzoP29P+fwFASra9ujj6DrkXKidPoPbAHjLZk2RIRKQL5GRyXZ3LIIgIQh3zwi5gQgJCF8QhkQODSxUvhp8W/4Mcpi/Dt+HnQ7qWZs3IU+j96A667pwdqXFYVuZl5BEAAcAgUE7Z5AY/dMwAJiFgPQJDBLgAjBPHkj2YgLiEeo1//Apmns8/sU6M29XHXcwPQt3dvHMw8DGYrGFACwq/ZiwvbPGIwCISAiLOCRC4zh4nICBK2TvGa+GLmNIx560vsWp98UfLy6xxveewGXDuwO+peXgtZmVlgZiGhfBY24NlwwGWXAIYi59f1zwPgCRK2WEI8b12zA5M/+QpzJy2CNfbSAYSI0L53K/QbfAPK1ywD5UhkpeRgwfRl+PK96YX+WEETHfjUzbjyhvZIKBMPYuD4/lOY+OEMrJi9+qIX8FI3IkKNRlXxwMt34okbH8LPmWtg2CiAihvW1SzbxgzbAEANBlc0bOSvqklAQJBMA3CQQDuJxAYJsZNInhYQXmxcHK9ZuhafvzsVqxesL1BrF7VVqFEOT33wMFp1awEv7AnDOt7C1mTm1gzbGEANy6bkr+AlEATJXAIdJNBWAq0WJLYJyDQImJkjv8O6xZuw6sd1uPXJm/DS0CE4nnGSAPgMm4qWdVML2wJAPYataNiIM8qElEegwwB2SJLrBORGReoESHgNi9fjR4c8i8nDvoK9wPlWqVsRT33wCFp0bALtGWHYxBro6pZNMwZaALaGZVvGwlJkjgKCRCqBkgXEekFyjSJnnyCZG1c8hmeOno2hj34MN+T9cYAQEe55/ja89eaL2JGxhzR7BDBJcqySimeNm4P3n/ysSCBx/A7emfIK2nRvATfskseuIAhIUlYFFL/72Mf4dvTc/3WQSCVx65M3okHLumjXrTVp1j5mW12z19XC9rRsGzK4JMA+ALKQrhiAR6AsAZFMJOYrcr5X5GwDECyVWJJHDB2HES+Phxf2LnicTTo0ws0PXIf217YmA13MWN3OwNxq2bYHuCxHxicKGZsmUDpBbBIkpkhScxxyUtomtrTDZo5Em6tbQGujDOs6mr3+FvZ6ZludwbGFzJsBGALlChJ7BNS3ipxpksQ+JZWeOuJrfPL8mCIr1bbXXIGD2w5h0qZRZFgXs7DtDHv9Ldv2FlweYH8hc7QEChPouCS1WJKaIEiuFSTytq/bhb/f8RZOH007d/8vBBx3PTMAg14YiOPBE34D3dCwvs6waQtCCbZIqdOkZrh0hZJY9ePaQgU7EB/Aq6OeQdvuV5DrhYtr6A6avZ4WtjmDoT3vdLseV5jM1CzsWp/8vwaOhJLxeHnM0+hzb09UqF5OaTY1NbsPeuy9amD6M2w9gIsDcPI3hs7zKABxDK5kYdtaNj0MbGUGH88Lh9IatqxvGrWqj/XLNyM3K1jkcba4qgm69OmEq/t1Fh67tTR7L2r2nrewrQBOKuL4JIB4Ble34M4AN2a2h46ETxyvVKOCNVbHezZ8k4b3rmHdh8EVAASK2G+AwRUYtq2BacfgLGY6UK95LbdCtXJY+cP5vYV211yBL+aMQOe72gsDXU+z+5Jm71kL2yaioM47RwHAYXCShWls2HRmcDyDd5WtUCY3qXQidm1KRm5m8MIBQkToe/+1ePztB+B5XpzL7iCPvaEW5hYGX23ZXGNh4yXkugZN64ecgMK6JZuiauTXxjyLjr3akmavqsvh1zW7L1jY3gzb3bLpAuI0wWpn95s7m12bk3Fgx+H/ODjK1yiLR98ehA4925K2uphm73rN3tsG5maGLZ+/IRcbwxEAyeBEC9OM2XZiwDJjb/mqZUN7Nu+F4zhIPZF23o7qNauF+166E52uays967XyOPy+Yd0HQPFCtOn5xuZn2FoMbitIpDPzKc3eI5q9lxi2Zj7Q6SL6VQyuYNl2tDCWGVtqNKwWLlE6Eavnb4gKkuZXXo7x8z/FqczTymO3nWfD7xuY3n9gjgLgEha2JcDVAd5Yq0HN9Gp1K2PlvNW/s+BFAkggzo9nP34c8Qmx5HK4m8feuwxbNV9IJIA4gBsBdIIgNq1fvsW6oTBSjqae01en69rin2++jhOhkwHXhp7TrAfla2GV/yQB1ESQXK/D9mCtRtUxb+qii3I7LrZVa1AZfFrgiU8eIAZX8th9xrB+nmHr/EFgFKgzGFyaYdszbDkBsb1L76syX3h8CH83dy5Sjp4udF/+PuppNGp9GWn2mrgc/tiwbps/xj/aBINLWeY2FqapYT0gX1P/0blTxIraZgA8RWpT4+YNXQODTSu2nfPh4iWLocftXVC9UVXhcqiFZnd4ftxzKeboy9/TKgLil8o1K2VVrVsZS2etPBMLFgkgLTs3Q70GdVG+alm/a93HDHSHApDrB1CZiBY2a3d5WumKpbDoq59+F3QSEboPvBJVOlRATjCnhGH9AsBVz11ATiAgQZBcUKJUYp4QwLolm/9DlqMM+jx0DZ4a8yAZ6FoG+p+Gza352or+pJ+liBtiGwJoAPCm025aSiDWz3u3H0BWWva50isIf3v/QbTreQU0e+U8dt8xrK/MVzKXbFwMLpYvRDGXeM4xAJoIiBMCcktS6UR7cM9hHD9w8jdzFBgybDCuu+saWDYVPXbfN2zaFEFu+QLibMngGgA7gsSKWg1ruMHsILau2vmrqTl/iysWh8RSCSAIAaBYlB8lC1PfsL7Hsg107dMJ3fpfee6HBMCwYLZUyGZKw6aLtl5Pa6xs37M1KtQo+x+JOZ79+DHccGcvYqCWZTvUsOl1gcLBBTxFbX7NXhePw+8Z1vW79O1IL498GjHxgXM+2LRTI+Tm5MJa6zOsBxo2V19icPybS3LpG4OTNOsnNHsNq9WpSvc+fzuUc3YKtZtUhzEGhj3H43A/w6ZT4YQAhQlivyJnmU8E5jjkny8gNxIoHUAhTAAHDOvbtfW6hkNhcc3ALkgoGV90C5KRloEbH+4NX6zDhnVpC9s1iomTDFQSRL94YX24YvXymDd18VmOn4DKNSvi+l49kRvOIwvbjmEviwI4PwNlBNH8pJIlMpPKlsCyb3/+01gt6Ui8MuYZtLyyKTFQxUD/k2GvBeArwtctQHkEcVpA7AGwgUC7CLRbQJ4ikM1fa1kEYRMWtrKFLSMgVpapUDq7fNUy+On7X87MXUqBR4feh6tvvgoRVkm/hUjQTOcBriZQDoGy8v8OR1TWmeD2YpsBKESgjPx+8wj0a4BO57FQJQBYSWJJ1dqVvSP7jmLPln0QgnD/K3fgmgHdYNlW1Oy9weAqUfpjAh1wyPlECec1v/CPjpXx0yXJrwj0tSCxNmIJuUohSiQAonhFztxSZUvlaU9j/bLNRQNIOOiibtOaqF6/KgM4bdl2YHDFggfLxQDESshFpcqVDBljsPGnrWf+93DyUdRtVwtJZZM0mIMW9upIDFPQ4qE0gVIFqTXNWl9u1v+8CUf2Hv9T8hx3PtMfN9zdE9rqBI/Dz1s2A/LdxsKaJogTkuQ8h5zhjnA+dMg3ysJOAugrAmYGROxMSWo2gZYTiTQAJRiccB7lJAGuyYARJFbVb1LXS0tJx871u/M1aw0ox0Gzjpcrw3qQge57HuvhCYidktTnitRHgsRoSWqKIPmNJLkZBAugbP58LwQoTKAUQXKWIme4IPGpFM5EATFNCmcVgfIYKIMIFUyFWKdygtQi1jhRrEQ8fpyyGD6/g3teuA0JJYqRhb7KsL4v2n7kW40nFPkmSFLHfMoJblu5J1y2WqkQw2YKyF0AfgJQNl8hy4LdXE4SRMvI0kF/rA9zJy4sGkCYGQd2H8apEyfRvEPTHIA9hu0cZcACEfBsI6ZdRw8c592b9iKYlReRKFcjvngcOl3blo02JyxstfwkVkGaVQFchYiWumHvZLkqZfDj1CWw1l5SgNRrXhv/M+45eForDd3fsPdMvitZmGCkS1JfOcL3d5/wj1KkVgmSR4WUWaQ4TJJcKaXrE4EggU5JkrsIcrEkuQSAx+Bq+YohmuA4DFubiLayoeQdG3bx4eSjCOWGcduTN+GOIf1grSnlwXspv68o/VBYkfONEs4TDvlmSKF2MHBUEB1VpA4o4awj0I8ESgG4KYPjiwgSJtAuRc6zipyPlHDWEOgQgY4JEkcc8m2WJBeAaLtlUwtAuWj9MjiGQEcEyZ9XL1pvjx08AZ/fQafr2yCpdKLy2LvJwnQpWEbIdcgZJkl94fM54W1rdmDJrBXYvSUZm1ZtQ9qpdGxcuZUva1Yni0A7mLkTg8tGGYsjIPZJkiviEuJ4wfQlRc+DZKVmo3OfjmjYsr4lpqMWtjHD1o7mHgEoQyTmX3Z53ezEUglY8f1Zrnv3xmQ06dAIZcqX9gAct2y75vP1BZngRAKRILG0ep0qbmpKGnas3XPpXCsp8dSwwShftSwMm9qedYcybPVChMQSxG5FzquKnGEO+Xb5HF9o364DfGT/cWxavgWLvlmOX+auw7rFm3E0+RiC2UEIIbhp1cZeZjjrhCC5HMBeAPXzmaFoblcswKUAzGvW/vJcx6+wYelm3PFMPySVKUGGTXPDenAUCwwARpKa66eYIQ75dlctUUnv2LkbB5MPI+VoKrIzc5CVlm1LlUkKKlJbLWw2w7bPz2+ch1WgE4rUEEFqlqOc4JG9x/jYoRM4efgU0lPSEczO41JlS4aN1ckE2gNwx3x3qkArQgRIUrMatboslHE6A9ZjJCUloU7D2n4N727DpnFBeyIgMvwy8KYSzqFdG5Lxt94vYOXcNdj08zZs+Gkzln37M/wxPrTs0gQx/tgsC1PZwrSJsuZERCck1JzDu4/oQ3uPFj2oY2aMeXMimnW8HNXqVE5VUJ9ZNlcwuFwUP7qVZdPfMn/yyH33u/OmLMLaRZHciBvyMOnDGRj+zbucmpG62ZCZoNl9PsrGKMO6j2E5Oy83NK/7LV3sgulLkZGSdUkA0rJrE/S4qTNOp6f5PXZvszANCwcHbZYkhijhWy4FuQd3HcbSWSswa+wPyDidCWPsOWG5EIRAXACdrm+L6+/pyQ1b1s8WnpgZsnlHmfl9hm0eZcOEYduaoLsLlpN8MY6pWLM8ylctDxAJZtsi312LIsQixSHfB4LEodceeoslfPjpu1/OlFUIKVC2cik8+vb9aN2tRVCxbwrD9tCse54nVtKS1Awl/D86jvS+GTMH496ajKy0HDBHihUTkuJx2xM34/5nB+rTGekr2PIYy/blKF4HWbZ1LduKXlin121SC4d3HwPDwsISOLqlJRJGkS/kCMW56UF4/1YTyMz4ed4aZKcGUbxYoqfIWafZCzM4JoqbVUmQDFzW7LK8uo1rFd2CAIAX9iCVRPuerdlqPpGfEW4SxadTAFcWREtSw+kpZSuWwvzpS8/QvoeTj6Fi7XKoWqeyIdBhC9s+elyDWACJkuSC0uVL5vpj/Fi1YP2F8UNRrMejbw9C6fKlYGDqatavIWJ+o7gU4pAi50kBsTg2Lsab+sk3eO2ed7F20UYEs/MidUVcsHLxwh72bNmHeZMWwrJFj55dbE4o56gkecSy7QBwYjSuHkRxCmpO/Wb18gKxfoSyw6hYvZxfs3e3jeQTClozK0nO9QnfiIA/EN65bg++GfUDPFeDLYMtwxqLrLQcbF65DZVqVkC1WlXCFtaxbLoXlmcg0ElFzkuK1IGdG/bg1bveRU5mLqy1kX6tRV5uCOuWbkLNJtVQvmpZA1Aas+0dzYoQSEqSyyXkDmZgzcINqFa7Kuo0rKk8hHsajqa42CNgNjMOhEJ5mDNxIYx3brVwx95tUaFqBWKYgMdeQ4DTAJz490eS2h8QsT8E/IG8jSu3XBh9xwzMGvsDNq7cCiKRK0mNEhD7olCZZGFra9Z3AxzTtkcr9BzY9cwUrbEY/eYXeO3BtyFIHpJQIwiUHZXZYdPJs24va616ccgQ1GhQ9Y8nBOtXRk5mLhhQ+ZtXvRChCCpSHzvCtyguLl5/+PRIfPr8WIRyw0Vn1hjwXI2xb03C3x/7B2IDsUaRs0iR+oRAuVGZHrYtDExTow117N0WHXq1ASKVw1ULsXZaQP4EUPDk8VP4dvy8qOM8fTwtQr8TWwGxGqDThc1CkNylhLPbH+vjtYs3Rk3iWm2xeuEGVE2sAkXqEJHYGo32ZrDPMlchkEgoEY9jB08gkOjA5bBnmfdGmLICvxevWfc0bGKqN6iKv48aggrVy0GIs8titMH49ybBiRPs2vBmMPcnpl4FPcz8mGYvY+JnUzH5kxkXzm97YY3x70zG6/cOZQG5XZAcD1A4WqBp2PTT1msVzAnSzQ9dh7iEs5btwPbDaND0MkgptSL1nSCxKBpfzeB4w+ZBw7rq9sxduPfF2yHkxdPzRIRu/TqhW/+rYFgXN9A98gsOo8UdSwXJiYJkeNbYHzB9+LcXXIl6Zi6WMf3TWfjuyx8hSYYU+SYSxIp8ITgnj8LgBMumq4BwpCS4JgzNbgyDy0R1PUBBQbQdgD155NQ5NUb/Pp4jycchpYQklSJIHC8kf8ME2k6gnHmTF2Ht4o1RgcfMWL1gPfal7AeBQgJiVyH5CGGhy7kcJhkQMMagWt0qANgI0DYCuVG+pwzrWzwO99Ja+ztc2wb/nPkaXhjxJGo1rg7lUyAirFu4CXe0HoxKSRU8IcVJIjpe0KN8MvWb0XPsJ8+NRkZK1rkxCBFB+RT8MT4YbRAOuuewRmsXbcQr456GFNJl60yxbHtZmLYFbRbDljPQgyWrzTXqVUu94+lbMOLv48HMYGaMfWsiGrSqi7qX104TLIdb2FYMLh8lEdlYsx4orHz79v79QvOnLcHimcsvzr1SAo3aNIB1LVnY2paj5mNAoBxJcryASDl+5ARGvvr5BZX1F4g4YzHilXFILJOA5h0vPylIfMRsQ9FcG4IwipTTsWxXd2HuArjWJQYXwjZRmIEUC8NpKennZf5OHT6Nk/tTUK5K2bCLcKaBLiTngb3M1lzeoQHef/KzQvtNPZEON1cjpkScNWROe+xxFOyRgCwVI+JV8pbtukz5Ujiw4zAqVavIkpz1mr0jDK4TRXlWMKzfIVB5sjS9QrXyJyvXqGxKlk9ETGwMfvr+F3z/xY/YvT4Z/dsPQqe+baFUwdFFblYepg77BuE899c44TdQ9CkMeLwvOvZug2Il42BdYNuanRjx6jikHkv/3eaOefNLBHOC6DGg62FJagSzbcAF+9HSsu2moa8hQ5OLl04wFWuWw5HkSD4jmJWH+VOWoGGL+pY8/MKWv9HsDYoiKH7L5g5DZu6+jP2r7niqPy//ftVF1WnFJ8ahfJUyYFiybJtypB4sWuyxR5JaKYSwG5ZuRsbpS0MQpB5Px8yR36F11+bWhPU8hviJo4BUQGhBKjh1y1coVSMBfJ4AjIjYIYclSQgW5yVgMtOywJE/mmFTC3E1IUm5kiSzh/OeDrTGgqyEI3zscThEiHqAkiTJkko4UpJCUukkLJi+FPfccht2Z+w9pEnNtuw+GiVxSwyuqtl7w8L0lFBfsLWLL2/X6JQipZu2u5w7Xt8GyZv3Y9rwb/DZs59HFAZHX49zSgh8AQfvTHsFg1+/F3Ua1aKS5ZJEhWrlqEf/LqjUoByqN6zyu04O7z6GzNRsSCGMJPmDILGgED8xwUA/ZNlW6tGvMwa9NPCMe8TM+HbsXGxcvhUEkavI+ZeA2BvNxFvYypq9By1sQq1G1THgb31BdOFJ4Mq1KmLZ178AIJV/2ClaUGoF0QoBcfrUsdNY8Bui4VK0n+esxZA+L2PGyNnaF/BlKSUzC3p279ue+9MPK3n5gpUX4kiCzlR7F94y0zPhsQuXw9bC5hVWIiMhociBLAIJai3DWhNxFMFhLqTkgwHxq3ASEZbN/hkTZk4FgLAgOVJArinERaN8N7yrZ93hYZs3yePwkx67LYN5wYQ6jWuK3nf0QKe+bfHSqCdRrV7lCGeV78n89vk3pgnwx/rx/szX0bBVfcoLBhMsbCMLU0tbN8uwXP3Pqa8f65Z0k63esAr2bz10RrA/f2cKWnVthmr1qqRLqBGWuS3DVohC4zXV8G4RJD6oWKO8e0XXpvhl3rpIXONqTHhvCtpf25p739ljhyQ13rL3Cgqm4pRl08uwniW0nBWI9dtSFZOQciT1AuIPoFGry3D3s7chKzMrAKBWIYk2LUhuESQ8QQI7/4TzKavnb0BGaibSjqdDOgWb/uzUXCyctgyD3rj1Tym1sdZGrBIzisY6UNFS7n+ggMVog4+eG4lTD5/iXnf22GvJvMxshzG4QSE0tGBwgmHTATCtLJvBgsQKgpjBzD/f9dSAFCUcXatxdaxbvAkjX5uAYHZe1DEo5VN444vn0bBVfdLsVdfsPm/Y9GSghIF2iWkVkXhxUdrX68cOnWgzUjKRfjITABDKDeGb0XPw7MePW4TxiyU7Q7N9qGBtzAHL5m7LZn6dRjU3DBzSn9cu3nSmTmvtwk245tauECRcSWqSgbnWsmlfcFzDJQzrwQrO6tsf73+0ZJkSeOfhjy8gw04oXbEUguEgNHsxDFsuevyBIEC7GeBTx04jnBf+UwR09/p92LNhfyEEGBdVJP+r2pE9x7Bszi+49/GB5nDa4WUC4kkGD7Wwjc5TXkMA/Ba2imVbiUA9DMwGCTkZFvMqVq9wvErNyrpuk9r47JWx2Lxie8Fo633n1ejStxMYNk6z94xmPTByWoxjGFzcwnZh8JsMrnDfc3fi4TfuhRDiDO37/RcLsGbJBgjIoCQ1Or9YLxrtW1OzN8iyjWvesQn63n/tGffIWovRb3yJuVMXQJI6JqE+I1BmdNrXtvXY7aOtq5gYlWqXvzDtRB5CNhchExSWrSzE7LuGvcww53F6etpFM1dFTcZGe8D4y7bV89fjb7e/gEDArx3hX+II3/2S1HQCpaHQKt3fWZUSls1Vmr0Pwjb0pWb3dmN16cua16Vhs99Eh+tbFfzFK65uhvSMdHjsVTVsrikg0ykt2/aG9QDL1teuZyu06Hz5WbLd1Zjw7lS0SWzJkuROSWocQHnRKTnTV8Nrl5cXFDc+2BvxJc5WSRzbdwJpJzIghDCO8M0TJOcXEtfEGDb9GUjqeVs39Bl07QXFIgyGhYGFLTTgjXjwggn0lxbS/9XGwLxJi/H3299G8xJNtSJnnZ8CjypyHpQkvydQajQ5KShOsTAdNHvDXA4P1+w2t2zV65OfQ7cBnc4FiPARNLsw7MXkH8AvaIQxhvU9hnWD2NgYuvOZAVC+s9Ztw9IteH3MuxAkPUlqqiCxppCEUGnDejAzl6xQuTzuef5WUH5Sh5kx4d2p2Lt9PwQoQ5L6jEDHo0/W1jDslXG9MEpXKXmmn6KGrwISArJQ1yWSjIjQqRfS//+1Sw+SpV//jE4demH/9oMspUxVpGb6KHCvT/jvlaQmEsRBAC7Or8qIwcUN6z6uDf/L5VDHvGCemjppFFp2a/J7gOScDiIgY+FQIEWAjhXiHtUy7N1vYeOatGt0jns06vUJ2L/rAAh0TEKOOI97dJVhfb2xWhERql92liHLyw1h+mezUDwxwUrIVZLU9PxJR0mGyZAkBRM2F6ThhVWIEXEIyFgjSHqFWJCAIqeMn2KoTJkykPJPOTsUyT85EspRBT5SSeD/8IlNy7fh4R7PYMrHM3E4+ahxpC/FId9sP8U84hP+mx3yvylJriZQVhHcL2VhmzD4fSLRYVPGDtn7rh6oWq/S2Q989/k8FCsejxadmxwXJL+ybOui4IIyZdj00axnC1fO7di7rV0wfSnSTmYAAE4eOo2f565Drfo1DRnxo7V2nmF9Ewqo08ovD7hfsFzSZ1Cv5LKVSuOl2946U+j34+TF6HpjJzTv2CSPYUdbNp3ya75+K50ukVgoII41TWyMd+cXPUhnMI7uPYYS/kS4eSlBAh0F0CQKIRBj2dZj4kWlypc0MfEx8NKyLzk4Bj7VD1d0axYVgG6ei0kfzvw/hAAIZofw2d/HY8onX+P2J29Gux6tbOWalbI9V6wFYZOFHa+t216z7sOwHfMrpqPFmQJAI2Z+y7K+t1PPtjuKFYvjp298FdozEJtXbIfRBkoo1yHfJEFy83nco0csTJnGrRrgnhdvO1PzEqF9JyN5+z4IyHRFzmcEEdU9imTFvdst20D3/l3Q4bo2Z+Maz2DEq+OxetF6FpC7JalXBcRWAoUAuAQ6LUlNd8j3gSSZN+67SZg/dekFmetta3ehLrWChQkDnFyItlEWpgXD+l+851W07XnFJdXkRISBQ/rjwZfvQaMr6lP95nULfJq2b4zP5ryPuPi4vxQYlCPhCzjnPI5fISc9F8NfGIu72z2Kj18cie3rd/HWX3a4SjiHlPBNdYTvPkf47/pNQM9RHQqY5pq9Bz32Ylp1b44u/ToCBChjLEa/+SVCuWFc1bfDAcnqXyXEIxwAABJrSURBVAxbjyMnAwtwj0wHz7p9hRCjHn/0QW/Ol/OxfXXkpFsoL4zpn87Cq2Oe4ZwcvUaSnKbZPoKCs59+y2agYW9Odkb2mgGP9+UVc85eubJ7w17MmTgf7Xu01hzGXEnyoGHbzsLEScitguRqh3zpHzzzGS+cuQzeBV7deXT/cUzfPhYAGQG5BTAewLJABoRtG8u2yvBvh+1cvWgdfpy8+A+XmvwKjnuevxX3Pj8QnnYTDEw9gFXBmBY5OTnZ22+570admpvylwBHrabV8NCbd6FkmaQC40RtDHatT8a7g4djyodfY/rwb9GoTX1cd9c1COYGTe87u2ewwTwP9IsB9bFsXrKw1aJQ+o5hc52AHBcOeht7DOjCC6Yui/DI+7YeREZaFoQQWrH61sJcZ1j3KigZw+A4w+Y+j70FyRl7dw98qj9euvWtSMkBA/MmL0LXmzqhWYfL8xSpsZZNNxu5reOcQVnYKpr1AxJq5+WtGmb1f/QGTHxvxpk81eKZy/G8/R9M+3qMtyNjzxZBdptmD4ocK5XkFd+vwoKvliI7LefCzXRWHo7uO44yFUpbQXIDMaXml9vj3HFyFcO6j7DivdQTqW7Lzk2wav76PywAVepWROnKpeBqV3oc7qet9wrTue5t5HC3+okE3V0FlbNS8d8PEH+sD9PWjcbJtBRSUAUXujOjcq2KDCb889Hh0J7GhmVbsGn5NiSVS0RaSjo69W5nq9SumC6smGhIBz3rvpd/6V1BHlJ5Bq4SEJtrNahuSpVPigCAmTHq9Qk4lHwEgkSqhBpOoJOFuEf1NXsDmTnQ6+bu6HTD792jce9MwrfjfmBBcrckNZYKoX0tm+sM6855eSFx5XXtUKLs70uilnyzAt2vvBkbVmzmzLQsE8wKmsPJR3jiB9Px6j1DLwocQKRGaN3STfD5HQiIfYLEhugmmH2G9e0aukGPW7rSLY/1RULJYn9IAKSSePDVu3DNgC7Q7FXSVt9tYSsy29L//li2JRi8k0B5a0+t/+83HQQMeLYPjqeeEJZtE81eL2293v/+GNbXMJuK3W7phKeHP3ymfMlai9PH0jD29Ul4pPuzmDdlERzHCUuobyWpmYVQwophmjKsL/VkBuo2rXXWQuRl52HmyNkIxAasJLlCkPwKQDR2x2/Z3GZgmqRmpNEtj90In/9s8nzrzzsRiA9AkfIUOTMI4hdEL2NP8th7gGHL1GlcC/e+cPvvavl/pZGH3PAy7rxiMO664jHc1/EJjHxlAsLBi89qMzN+mLgAqSfTQCRyJOSsQoBMFraOYT0EhLLNOzTBWxNfQvFSCRcNjkf/MQgde7WHZY4zrO+xMNEOPoFAGYLkIga0UPQXwAfBF1AgkA/gRwzMFwbmywKezy24E5ipwRV14Y/xnbPHWWnZ+GDIv3B07wk4wp/nkG9xfiwbhf5FNUkqpn7jurisWd2zAGEGZo+bF8mKkwwqckYTRHIhAXsVw/ohhk1o0Kwebn3ixn/Lin+B5fNWgUgcV5F8Rnq0AIlhO2jWNzKz8/qjz6N+y7rnfMhog8zUbKSfykA4z70k1/+kncjAqgXrELmeX/5IiH6gJ9/a9XFt6NGwySveuHUDDJv9Jq66sT2kkihKjlIIgar1KuP1L5/HzQ/dgKCb49PW7WvYPIDo58BZkFgnITcKRbxvx8G/RPzhFzEIyDiWpH69i62gJ1FA1FXkyFOHUlGmUqkC+9KuRm5GEJIkBMnUaGkDAEQQJQVkQJJEYlLi72MMz9X4/J3JKJWYxAJihyQ5FtHRJi2ba7X1OnueJ3rd2R1J5c+epjx1+DR2bUyGo5RR5CwQJH9A9Kx4rGF9n2Zdc3XGBrr7uVsjvP+f3Ky1mPzRTHRK7A1J8pgkNb6Qk31gcKxm/ZCFfdazbrnq9arQ0Gmv4v3Zr+Omh69D2cql4Y/xQSoJpWTkb59CsaR4dOjdGq9+/gze+/p/0L5HK7heOJbZ3uSx+zLDlilEm2YTxBcAMubPWIwd63f914ODwfA5PkhInV+6FI0RkYZNG8O6eIsrm+CGQT0LPETni3EQVyIWrg2TZq8sCr3OiXXk9yJHh89hTNYv3YLp42ahc9+OLixNY9jrDZt2iFY0CDNYsvmlVPmSx+994Tb887FPYG2kfmjSsK/Qvmcr1GxYPVNB/cuy7ciwVaLHNe5dAvRavxuuz5vfbwnmTVr0p2/G3q0HMGTYYAghtGQ500L2NIVeWsAlDOvHGLYqw/dRVmb2xkat6rvte7Ti7rd0hs/nICcjCEU+WNaQAYGksonoVKcdtmfuBrOVnvUqavbuMGwG5196EfWSCEFyuSJnvhDCZJzKAjv2L2FBtNaAhAWwNXK/VoGsKjFsC8OmMwzNfHfIa8bndzB/2lLs33EIUgnUb1YH193TA5VrVELYy4vR7HXmyGsSCva8YY977AaLB+Jx+MCRc4XAGoux/5iEcUMnQpA4KqE+JVBGNK/BsGmj2buJmZ0uN3ZEg1b1fpfcmvbpLMTEBFhCrZMkJxVi3nyGzQAD02JfxgHqN/h6+AK+P19bWcaIl8dj77YDUOSkKHLeExD7C3G1fmXy+nk2/LnH4WcMTKPM9Kz4Wg1qyKq1q1DDK+rT5Vc0pMZXNKDajWpSUpkSYkvGjoC2XjWXw3d4HB6ffxl2+ULAAYI4IiA/kCRPnzh0Cl/8cxr+KgVh+3ccgiDBgtSW/BfxRNuLRM36KY/dJsvTV6led3THwCH9MPrnDzB6xTAEj4fRumsLGG0CDL7Bsrke0ZOGlkB7GByaOvob7Fi3u2AteST5GBzHgZTSSFJzBcm50SN/jjWs77VsagUCAbrr2QG/c48WTl+Gn77/GULIkCQ1XkBsix7X2IqavfsMm+K1G9fArU9c3GGoC225WUF8PnQK4uJjrSJnpSRnaH4BXKE5rPzA/UXPul+5HB7p2tAjHrs9jNVXeOy21Oxdodnr4Fl3oGtD74Q5NN2z7oeGzZXR697OulaS5GcOOcv9sX477h+TkJWa/ZcABxhYNX8dyhcvC0niuCC1AIh6BpgYtjmz/VSze6M2ukzzTk18iUkJoniJBPnBotcDnvUqhWzufa4Nv8nRb60BgcIiUqaiG7Wtj+St+wsGCDNjwtCpSN62D0Qiv2hQHCuE4amv2bsb4Jj2PVrj6luu+l1wPfbtSdi5aQ9LUnslOWMIFCwkrulpYLpawzLlVArKVC71H9mTpbNWYvgrYyCldCWJSYLkh/n1POchJCPv0jCs+3vsvuPa0KSQDc7KMZnfBm3OLNeGvvLY+1Sz97Bl0zzfVTgP6ikkSU1W5IwSQoamDf8G86cuAf+FqolPHTmNJUuWQ0CGFampIrr8ReQGtqVm71PXhie5NvSGZn2fZ8MPuDY01LPhaZq9Ny1MlULWngm0V0CuIILdsX43gpl50W81Cee5mP7pLAQCAXbIWStJTinMPbJsbnHZbZYbzKUbBvWA8xvad9e6Pdi7eT8kSa1IzSSI5YXRvpb1YMum7LPvP4E7n7nlP1JF++sJyTkTF8AR/pxYEf+pIucTFF6i8Dt3MwIWTrSwZQ3rsoZNWQaXwtnXlBVhIhSSJKYpct7wkT9t1YJ1+OS50X/qOZT/L42IZcz412yUTizFipwNktT4Qo5R5FsSTrIwnT12n7AwwwzM+x67gy1s6/MrJgoJkpMJdHjU/0zA16O+h7W28Gt/5k1ejBVzf/lVo40VEDsQ/ax4BcP6NgYHdmzcjfa9Wv2GLWKMfH0CTh1PAYCTitSIQmhfsmxbGuhusBBturVEYqni/5FNscZi6KMfYeHMZVDCSSMS70hSbxDoCIp2MOcPyQSBshSpCQ75XiLQkS8/msav3vPOBZfR/Le0hdOXYdKYGSCiPElqpID4HtFzc7+16iqfNvcXUTEZSXKFQ76JUki3ZqPqZ04YFgoQow0+HzoFDRPrsyLnfO6RsGybAoi76d4bcFmLOr+LHzJTsjB7/DwEfAHrCN9iSeq7wmhfy7aLhfXt234AlxWQF/mzmtEGb9z3HuZOXwApZJZDzgiHfI8LyNUAwn8WNgniiCT1piT1gkP+I52T+vC0T785c+n3X7FZa/HuYx9j3/YDECSPBUTsa4qcJYV4Mhe15QCtJtBLktSRQ8lH8dFzo87U2p33cMO2Vbvw7vCPIIg8RWqGILEimjYlQFtYKxQhFAqf48JM/vArbF+/CwSRJUn9iyAOFfLTPoYlJ+DA8cn/6MYYY/Dmg+9jxqezERsbm+cI/2xH+O6SpD7MP5RzqVQ6EyhLQn7nE/77fML/sRIqdd1PGzm+RNyZs/9/5RYKhvHK3W9j2sffsF8EtgsSD0uSU/Pjwz/qd4YEyaUS4gnLdm39xJr2jQf/ifSTGb/zm8+L4jFvTcTOTXsgSZ6UUJ8Q6FQB8HBF5G7V3G1rdmLziu3nZLvdkIeJw2agTGJplqQ2SJITEHnB+zkMjiC5SEK5h3YfwY51e/7jG2O0wWcvjcPbDw9D5cSKWkLudsj/miLntrNXrlLoIjbp1xfZpEpSixzyP+EI//2KnPkBX0zet+Pn4ZmbX0NOeu6F9FeUfytCowv6Pb7w0fFFzAUHdx3B3CkLsWbZeiuhkh3yD5GkXiKIjfnywxe4/i6BkhWp9x3y3ecTMWsSSxQ3110zELvW7v09VVmUHlOPp+OHSQvRoGU9q0NmkQJ/ptl7mCOvLCACBSWpBT7yj5JCuanH07E+yjsFl85aiYljpqPbTVeGJKnRDFvLsr0+n/a0kRfmyLEEzICAyc7Mwakjp//XAsVvx87FtrW78OBrd3G7Hq2CwWBwpQNnoyUz0rDpbGGvsmzrAVw6PwGl/k3xcMTikkegLCI6LCB+FhA/qgj5kQoifeLwSXzx3jR8P2F+oQe/3JD3qzRoAMmFCEcKgDwG4Ibd84pQXk4I65dsQs+BXRmRk6XboiDGY/AphoUbDsMYc15rHA6HIyf/mVMJ2M4F3HpDIAZ4L8MaYzQy0jJ/p2D3bz+EoU98hBdGPMENWtZLIUsjCN5cBvdm2F6WuW7k4kL+9cWyBa6/INpHkItF5M1T2yWp0Mr5q/nL96Zj+6rdF6cygMgV/o+9/QBufuAGeNZN8Kx7FYOvJKI4MK9U5MxzhP/Ewq+X8tC/fVToXbCBOD9639Edj7x1H2n2yhnWvYioDRiZAOZJclaAOPv7CfPxwZMjLsnZiz/apJLoObArrrunO5q2uRy52UGyMJIgihnWZRm2jmVbycJWVORUjDBXxJbNSYBOAnxQktpPoP2CZBoAVwiy7z31CWo1qIXRb0xAZmr2eQW5fM0yOL73FL4//aUkUBmACrzwTpDQsSI+pVliE699hx7YuHzreef3/MjHcOUN7cmzbgkGR3vlgPUJf3qMis399JUxmDTsq0Lr4ogItz91Mx78+90IejlxHntJUfplSTI3IOPSf563il8a+I+zr+77TXN8Co+8PQgJScXQ8fo2ICYHkbd21TCs6zC4hiBZmYBi+et/GpGb2w9IUnsJtC+y/uzFJ8bxj9OW4KNnRuLEwVMXb1PPfFgQHvvH/eg3uA+09oQk5QgIodlzQTDvD/kUC2cuRXYR3INAnB/vTH0VTdo3BLOVDvl9AFuPPU8qYb8e8z0+eHLEJb3F8A83Ahyfg2sHdkWXGzti4y9b8dBL9yA3NwhmJopUFogYGa+YrSAiaNbasDaWrXXIYRaWqydUxdINK7Bh6RZ89a/ZOLj7yAXNs2TFElh0ZAaOZ6RE/Z4UEqFMjWf6voKd64vmohIRXhzzN1zZr13061wJKFE8ER88PhLThn9dpNwMEeGmwdfh8Q8GITsnJ6oSiI2NwcpZ6/DCgDcKB50gXN6+Afo/egO8PI0rr28HWCLNmgCWARkXWX8IWBjjcVgzwyrhMMhym4SWGLngc3w77gcsmPZTodenXnCCQQiB2568Cb3uuBrj35uM3Oxs3P30QOxan4xPXhp9Ib4z/LF+PPHeg6jZqBq+GDYZZSuUw/V3XoM5X87HlI+++f/CckRbNaUkKtWugC59O6Ju01qoUK0cEkoUw5ThX+HpfzwBkgQlJO7r8xjuffJ2JJSKR8bJbOzfdRArf1iNNYs2IC83dNEKoEq9CujzYE/4Y/wF7qJxLRZMWYZNy7ddUL/KUbj9uRsjlbFUsNu5c3Uyvhs3/4IqqokIPe/qgsta1Sk4r8XA6WNp+OIf04tMa0spUKNRNfS8vRvqNa2NUhVKYNXCDbjr4dugrQclFB7q+xiuvbUnajSoivSTmdi7bT8WzliGzSu3Fel3/h+NqftEsqnhvAAAAABJRU5ErkJggg==\", \"customThemeCS\": {\"dark\": \"#222222\", \"text\": \"#333\", \"hover\": \"#1b7479\", \"bodydark\": \"#272c31\", \"darkmode\": \"#223235\", \"mainfont\": \"\'Montserrat\', arial, helvetica, sans-serif\", \"bodylight\": \"#f1f1f1\", \"col_action\": \"#00a7af\", \"text_light\": \"#889da0\", \"primarydark\": \"#8279a7\", \"dark_opacity\": \"#0000002e\", \"menubodydark\": \"#343a40\", \"menutextdark\": \"#c8cfd6\", \"primarylight\": \"#113f50\", \"menubodylight\": \"#113f50\", \"menutextlight\": \"#fed284\", \"secondarydark\": \"#cedd7a\", \"secondarylight\": \"#ff7f81\", \"secondarybodydark\": \"#2b3035\", \"col_action_opacity\": \"rgb(0, 167, 175,.2)\", \"secondarybodylight\": \"#ffffff\"}, \"isSidebarDark\": false, \"letterSpacing\": \"letter-spacing-normal\", \"isNavbarTopDark\": false, \"customQuickPageEnables\": [true, true, false, false, false, false, false, true, true]}','1980-11-12 09:00:00');
/*!40000 ALTER TABLE `User` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `addressee`
--

DROP TABLE IF EXISTS `addressee`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `call_log` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `call_id` varchar(128) NOT NULL,
  `call_direction` enum('INBOUND','OUTBOUND') DEFAULT NULL,
  `caller_number` varchar(54) NOT NULL,
  `tracking_number` varchar(16) DEFAULT NULL,
  `caller_contactId` int UNSIGNED NULL,
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
  PRIMARY KEY (`id`),
  KEY `idx_created` (`created`),
  KEY `idx_tracking_number` (`tracking_number`),
  KEY `idx_op_number` (`opnumberId`),
  KEY `idx_customer` (`customerId`),
  KEY `idx_caller_contact` (`caller_contactId`),
  KEY `idx_caller_number` (`caller_number`),
  KEY `idx_call_recording` (`callrecordingId`),
  KEY `idx_call_duration` (`duration`),
  CONSTRAINT `fk_phonebook` FOREIGN KEY (`caller_contactId`) REFERENCES `ecms`.`phonebook` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `call_log`
--

LOCK TABLES `call_log` WRITE;
/*!40000 ALTER TABLE `call_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `call_recording`
--

DROP TABLE IF EXISTS `call_recording`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer` (
  `id` int NOT NULL AUTO_INCREMENT,
  `enabled` tinyint DEFAULT NULL,
  `firstName` varchar(32) DEFAULT NULL,
  `lastName` varchar(32) DEFAULT NULL,
  `vatNumber` varchar(32) DEFAULT NULL,
  `companyName` varchar(255) NOT NULL,
  `billingEmail` varchar(255) NOT NULL,
  `contactEmail` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `city` varchar(64) DEFAULT NULL,
  `state` varchar(64) DEFAULT NULL,
  `country` varchar(64) DEFAULT NULL,
  `zip` varchar(10) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `companyID` varchar(32) DEFAULT NULL,
  `token` varchar(64) DEFAULT NULL,
  `billingId` VARCHAR(64) DEFAULT NULL,
  `balance` decimal(12,2) NOT NULL DEFAULT '0.00',
  `currency` varchar(10) NOT NULL DEFAULT 'USD',
  `settings` json DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `email_unique_idx` (`billingEmail` ASC) VISIBLE,
  UNIQUE INDEX `company_unique_idx` (`companyName` ASC, `billingEmail` ASC) VISIBLE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer`
--

LOCK TABLES `customer` WRITE;
/*!40000 ALTER TABLE `customer` DISABLE KEYS */;
INSERT INTO `customer` VALUES (1,1,'Default','Customer','IT16249491008','Tech Fusion ITc','info@techfusion.it','info@techfusion.it','Via Nazionale, 1','Roma','Italia','00100','+39 (348) 2513-178','Default',NULL,0.00,'USD','{\"localdid\": 2.6, \"tollfree\": 3.6, \"localdid_fee\": 1.3, \"tollfree_fee\": 1.3, \"inbound_cost_per_minute\": 0.1, \"outbound_cost_per_minute\": 0.1}', CURRENT_TIMESTAMP);
/*!40000 ALTER TABLE `customer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_products_rel`
--

DROP TABLE IF EXISTS `customer_products_rel`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
-- Table structure for table `blacklist_number`
--

DROP TABLE IF EXISTS `blacklist_number`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `blacklist_number` (
  `id` int NOT NULL AUTO_INCREMENT,
  `number` varchar(64) NOT NULL,
  `customerId` int NOT NULL,
  `description` tinytext,
  PRIMARY KEY (`id`),
  KEY `fk_number_idx` (`number`),
  KEY `fk_customer_idx` (`customerId`),
  UNIQUE INDEX `fk_unique_idx` (`number` ASC, `customerId` ASC) VISIBLE,
  CONSTRAINT `fk_customer` FOREIGN KEY (`customerId`) REFERENCES `customer` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `document`
--

DROP TABLE IF EXISTS `document`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!50503 SET character_set_client = utf8mb4 */;
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
INSERT INTO `gui_section` VALUES (1,'Customer','','Customers Management'),(2,'Role','','Roles Management'),(3,'User','','USers Management'),(4,'CallLogs','','Activity Logs Access'),(5,'NumbersManagement','','Numbers Management'),(6,'TrackingNumbers','','Tracking Numbers Management'),(7,'ReceivingNumbers','','Receiving Numbers Management'),(8,'SipGateways','','Routing Rules Management'),(9,'TrackingSources','','Call Sources Management'),(10,'ActivityReports','','Activity Reports Access'),(11,'Overview','','Overview Reports Access'),(12,'Billing',' ','Products Management'),(13,'Dashboard','','Dashboard Landing Page');
/*!40000 ALTER TABLE `gui_section` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gui_visibility`
--

DROP TABLE IF EXISTS `gui_visibility`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
INSERT INTO `gui_visibility` VALUES ('1','1','3','1'),('2','2','3','1'),('3','3','3','1'),('4','4','3','1'),('5','5','3','1'),('6','6','3','1'),('7','7','3','1'),('8','8','3','1'),('9','9','3','1'),('10','10','3','1'),('11','11','3','1'),('12','12','3','1'),('13','13','3','1');
/*!40000 ALTER TABLE `gui_visibility` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `languages`
--

DROP TABLE IF EXISTS `languages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `languages` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` char(49) CHARACTER SET utf8mb3 COLLATE utf8_general_ci DEFAULT NULL,
  `iso` char(2) CHARACTER SET utf8mb3 COLLATE utf8_general_ci DEFAULT NULL,
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
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!50503 SET character_set_client = utf8mb4 */;
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
-- Table structure for table `modules_reload`
--

DROP TABLE IF EXISTS `modules_reload`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `modules_reload` (
  `id` int NOT NULL AUTO_INCREMENT,
  `process` char(64) NOT NULL DEFAULT '',
  `component` char(64) DEFAULT NULL,
  `action` char(64) DEFAULT NULL,
  `command` char(255) NOT NULL DEFAULT '',
  `last_modified` datetime NOT NULL DEFAULT '2000-01-01 00:00:01',
  `result` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `process` (`process`),
  KEY `component` (`component`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `modules_reload`
--

LOCK TABLES `modules_reload` WRITE;
/*!40000 ALTER TABLE `modules_reload` DISABLE KEYS */;
INSERT INTO `modules_reload` VALUES (1,'opensips','droute','reload','/usr/bin/sudo /usr/local/bin/osipsexec dr_reload','1970-01-01 00:00:00',0);
/*!40000 ALTER TABLE `modules_reload` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification`
--

DROP TABLE IF EXISTS `notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
-- Table structure for table `number_provider`
--

DROP TABLE IF EXISTS `number_provider`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `number_provider` (
  `id` int NOT NULL AUTO_INCREMENT,
  `prov_id` int unsigned DEFAULT NULL,
  `reserved` tinyint unsigned NOT NULL DEFAULT '0',
  `number` varchar(64) NOT NULL,
  `name` varchar(64) NOT NULL,
  `type` enum('toll','local','intl') NOT NULL DEFAULT 'toll',
  `state` varchar(40) DEFAULT NULL,
  `ratecenter` varchar(40) DEFAULT NULL,
  `npa` int DEFAULT NULL,
  `nxx` int DEFAULT NULL,
  `fee` double DEFAULT NULL,
  `setup_fee` double DEFAULT NULL,
  `recur` enum('daily','monthly','weekly','yearly') DEFAULT 'monthly',
  `raw` json DEFAULT NULL,
  `description` mediumtext,
  PRIMARY KEY (`id`),
  UNIQUE KEY `number_UNIQUE` (`number`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `number_provider`
--

LOCK TABLES `number_provider` WRITE;
/*!40000 ALTER TABLE `number_provider` DISABLE KEYS */;
/*!40000 ALTER TABLE `number_provider` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `observer`
--

DROP TABLE IF EXISTS `observer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `op_number` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `customerId` int DEFAULT NULL,
  `receiving_numberId` int DEFAULT NULL,
  `tracking_number` varchar(255) NOT NULL,
  `tracking_sourceId` int DEFAULT NULL,
  `sip_gatewayId` int DEFAULT NULL,
  `routing_action` enum('FORWARD_TO','REMAP_FORWARD_TO','DIAL_AGENT','HANG_UP') DEFAULT NULL,
  `agent_id` int DEFAULT NULL,
  `agent_timeout` int DEFAULT 30,
  `failover_agent_id` int DEFAULT NULL,
  `phonebook_id` int DEFAULT NULL,
  `number_providerId` int DEFAULT NULL,
  `notifications` tinyint DEFAULT NULL,
  `text_support` tinyint DEFAULT NULL,
  `number_tags` varchar(1024) DEFAULT NULL,
  `failsafe_number` varchar(255) DEFAULT NULL,
  `renewal_date` timestamp NULL DEFAULT NULL,
  `active` tinyint DEFAULT NULL,
  `description` varchar(2048) DEFAULT NULL,
  `recording_enable` enum('0','1') DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tracking_number` (`tracking_number`),
  KEY `idx_tracking_number` (`tracking_number`),
  KEY `idx_tracking_source` (`tracking_sourceId`),
  KEY `idx_phonebook_id` (`phonebook_id`),
  KEY `idx_receiving_number` (`receiving_numberId`),
  KEY `idx_number_provider` (`number_providerId`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1 COMMENT='This table stores Tracking Numbers';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `op_number`
--

LOCK TABLES `op_number` WRITE;
/*!40000 ALTER TABLE `op_number` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_method`
--

DROP TABLE IF EXISTS `payment_method`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_method` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customerId` int NOT NULL,
  `type` enum('card','bank') NOT NULL DEFAULT 'card',
  `currency` varchar(5) NOT NULL DEFAULT 'USD',
  `name` varchar(64) DEFAULT 'noname',
  `number` varchar(128) DEFAULT NULL,
  `exp_date` timestamp NULL DEFAULT NULL,
  `cvv` int DEFAULT NULL,
  `token` varchar(64) DEFAULT NULL,
  `isPrimary` tinyint unsigned NOT NULL DEFAULT '0',
  `description` varchar(512) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `payment_customer_fk1` (`customerId`),
  CONSTRAINT `payment_customer_fk1` FOREIGN KEY (`customerId`) REFERENCES `customer` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_method`
--

LOCK TABLES `payment_method` WRITE;
/*!40000 ALTER TABLE `payment_method` DISABLE KEYS */;
INSERT INTO `payment_method` VALUES (1,2,'card','USD','noname','4242424242424242','2001-01-01 00:00:00',NULL,'pm_1LTNwREAOF26RKKHL1lAIpqn',1,'visa - 4242'),(2,3,'card','USD','noname','4242424242424242','2001-01-01 00:00:00',NULL,'pm_1LUbfLEAOF26RKKHGr0w4rgv',1,'visa - 4242');
/*!40000 ALTER TABLE `payment_method` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_transaction`
--

DROP TABLE IF EXISTS `payment_transaction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_transaction` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `customerId` int NOT NULL,
  `paymentId` int DEFAULT NULL,
  `productId` int DEFAULT NULL,
  `amount` float NOT NULL DEFAULT '0',
  `currency` varchar(10) NOT NULL DEFAULT 'USD',
  `transaction_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `description` varchar(512) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `payment_transaction_fk1_idx` (`customerId`),
  KEY `payment_transaction_fk2_idx` (`paymentId`),
  KEY `payment_transaction_fk3_idx` (`productId`),
  CONSTRAINT `payment_transaction_fk1` FOREIGN KEY (`customerId`) REFERENCES `customer` (`id`),
  CONSTRAINT `payment_transaction_fk2` FOREIGN KEY (`paymentId`) REFERENCES `payment_method` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_transaction`
--

LOCK TABLES `payment_transaction` WRITE;
/*!40000 ALTER TABLE `payment_transaction` DISABLE KEYS */;
INSERT INTO `payment_transaction` VALUES (1,2,NULL,3,3500,'USD','2022-08-05 10:39:51','Wallet charge per user request'),(2,2,1,3,300,'USD','2022-08-05 10:42:11','Charged toll number: 8002452215'),(3,2,1,3,300,'USD','2022-08-08 11:11:37','Charged toll number: 8002455075'),(4,2,1,3,300,'USD','2022-08-08 11:16:22','Charged toll number: 8002456073'),(5,2,1,3,300,'USD','2022-08-08 11:16:22','Charged toll number: 8002461043'),(6,2,1,3,300,'USD','2022-08-08 11:16:23','Charged toll number: 8002461284'),(7,2,1,3,300,'USD','2022-08-08 13:02:54','Charged toll number: 8002461374'),(8,2,1,3,300,'USD','2022-08-08 13:09:38','Charged toll number: 8002461384'),(9,2,1,3,300,'USD','2022-08-08 13:11:21','Charged toll number: 8002456072'),(10,3,NULL,3,3500,'USD','2022-08-08 19:31:15','Wallet charge per user request'),(11,3,2,3,300,'USD','2022-08-08 19:32:26','Charged toll number: 8002461517');
/*!40000 ALTER TABLE `payment_transaction` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `phonebook`
--

DROP TABLE IF EXISTS `phonebook`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`),
  KEY `idx_location` (`city`,`state`,`country`),
  KEY `idx_number` (`contact_number`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
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
DECLARE l_state VARCHAR(50);
DECLARE l_country VARCHAR(50);

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
DECLARE l_state VARCHAR(50);
DECLARE l_country VARCHAR(50);

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
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `sku` varchar(128) NOT NULL,
  `name` varchar(256) NOT NULL,
  `group` varchar(45) DEFAULT NULL,
  `description` varchar(512) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sku_UNIQUE` (`sku`),
  UNIQUE KEY `name_UNIQUE` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1 COMMENT='This table contains products template that get used for generating automatically products variations based on chosen payment gateway ';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product`
--

LOCK TABLES `product` WRITE;
/*!40000 ALTER TABLE `product` DISABLE KEYS */;
INSERT INTO `product` VALUES (1,'ecms-plan-performance','Performance','plan','Call and text tracking and attribution\nIntegrations with Google and Bing\nCall recording, scoring, and tagging\nBasic call routing\nLive phone, email, and chat support'),(2,'ecms-addon-recording','Recording','addon','Call Recording'),(3,'ecms-addon-charge','Charge','addon','Recharge your wallet'),(4,'ecms-addon-autocharge','AutoCharge','addon','Automatically charge your wallet at a specific threshold'),(5,'ecms-addon-number','Number','addon','Tracking number subscription');
/*!40000 ALTER TABLE `product` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_variation`
--

DROP TABLE IF EXISTS `product_variation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_variation` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL DEFAULT '1',
  `productId` int unsigned NOT NULL,
  `customerId` int NOT NULL DEFAULT '1',
  `recur` enum('none','request','onetime','hour','day','week','month','year') NOT NULL DEFAULT 'none',
  `price` float NOT NULL DEFAULT '0',
  `currency` varchar(10) DEFAULT NULL,
  `token` varchar(128) DEFAULT NULL,
  `min_quantity` int unsigned NOT NULL DEFAULT '0',
  `max_quantity` int unsigned NOT NULL DEFAULT '1',
  `model_ref` varchar(128) DEFAULT NULL,
  `model_ref_id` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `description` varchar(512) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_product_variation_1_idx` (`productId`),
  KEY `fk_product_variation_2` (`customerId`),
  KEY `fk_product_variation_3` (`userId`),
  CONSTRAINT `fk_product_variation_1` FOREIGN KEY (`productId`) REFERENCES `product` (`id`),
  CONSTRAINT `fk_product_variation_2` FOREIGN KEY (`customerId`) REFERENCES `customer` (`id`),
  CONSTRAINT `fk_product_variation_3` FOREIGN KEY (`userId`) REFERENCES `User` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_variation`
--

LOCK TABLES `product_variation` WRITE;
/*!40000 ALTER TABLE `product_variation` DISABLE KEYS */;
INSERT INTO `product_variation` VALUES (1,1,1,1,'month',39,'USD',NULL,1,1,NULL,NULL,'1980-11-12 00:00:00','1980-11-12 00:00:00','Base Plan Monthly Subscription'), (2,1,1,1,'year',374.4,'USD',NULL,1,1,NULL,NULL,'1980-11-12 00:00:00','1980-11-12 00:00:00','Base Plan Yearly Subscription');
/*!40000 ALTER TABLE `product_variation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `receiving_number`
--

DROP TABLE IF EXISTS `receiving_number`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `receiving_number` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `number` varchar(64) NOT NULL,
  `description` text,
  `customerId` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `receiving_number`
--

LOCK TABLES `receiving_number` WRITE;
/*!40000 ALTER TABLE `receiving_number` DISABLE KEYS */;
INSERT INTO `receiving_number` VALUES (4,'17272008240','Ricky',2);
/*!40000 ALTER TABLE `receiving_number` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `redis_channel`
--

DROP TABLE IF EXISTS `redis_channel`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!50503 SET character_set_client = utf8mb4 */;
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
-- Temporary view structure for view `redis_subscription_view`
--

DROP TABLE IF EXISTS `redis_subscription_view`;
/*!50001 DROP VIEW IF EXISTS `redis_subscription_view`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `redis_subscription_view` AS SELECT
 1 AS `username`,
 1 AS `channel`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `routing_action`
--

DROP TABLE IF EXISTS `routing_action`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `routing_action` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `action` enum('forward_to','remap_forward_to','dial_agent','hang_up') NOT NULL DEFAULT 'forward_to',
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
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sip_gateways` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(128) NOT NULL,
  `type` int unsigned NOT NULL DEFAULT '0',
  `address` varchar(256) NOT NULL,
  `port` int NOT NULL,
  `digits_strip` int unsigned NOT NULL DEFAULT '0',
  `pri_prefix` char(16) DEFAULT NULL,
  `attrs` char(255) DEFAULT NULL,
  `probe_mode` int unsigned NOT NULL DEFAULT '0',
  `state` int unsigned NOT NULL DEFAULT '0',
  `socket` char(128) DEFAULT NULL,
  `order` INT(5) UNSIGNED NULL,
  `whitelisted` TINYINT(1) UNSIGNED NOT NULL DEFAULT 1,
  `customerId` int DEFAULT NULL,
  `description` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
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
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!50503 SET character_set_client = utf8mb4 */;
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
  KEY `idx_name` (`name`),
  KEY `idx_customer` (`customerId`),
  CONSTRAINT `tracking_sources_ibfk_1` FOREIGN KEY (`customerId`) REFERENCES `customer` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tracking_sources`
--

LOCK TABLES `tracking_sources` WRITE;
/*!40000 ALTER TABLE `tracking_sources` DISABLE KEYS */;
INSERT INTO `tracking_sources` VALUES (1,'OTHERS','offsite',0,0,NULL,1,'2022-02-26 14:35:23','Default Tracking Source');
/*!40000 ALTER TABLE `tracking_sources` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tsources_phonebook_rel`
--

DROP TABLE IF EXISTS `tsources_phonebook_rel`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!50503 SET character_set_client = utf8mb4 */;
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
INSERT INTO `whitelist` VALUES (1,'127.0.0.1',32,0,'any',NULL),(2,'172.17.0.0',16,0,'any',NULL);
/*!40000 ALTER TABLE `whitelist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `whitelist_rnumber_routing`
--

DROP TABLE IF EXISTS `whitelist_rnumber_routing`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `whitelist_rnumber_routing` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tollfree_number` varchar(32) NOT NULL,
  `receiving_number` varchar(32) DEFAULT NULL,
  `destination_uri` varchar(512) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `whitelist_rnumber_routing`
--

LOCK TABLES `whitelist_rnumber_routing` WRITE;
/*!40000 ALTER TABLE `whitelist_rnumber_routing` DISABLE KEYS */;
/*!40000 ALTER TABLE `whitelist_rnumber_routing` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `workflow`
--

DROP TABLE IF EXISTS `workflow`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
-- Dumping routines for database 'ecms'
--
/*!50003 DROP PROCEDURE IF EXISTS `call_log_report` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = latin1 */ ;
/*!50003 SET character_set_results = latin1 */ ;
/*!50003 SET collation_connection  = latin1_swedish_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `call_log_report`(IN sdate VARCHAR(20), edate VARCHAR(20), cus_id INT)
BEGIN
SELECT
`log`.created AS `at`, `log`.duration AS `dt`, `op`.id AS `on`,
`contact`.contact_number AS `cn`, `ts`.name AS `na`, `log`.`call_status_message` AS `cs`
FROM `call_log` AS `log`
LEFT JOIN `phonebook` AS `contact` ON `log`.caller_contactId=`contact`.id
LEFT JOIN `op_number` AS `op` ON `log`.opnumberId=`op`.id
LEFT JOIN `tracking_sources` AS `ts` ON `op`.tracking_sourceId=`ts`.id
WHERE `log`.created>=sdate AND `log`.created<=edate AND `log`.customerId = IFNULL(cus_id, `log`.customerId);
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `dashboard_count` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = latin1 */ ;
/*!50003 SET character_set_results = latin1 */ ;
/*!50003 SET collation_connection  = latin1_swedish_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `dashboard_count` (IN cus_id INT, time_offset VARCHAR(10), weekend INT)
BEGIN

  DECLARE start_of_today DATETIME;
  DECLARE end_of_today DATETIME;
  DECLARE yesterday DATETIME;
  DECLARE end_of_yesterday DATETIME;
  DECLARE end_current_week DATETIME;
  DECLARE start_current_week DATETIME;
  DECLARE start_past_week DATETIME;
  DECLARE end_of_past_week DATETIME;
  DECLARE start_current_month DATETIME;
  DECLARE start_past_month DATETIME;
  DECLARE end_of_past_month DATETIME;
  DECLARE offtz VARCHAR(10);

  SET offtz = time_offset;
  IF(offtz IS NULL) THEN
        SET offtz = "+00:00";
  END IF;

  SET start_of_today = CONVERT_TZ(DATE_FORMAT(CONCAT(CURDATE(), ' 00:00:00'), '%Y-%m-%d %H:%i:%s'), '+00:00', offtz);
  SET end_of_today = DATE_FORMAT(CONCAT(CURDATE(), ' 23:59:59'), '%Y-%m-%d %H:%i:%s');
  SET yesterday = CONVERT_TZ(DATE_FORMAT(CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 00:00:00'), '%Y-%m-%d %H:%i:%s'), '+00:00', offtz);
  SET end_of_yesterday = CONVERT_TZ(DATE_FORMAT(CONCAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), ' 23:59:59'), '%Y-%m-%d %H:%i:%s'), '+00:00', offtz);
  SET end_current_week = CONVERT_TZ(DATE_FORMAT(CONCAT(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE())-5-weekend DAY), ' 23:59:59'), '%Y-%m-%d %H:%i:%s'), '+00:00', offtz);
  SET start_current_week = CONVERT_TZ(DATE_FORMAT(CONCAT(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE())+1-weekend DAY), ' 00:00:00'), '%Y-%m-%d %H:%i:%s'), '+00:00', offtz);
  SET start_past_week = CONVERT_TZ(DATE_FORMAT(CONCAT(DATE_SUB(CURDATE(), INTERVAL (WEEKDAY(CURDATE()) + 8-weekend) DAY), ' 00:00:00'), '%Y-%m-%d %H:%i:%s'), '+00:00', offtz);
  SET end_of_past_week = CONVERT_TZ(DATE_FORMAT(CONCAT(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE())+2-weekend DAY), ' 23:59:59'), '%Y-%m-%d %H:%i:%s'), '+00:00', offtz);
  SET start_current_month = CONVERT_TZ(DATE_FORMAT(CONCAT(DATE_SUB(CURDATE(), INTERVAL DAYOFMONTH(CURDATE()) - 1 DAY), ' 00:00:00'), '%Y-%m-%d %H:%i:%s'), '+00:00', offtz);
  SET start_past_month = CONVERT_TZ(DATE_FORMAT(CONCAT(DATE_SUB(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), INTERVAL DAY(CURDATE())-1 DAY), ' 00:00:00'), '%Y-%m-%d %H:%i:%s'), '+00:00', offtz);
  SET end_of_past_month = CONVERT_TZ(DATE_FORMAT(CONCAT(DATE_SUB(CURDATE(), INTERVAL DAY(CURDATE()) DAY), ' 23:59:59'), '%Y-%m-%d %H:%i:%s'), '+00:00', offtz);


  SELECT
    COUNT(CASE WHEN created BETWEEN start_of_today AND end_of_today THEN 1 END) AS today,
    COUNT(CASE WHEN created BETWEEN yesterday AND end_of_yesterday THEN 1 END) AS yesterday,
    COUNT(CASE WHEN created BETWEEN start_current_week AND end_current_week THEN 1 END) AS current_week,
    COUNT(CASE WHEN created BETWEEN start_past_week AND end_of_past_week THEN 1 END) AS past_week,
    COUNT(CASE WHEN created BETWEEN start_current_month AND end_of_today THEN 1 END) AS current_month,
    COUNT(CASE WHEN created BETWEEN start_past_month AND end_of_past_month THEN 1 END) AS past_month
  FROM call_log
  WHERE customerId = IFNULL(cus_id, customerId);

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `call_log_export` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = latin1 */ ;
/*!50003 SET character_set_results = latin1 */ ;
/*!50003 SET collation_connection  = latin1_swedish_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `call_log_export`(IN sdate VARCHAR(20), edate VARCHAR(20), cus_id INT)
BEGIN
SELECT
  `contact`.`name` AS `contact_name`, `contact`.`city`, `contact`.`state`, `contact`.`country`,
  `log`.`caller_number`, `op`.`tracking_number`, `ts`.`name` AS `tracking_source`,
  `op`.`routing_action`, `rn`.`number` AS `receiving_number`, `log`.`created`,
  `log`.`duration`, `log`.metrics, `user`.`firstName` AS `first_name`, `user`.`lastName` AS `last_name`
FROM `call_log` AS `log`
LEFT JOIN `phonebook` AS `contact` ON `log`.`caller_contactId`=`contact`.id
LEFT JOIN `op_number` AS `op` ON `log`.`opnumberId`=`op`.id
LEFT JOIN `tracking_sources` AS `ts` ON `op`.`tracking_sourceId`=`ts`.id
LEFT JOIN `receiving_number` AS `rn` ON `op`.`receiving_numberId`=`rn`.id
LEFT JOIN `user` AS `user` ON `op`.`agent_id`=`user`.`id`
WHERE `log`.`created`>=sdate AND `log`.`created`<=edate AND `log`.`customerId` = IFNULL(cus_id, `log`.customerId);
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
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

-- Dump completed on 2022-08-10 13:21:51

--
-- MIGRATIONS
--

SET foreign_key_checks = 0;

-- CALL LOG Changes
ALTER TABLE `ecms`.`call_log`
ADD COLUMN `updated` DATETIME NULL DEFAULT CURRENT_TIMESTAMP AFTER `recording_enable`,
CHANGE COLUMN `callrecordingId` `sipGatewayId` INT UNSIGNED NULL DEFAULT NULL ,
CHANGE COLUMN `created` `created` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ,
ADD INDEX `idx_sip_gateway` (`sipGatewayId` ASC) VISIBLE;

ALTER TABLE `ecms`.`call_log`
ADD CONSTRAINT `fk_sipgateway`
  FOREIGN KEY (`sipGatewayId`)
  REFERENCES `ecms`.`sip_gateways` (`id`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

-- CALL RECORDING Changes
ALTER TABLE `ecms`.`call_recording`
ADD COLUMN `created` DATETIME NULL DEFAULT CURRENT_TIMESTAMP AFTER `visible`,
ADD COLUMN `updated` DATETIME NULL DEFAULT CURRENT_TIMESTAMP AFTER `created`;

-- OP NUMBER Changes
ALTER TABLE `ecms`.`op_number`
ADD COLUMN `created` DATETIME NULL DEFAULT CURRENT_TIMESTAMP AFTER `recording_enable`,
ADD COLUMN `updated` DATETIME NULL DEFAULT CURRENT_TIMESTAMP AFTER `created`,
CHANGE COLUMN `receiving_numberId` `receiving_numberId` INT UNSIGNED NULL DEFAULT NULL ;

ALTER TABLE `ecms`.`op_number`
ADD CONSTRAINT `fk_receiving_number`
  FOREIGN KEY (`receiving_numberId`)
  REFERENCES `ecms`.`receiving_number` (`id`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;

-- CUSTOMER Changes
ALTER TABLE `ecms`.`customer`
ADD COLUMN `accounting_type` TINYINT(1) UNSIGNED NULL DEFAULT 1 AFTER `settings`,
ADD COLUMN `created` DATETIME NULL DEFAULT CURRENT_TIMESTAMP AFTER `accounting_type`,
ADD COLUMN `updated` DATETIME NULL DEFAULT CURRENT_TIMESTAMP AFTER `created`;

-- PHONEBOOK Changes
ALTER TABLE `ecms`.`phonebook`
ADD COLUMN `created` DATETIME NULL DEFAULT CURRENT_TIMESTAMP AFTER `note`,
ADD COLUMN `updated` DATETIME NULL DEFAULT CURRENT_TIMESTAMP AFTER `created`,
ADD INDEX `idx_city` (`city` ASC) VISIBLE,
ADD INDEX `idx_state` (`state` ASC) VISIBLE,
ADD INDEX `idx_country` (`country` ASC) VISIBLE;

-- RECEIVING NUMBER Changes
ALTER TABLE `ecms`.`receiving_number`
ADD COLUMN `created` DATETIME NULL DEFAULT CURRENT_TIMESTAMP AFTER `customerId`,
ADD COLUMN `updated` DATETIME NULL DEFAULT CURRENT_TIMESTAMP AFTER `created`,
ADD INDEX `idx_number` (`number` ASC) VISIBLE,
ADD INDEX `idx_customer` (`customerId` ASC) VISIBLE;

-- SIP GATEWAYS Changes
ALTER TABLE `ecms`.`sip_gateways`
ADD COLUMN `created` DATETIME NULL DEFAULT CURRENT_TIMESTAMP AFTER `description`,
ADD COLUMN `updated` DATETIME NULL DEFAULT CURRENT_TIMESTAMP AFTER `created`;

-- TRACKING SOURCES Changes
ALTER TABLE `ecms`.`tracking_sources`
ADD COLUMN `created` DATETIME NULL DEFAULT CURRENT_TIMESTAMP AFTER `description`,
CHANGE COLUMN `description` `description` TEXT NULL DEFAULT NULL AFTER `customerId`,
CHANGE COLUMN `updated_at` `updated` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ;

SET foreign_key_checks = 1;
