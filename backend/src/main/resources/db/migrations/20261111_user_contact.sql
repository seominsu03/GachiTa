-- Run once on an EXISTING users table after reviewing its current columns.
-- New databases receive these columns from schema.sql instead.
ALTER TABLE users ADD COLUMN name VARCHAR(50) NULL;
ALTER TABLE users ADD COLUMN phone_number VARCHAR(20) NULL;
