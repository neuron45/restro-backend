-- MySQL dump 10.13  Distrib 8.0.36, for macos14 (arm64)
-- Add payment_type column to the orders table
ALTER TABLE menu_items
ADD COLUMN tax_group_id INT;

-- Add the foreign key constraint
ALTER TABLE menu_items
ADD CONSTRAINT fk_tax_group_id
FOREIGN KEY (tax_group_id)
REFERENCES tax_groups(id)
ON DELETE CASCADE
ON UPDATE CASCADE;