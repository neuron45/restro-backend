-- MySQL dump 10.13  Distrib 8.0.36, for macos14 (arm64)
-- Add payment_type column to the orders table
ALTER TABLE orders
ADD COLUMN payment_type_id INT;

-- Add the foreign key constraint
ALTER TABLE orders
ADD CONSTRAINT fk_payment_type_id
FOREIGN KEY (payment_type_id)
REFERENCES payment_types(id)
ON DELETE CASCADE
ON UPDATE CASCADE;