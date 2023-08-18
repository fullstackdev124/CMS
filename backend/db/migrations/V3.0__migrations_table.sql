DROP TABLE IF EXISTS `migration_schema`;
CREATE TABLE `migration_schema` (
  `version` VARCHAR(5) NOT NULL,
  `name` TEXT NOT NULL,
  `hash_sum` VARCHAR(50) NOT NULL,
  `date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE INDEX `idx_version` (`version` ASC)
) ENGINE=InnoDB;
