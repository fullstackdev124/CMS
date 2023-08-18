ALTER TABLE `op_number` CHANGE `routing_action` `routing_action` ENUM('NOT_MAPPED','FORWARD_TO','REMAP_FORWARD_TO','DIAL_AGENT','HANG_UP') NULL;
