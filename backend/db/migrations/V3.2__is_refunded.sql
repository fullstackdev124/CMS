ALTER TABLE `payment_transaction` ADD COLUMN `is_refunded` TINYINT(1) DEFAULT 0 NULL AFTER `description`;
