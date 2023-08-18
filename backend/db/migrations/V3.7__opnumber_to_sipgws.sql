ALTER TABLE `ecms`.`op_number` CHANGE COLUMN `sip_gatewayId` `sip_gatewayId` INT UNSIGNED NULL DEFAULT NULL, ADD INDEX `fk_sipgateway_id_idx` (`sip_gatewayId` ASC) VISIBLE;
ALTER TABLE `ecms`.`op_number` ADD CONSTRAINT `fk_sipgateway_id` FOREIGN KEY (`sip_gatewayId`) REFERENCES `ecms`.`sip_gateways` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;
