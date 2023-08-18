USE ecms;

DELETE FROM user_contact WHERE id > 0;

DELETE FROM AccessToken WHERE userId > 1;

ALTER TABLE user_contact auto_increment = 1;

DELETE FROM customer_products_rel WHERE id > 0;

ALTER TABLE customer_products_rel auto_increment = 1;

DELETE FROM payment_transaction WHERE id > 0;

ALTER TABLE payment_transaction auto_increment = 1;

DELETE FROM payment_method WHERE id > 0;

ALTER TABLE payment_method auto_increment = 1;

DELETE FROM RoleMapping WHERE id > 1;

ALTER TABLE RoleMapping auto_increment = 1;

DELETE FROM gui_visibility WHERE id > 13;

ALTER TABLE gui_visibility auto_increment = 13;

DELETE FROM Role WHERE id > 3;

ALTER TABLE Role auto_increment = 3;

DELETE FROM op_number WHERE id > 1;

ALTER TABLE op_number auto_increment = 1;

DELETE FROM User WHERE id > 1;

ALTER TABLE User auto_increment = 2;

DELETE FROM tsources_phonebook_rel WHERE id > 0;

ALTER TABLE tsources_phonebook_rel auto_increment = 1;

DELETE FROM tracking_sources WHERE id > 1;

ALTER TABLE tracking_sources auto_increment = 1;

DELETE FROM call_recording WHERE id > 1;

ALTER TABLE call_recording auto_increment = 1;

DELETE FROM call_log WHERE id > 1;

ALTER TABLE call_log auto_increment = 1;

DELETE FROM phonebook WHERE id > 0;

ALTER TABLE phonebook auto_increment = 1;

DELETE FROM payment_transaction WHERE id > 0;

ALTER TABLE payment_transaction auto_increment = 1;

DELETE FROM sip_gateways WHERE id > 0;

ALTER TABLE sip_gateways auto_increment = 1;

DELETE FROM customer WHERE id > 1;

ALTER TABLE customer auto_increment = 2;
