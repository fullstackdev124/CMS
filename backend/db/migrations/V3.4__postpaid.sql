ALTER TABLE `customer` ADD COLUMN `isPostpaid` TINYINT(1) DEFAULT 0 NOT NULL AFTER `balance`;
ALTER TABLE `ecms`.`receiving_number` ADD UNIQUE INDEX `number_UNIQUE` (`number` ASC) VISIBLE;
