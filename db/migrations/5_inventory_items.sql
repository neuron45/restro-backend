-- MySQL dump 10.13  Distrib 8.0.36, for macos14 (arm64)
-- Creat tax_groups table

CREATE TABLE IF NOT EXISTS `inventory_units` (
    `id` int NOT NULL AUTO_INCREMENT,
    `title` varchar(255) NOT NULL,
    `description` varchar(500),
    `quantity` int NOT NULL DEFAULT 1,
    `tenant_id` int NOT NULL,
    PRIMARY KEY (`id`),
    KEY `tenant_id` (`tenant_id`),
    CONSTRAINT `tenant_id_fk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `inventory_items` (
    `id` int NOT NULL AUTO_INCREMENT,
    `title` varchar(255) NOT NULL,
    `stock_quantity` int NOT NULL DEFAULT 0,
    `minimum_stock_level` int NOT NULL DEFAULT 5,
    `image_url` varchar(2000),
    `unit_id` int NOT NULL,
    `tenant_id` int NOT NULL,
    PRIMARY KEY (`id`),
    KEY `tenant_id` (`tenant_id`),
    KEY `unit_id` (`unit_id`),
    CONSTRAINT `tenant_id_fk_2` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `unit_id_fk_1` FOREIGN KEY (`unit_id`) REFERENCES `inventory_units` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `inventory_movements` (
    `id` int NOT NULL AUTO_INCREMENT,
    `inventory_item_id` INT,
    `change_quantity` INT NOT NULL, 
    `change_type` enum('sale', 'usage', 'restock') NOT NULL,
    `unit_price` float,
    `remarks` TEXT,
    `order_id` int,
    `tenant_id` int NOT NULL,
    `username` varchar(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `tenant_id` (`tenant_id`),
    KEY `inventory_item_id` (`inventory_item_id`),
    KEY `order_id` (`order_id`),
    KEY `username` (`username`),
    CONSTRAINT `tenant_id_fk_3` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `inventory_item_id_fk_1` FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `order_id_fk_2` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `username_fk_2` FOREIGN KEY (`username`) REFERENCES `users` (`username`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
