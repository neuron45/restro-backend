-- MySQL dump 10.13  Distrib 8.0.36, for macos14 (arm64)
-- Creat tax_groups table
CREATE TABLE IF NOT EXISTS `tax_groups` (
    `id` int NOT NULL AUTO_INCREMENT,
    `title` varchar(255) NOT NULL,
    `tenant_id` int NOT NULL,
    PRIMARY KEY (`id`),
    KEY `tenant_id` (`tenant_id`),
    CONSTRAINT `tax_groups_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- DROP TABLE IF EXISTS `tax_groups`;


-- Create table tax_groups
CREATE TABLE `taxes_tax_groups` (
    `tax_id` int NOT NULL,
    `tenant_id` int NOT NULL,
    `tax_group_id` int NOT NULL,
    KEY `tenant_id` (`tenant_id`),
    KEY `tax_id` (`tax_id`),
    KEY `tax_group_id` (`tax_group_id`),
    PRIMARY KEY (tax_id, tax_group_id),
    CONSTRAINT `tax_groups_ibfk_2` FOREIGN KEY (`tax_group_id`) REFERENCES `tax_groups` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `taxes_ibfk_2` FOREIGN KEY (`tax_id`) REFERENCES `taxes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `tanants_ibfk_2` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
);

-- DROP TABLE IF EXISTS `taxes_tax_groups`;



