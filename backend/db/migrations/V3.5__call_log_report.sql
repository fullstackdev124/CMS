DROP PROCEDURE IF EXISTS `call_log_report`;

CREATE DEFINER=`root`@`localhost` PROCEDURE `call_log_report`(IN sdate DATETIME, edate DATETIME, time_offset VARCHAR(10), cus_id INT)
BEGIN
      DECLARE start_at DATETIME;
      DECLARE end_at DATETIME;
    DECLARE offtz VARCHAR(10);

      SET offtz = time_offset;
      IF(offtz IS NULL) THEN
            SET offtz = "+00:00";
      END IF;

    SET start_at = CONVERT_TZ(DATE_FORMAT(sdate, '%Y-%m-%d %H:%i:%s'), '+00:00', offtz);
    SET end_at = CONVERT_TZ(DATE_FORMAT(edate, '%Y-%m-%d %H:%i:%s'), '+00:00', offtz);

    SELECT
    `log`.created AS `at`, `log`.duration AS `dt`, `op`.id AS `on`,
    `contact`.contact_number AS `cn`, `ts`.name AS `na`, `log`.`call_status_message` AS `cs`
    FROM `call_log` AS `log`
    LEFT JOIN `phonebook` AS `contact` ON `log`.caller_contactId=`contact`.id
    LEFT JOIN `op_number` AS `op` ON `log`.opnumberId=`op`.id
    LEFT JOIN `tracking_sources` AS `ts` ON `op`.tracking_sourceId=`ts`.id
    WHERE `log`.created>=start_at AND `log`.created<=end_at AND (`log`.duration IS NOT NULL AND `log`.duration>0) AND  `log`.customerId = IFNULL(cus_id, `log`.customerId);
END
