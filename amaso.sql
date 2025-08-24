-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Aug 14, 2025 at 11:05 AM
-- Server version: 8.0.40
-- PHP Version: 8.2.18

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `amaso`
--

-- --------------------------------------------------------

--
-- Table structure for table `aid_types`
--

DROP TABLE IF EXISTS `aid_types`;
CREATE TABLE IF NOT EXISTS `aid_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `label` varchar(120) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `label` (`label`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bank_accounts`
--

DROP TABLE IF EXISTS `bank_accounts`;
CREATE TABLE IF NOT EXISTS `bank_accounts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `label` varchar(120) DEFAULT NULL,
  `bank_name` varchar(120) DEFAULT NULL,
  `account_number` varchar(60) DEFAULT NULL,
  `balance` decimal(16,2) DEFAULT '0.00',
  `notes` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `label` (`label`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `beneficiary_groups`
--

DROP TABLE IF EXISTS `beneficiary_groups`;
CREATE TABLE IF NOT EXISTS `beneficiary_groups` (
  `id` int NOT NULL AUTO_INCREMENT,
  `label` varchar(120) DEFAULT NULL,
  `description` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `label` (`label`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `beneficiary_group_members`
--

DROP TABLE IF EXISTS `beneficiary_group_members`;
CREATE TABLE IF NOT EXISTS `beneficiary_group_members` (
  `group_id` int NOT NULL,
  `beneficiary_type` enum('Widow','Orphan') NOT NULL,
  `beneficiary_id` int NOT NULL,
  PRIMARY KEY (`group_id`,`beneficiary_type`,`beneficiary_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `budgets`
--

DROP TABLE IF EXISTS `budgets`;
CREATE TABLE IF NOT EXISTS `budgets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fiscal_year_id` int NOT NULL,
  `current_amount` decimal(16,2) DEFAULT '0.00',
  `carryover_prev_year` decimal(16,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_budget_year` (`fiscal_year_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `donors`
--

DROP TABLE IF EXISTS `donors`;
CREATE TABLE IF NOT EXISTS `donors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(120) DEFAULT NULL,
  `last_name` varchar(120) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `email` varchar(120) DEFAULT NULL,
  `address` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `expenses`
--

DROP TABLE IF EXISTS `expenses`;
CREATE TABLE IF NOT EXISTS `expenses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fiscal_year_id` int NOT NULL,
  `sub_budget_id` int NOT NULL,
  `expense_category_id` int NOT NULL,
  `partner_id` int DEFAULT NULL,
  `details` text,
  `expense_date` date NOT NULL,
  `amount` decimal(16,2) NOT NULL,
  `payment_method` enum('Cash','Cheque','BankWire') NOT NULL,
  `cheque_number` varchar(60) DEFAULT NULL,
  `receipt_number` varchar(60) DEFAULT NULL,
  `bank_account_id` int DEFAULT NULL,
  `remarks` text,
  `unrelated_to_benef` tinyint DEFAULT '0',
  `status` enum('Draft','Approved') DEFAULT 'Draft',
  `created_by` int DEFAULT NULL,
  `approved_by` int DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fiscal_year_id` (`fiscal_year_id`),
  KEY `sub_budget_id` (`sub_budget_id`),
  KEY `expense_category_id` (`expense_category_id`),
  KEY `partner_id` (`partner_id`),
  KEY `bank_account_id` (`bank_account_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `expense_beneficiaries`
--

DROP TABLE IF EXISTS `expense_beneficiaries`;
CREATE TABLE IF NOT EXISTS `expense_beneficiaries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `expense_id` int NOT NULL,
  `beneficiary_type` enum('Widow','Orphan') NOT NULL,
  `beneficiary_id` int NOT NULL,
  `amount` decimal(16,2) NOT NULL,
  `notes` text,
  PRIMARY KEY (`id`),
  KEY `expense_id` (`expense_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `expense_beneficiary_groups`
--

DROP TABLE IF EXISTS `expense_beneficiary_groups`;
CREATE TABLE IF NOT EXISTS `expense_beneficiary_groups` (
  `id` int NOT NULL AUTO_INCREMENT,
  `expense_id` int NOT NULL,
  `group_id` int NOT NULL,
  `amount` decimal(16,2) NOT NULL,
  `notes` text,
  PRIMARY KEY (`id`),
  KEY `expense_id` (`expense_id`),
  KEY `group_id` (`group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `expense_categories`
--

DROP TABLE IF EXISTS `expense_categories`;
CREATE TABLE IF NOT EXISTS `expense_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sub_budget_id` int NOT NULL,
  `label` varchar(120) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `label` (`label`),
  KEY `sub_budget_id` (`sub_budget_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `families`
--

DROP TABLE IF EXISTS `families`;
CREATE TABLE IF NOT EXISTS `families` (
  `id` int NOT NULL AUTO_INCREMENT,
  `family_name` varchar(120) NOT NULL,
  `address` text,
  `neighborhood` varchar(120) DEFAULT NULL,
  `admission_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `fiscal_years`
--

DROP TABLE IF EXISTS `fiscal_years`;
CREATE TABLE IF NOT EXISTS `fiscal_years` (
  `id` int NOT NULL AUTO_INCREMENT,
  `year` year DEFAULT NULL,
  `is_active` tinyint DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `year` (`year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `housing_types`
--

DROP TABLE IF EXISTS `housing_types`;
CREATE TABLE IF NOT EXISTS `housing_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `label` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `label` (`label`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `illnesses`
--

DROP TABLE IF EXISTS `illnesses`;
CREATE TABLE IF NOT EXISTS `illnesses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `label` varchar(120) DEFAULT NULL,
  `is_chronic` tinyint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `label` (`label`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `incomes`
--

DROP TABLE IF EXISTS `incomes`;
CREATE TABLE IF NOT EXISTS `incomes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fiscal_year_id` int NOT NULL,
  `sub_budget_id` int NOT NULL,
  `income_category_id` int NOT NULL,
  `donor_id` int DEFAULT NULL,
  `kafil_id` int DEFAULT NULL,
  `entry_date` date NOT NULL,
  `entry_month` tinyint DEFAULT NULL,
  `amount` decimal(16,2) NOT NULL,
  `payment_method` enum('Cash','Cheque','BankWire') NOT NULL,
  `cheque_number` varchar(60) DEFAULT NULL,
  `receipt_number` varchar(60) DEFAULT NULL,
  `bank_account_id` int DEFAULT NULL,
  `remarks` text,
  `status` enum('Draft','Approved') DEFAULT 'Draft',
  `created_by` int DEFAULT NULL,
  `approved_by` int DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fiscal_year_id` (`fiscal_year_id`),
  KEY `sub_budget_id` (`sub_budget_id`),
  KEY `income_category_id` (`income_category_id`),
  KEY `donor_id` (`donor_id`),
  KEY `bank_account_id` (`bank_account_id`),
  KEY `kafil_id` (`kafil_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `income_categories`
--

DROP TABLE IF EXISTS `income_categories`;
CREATE TABLE IF NOT EXISTS `income_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sub_budget_id` int NOT NULL,
  `label` varchar(120) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `label` (`label`),
  KEY `sub_budget_id` (`sub_budget_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `kafils`
--

DROP TABLE IF EXISTS `kafils`;
CREATE TABLE IF NOT EXISTS `kafils` (
  `id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(120) DEFAULT NULL,
  `last_name` varchar(120) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `email` varchar(120) DEFAULT NULL,
  `address` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `kafil_sponsorship`
--

DROP TABLE IF EXISTS `kafil_sponsorship`;
CREATE TABLE IF NOT EXISTS `kafil_sponsorship` (
  `id` int NOT NULL AUTO_INCREMENT,
  `kafil_id` int NOT NULL,
  `family_id` int DEFAULT NULL,
  `widow_id` int DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  UNIQUE KEY `u_kafil_target` (`kafil_id`,`family_id`,`widow_id`),
  KEY `family_id` (`family_id`),
  KEY `widow_id` (`widow_id`)
) ;

-- --------------------------------------------------------

--
-- Table structure for table `orphans`
--

DROP TABLE IF EXISTS `orphans`;
CREATE TABLE IF NOT EXISTS `orphans` (
  `id` int NOT NULL AUTO_INCREMENT,
  `widow_id` int NOT NULL,
  `first_name` varchar(120) DEFAULT NULL,
  `last_name` varchar(120) DEFAULT NULL,
  `sex` enum('Male','Female') NOT NULL,
  `birth_date` date DEFAULT NULL,
  `school_level` varchar(120) DEFAULT NULL,
  `school_name` varchar(120) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `widow_id` (`widow_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `partners`
--

DROP TABLE IF EXISTS `partners`;
CREATE TABLE IF NOT EXISTS `partners` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(120) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `email` varchar(120) DEFAULT NULL,
  `address` text,
  `field_id` int DEFAULT NULL,
  `subfield_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `field_id` (`field_id`),
  KEY `subfield_id` (`subfield_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `partner_fields`
--

DROP TABLE IF EXISTS `partner_fields`;
CREATE TABLE IF NOT EXISTS `partner_fields` (
  `id` int NOT NULL AUTO_INCREMENT,
  `label` varchar(120) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `label` (`label`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `partner_subfields`
--

DROP TABLE IF EXISTS `partner_subfields`;
CREATE TABLE IF NOT EXISTS `partner_subfields` (
  `id` int NOT NULL AUTO_INCREMENT,
  `field_id` int NOT NULL,
  `label` varchar(120) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_field_label` (`field_id`,`label`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `skills`
--

DROP TABLE IF EXISTS `skills`;
CREATE TABLE IF NOT EXISTS `skills` (
  `id` int NOT NULL AUTO_INCREMENT,
  `label` varchar(120) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `label` (`label`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sub_budgets`
--

DROP TABLE IF EXISTS `sub_budgets`;
CREATE TABLE IF NOT EXISTS `sub_budgets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `budget_id` int NOT NULL,
  `label` varchar(120) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `budget_id` (`budget_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `transfers`
--

DROP TABLE IF EXISTS `transfers`;
CREATE TABLE IF NOT EXISTS `transfers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fiscal_year_id` int NOT NULL,
  `transfer_date` date NOT NULL,
  `from_account_id` int NOT NULL,
  `to_account_id` int NOT NULL,
  `amount` decimal(16,2) NOT NULL,
  `remarks` text,
  `status` enum('Draft','Approved') DEFAULT 'Draft',
  `created_by` int DEFAULT NULL,
  `approved_by` int DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fiscal_year_id` (`fiscal_year_id`),
  KEY `from_account_id` (`from_account_id`),
  KEY `to_account_id` (`to_account_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(120) DEFAULT NULL,
  `email` varchar(120) DEFAULT NULL,
  `is_admin` tinyint DEFAULT '0',
  `active` tinyint DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `widows`
--

DROP TABLE IF EXISTS `widows`;
CREATE TABLE IF NOT EXISTS `widows` (
  `id` int NOT NULL AUTO_INCREMENT,
  `family_id` int NOT NULL,
  `first_name` varchar(120) DEFAULT NULL,
  `last_name` varchar(120) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `email` varchar(120) DEFAULT NULL,
  `address` text,
  `neighborhood` varchar(120) DEFAULT NULL,
  `admission_date` date DEFAULT NULL,
  `national_id` varchar(30) DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `marital_status` enum('Single','Widowed','Remarried','Divorced') DEFAULT 'Widowed',
  `education_level` varchar(100) DEFAULT NULL,
  `disability_flag` tinyint DEFAULT '0',
  `disability_type` varchar(120) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `family_id` (`family_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `widow_aid`
--

DROP TABLE IF EXISTS `widow_aid`;
CREATE TABLE IF NOT EXISTS `widow_aid` (
  `widow_file_id` int NOT NULL,
  `aid_type_id` int NOT NULL,
  PRIMARY KEY (`widow_file_id`,`aid_type_id`),
  KEY `aid_type_id` (`aid_type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `widow_expense_categories`
--

DROP TABLE IF EXISTS `widow_expense_categories`;
CREATE TABLE IF NOT EXISTS `widow_expense_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `label` varchar(120) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `label` (`label`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `widow_files`
--

DROP TABLE IF EXISTS `widow_files`;
CREATE TABLE IF NOT EXISTS `widow_files` (
  `id` int NOT NULL AUTO_INCREMENT,
  `widow_id` int NOT NULL,
  `social_situation` enum('Critical','Okay','Well') DEFAULT 'Critical',
  `has_chronic_disease` tinyint DEFAULT '0',
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `widow_id` (`widow_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `widow_illness`
--

DROP TABLE IF EXISTS `widow_illness`;
CREATE TABLE IF NOT EXISTS `widow_illness` (
  `widow_file_id` int NOT NULL,
  `illness_id` int NOT NULL,
  PRIMARY KEY (`widow_file_id`,`illness_id`),
  KEY `illness_id` (`illness_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `widow_income_sources`
--

DROP TABLE IF EXISTS `widow_income_sources`;
CREATE TABLE IF NOT EXISTS `widow_income_sources` (
  `id` int NOT NULL AUTO_INCREMENT,
  `label` varchar(120) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `label` (`label`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `widow_maouna`
--

DROP TABLE IF EXISTS `widow_maouna`;
CREATE TABLE IF NOT EXISTS `widow_maouna` (
  `widow_file_id` int NOT NULL,
  `partner_id` int DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `is_active` tinyint DEFAULT '1',
  PRIMARY KEY (`widow_file_id`),
  KEY `partner_id` (`partner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `widow_skill`
--

DROP TABLE IF EXISTS `widow_skill`;
CREATE TABLE IF NOT EXISTS `widow_skill` (
  `widow_file_id` int NOT NULL,
  `skill_id` int NOT NULL,
  PRIMARY KEY (`widow_file_id`,`skill_id`),
  KEY `skill_id` (`skill_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `widow_social`
--

DROP TABLE IF EXISTS `widow_social`;
CREATE TABLE IF NOT EXISTS `widow_social` (
  `widow_file_id` int NOT NULL,
  `housing_type_id` int DEFAULT NULL,
  `housing_status` enum('Owned','Rented','Free') DEFAULT 'Free',
  `health_cover` enum('None','RAMED','PrivateInsurance','Other') DEFAULT 'None',
  `has_electricity` tinyint DEFAULT '0',
  `has_water` tinyint DEFAULT '0',
  `has_furniture` tinyint DEFAULT '0',
  `remarks` text,
  PRIMARY KEY (`widow_file_id`),
  KEY `housing_type_id` (`housing_type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `widow_social_expense`
--

DROP TABLE IF EXISTS `widow_social_expense`;
CREATE TABLE IF NOT EXISTS `widow_social_expense` (
  `widow_file_id` int NOT NULL,
  `category_id` int NOT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `remarks` text,
  PRIMARY KEY (`widow_file_id`,`category_id`),
  KEY `category_id` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `widow_social_income`
--

DROP TABLE IF EXISTS `widow_social_income`;
CREATE TABLE IF NOT EXISTS `widow_social_income` (
  `widow_file_id` int NOT NULL,
  `source_id` int NOT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `remarks` text,
  PRIMARY KEY (`widow_file_id`,`source_id`),
  KEY `source_id` (`source_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `beneficiary_group_members`
--
ALTER TABLE `beneficiary_group_members`
  ADD CONSTRAINT `beneficiary_group_members_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `beneficiary_groups` (`id`);

--
-- Constraints for table `budgets`
--
ALTER TABLE `budgets`
  ADD CONSTRAINT `budgets_ibfk_1` FOREIGN KEY (`fiscal_year_id`) REFERENCES `fiscal_years` (`id`);

--
-- Constraints for table `expenses`
--
ALTER TABLE `expenses`
  ADD CONSTRAINT `expenses_ibfk_1` FOREIGN KEY (`fiscal_year_id`) REFERENCES `fiscal_years` (`id`),
  ADD CONSTRAINT `expenses_ibfk_2` FOREIGN KEY (`sub_budget_id`) REFERENCES `sub_budgets` (`id`),
  ADD CONSTRAINT `expenses_ibfk_3` FOREIGN KEY (`expense_category_id`) REFERENCES `expense_categories` (`id`),
  ADD CONSTRAINT `expenses_ibfk_4` FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`),
  ADD CONSTRAINT `expenses_ibfk_5` FOREIGN KEY (`bank_account_id`) REFERENCES `bank_accounts` (`id`);

--
-- Constraints for table `expense_beneficiaries`
--
ALTER TABLE `expense_beneficiaries`
  ADD CONSTRAINT `expense_beneficiaries_ibfk_1` FOREIGN KEY (`expense_id`) REFERENCES `expenses` (`id`);

--
-- Constraints for table `expense_beneficiary_groups`
--
ALTER TABLE `expense_beneficiary_groups`
  ADD CONSTRAINT `expense_beneficiary_groups_ibfk_1` FOREIGN KEY (`expense_id`) REFERENCES `expenses` (`id`),
  ADD CONSTRAINT `expense_beneficiary_groups_ibfk_2` FOREIGN KEY (`group_id`) REFERENCES `beneficiary_groups` (`id`);

--
-- Constraints for table `expense_categories`
--
ALTER TABLE `expense_categories`
  ADD CONSTRAINT `expense_categories_ibfk_1` FOREIGN KEY (`sub_budget_id`) REFERENCES `sub_budgets` (`id`);

--
-- Constraints for table `incomes`
--
ALTER TABLE `incomes`
  ADD CONSTRAINT `incomes_ibfk_1` FOREIGN KEY (`fiscal_year_id`) REFERENCES `fiscal_years` (`id`),
  ADD CONSTRAINT `incomes_ibfk_2` FOREIGN KEY (`sub_budget_id`) REFERENCES `sub_budgets` (`id`),
  ADD CONSTRAINT `incomes_ibfk_3` FOREIGN KEY (`income_category_id`) REFERENCES `income_categories` (`id`),
  ADD CONSTRAINT `incomes_ibfk_4` FOREIGN KEY (`donor_id`) REFERENCES `donors` (`id`),
  ADD CONSTRAINT `incomes_ibfk_5` FOREIGN KEY (`bank_account_id`) REFERENCES `bank_accounts` (`id`),
  ADD CONSTRAINT `incomes_ibfk_6` FOREIGN KEY (`kafil_id`) REFERENCES `kafils` (`id`);

--
-- Constraints for table `income_categories`
--
ALTER TABLE `income_categories`
  ADD CONSTRAINT `income_categories_ibfk_1` FOREIGN KEY (`sub_budget_id`) REFERENCES `sub_budgets` (`id`);

--
-- Constraints for table `kafil_sponsorship`
--
ALTER TABLE `kafil_sponsorship`
  ADD CONSTRAINT `kafil_sponsorship_ibfk_1` FOREIGN KEY (`kafil_id`) REFERENCES `kafils` (`id`),
  ADD CONSTRAINT `kafil_sponsorship_ibfk_2` FOREIGN KEY (`family_id`) REFERENCES `families` (`id`),
  ADD CONSTRAINT `kafil_sponsorship_ibfk_3` FOREIGN KEY (`widow_id`) REFERENCES `widows` (`id`);

--
-- Constraints for table `orphans`
--
ALTER TABLE `orphans`
  ADD CONSTRAINT `orphans_ibfk_1` FOREIGN KEY (`widow_id`) REFERENCES `widows` (`id`);

--
-- Constraints for table `partners`
--
ALTER TABLE `partners`
  ADD CONSTRAINT `partners_ibfk_1` FOREIGN KEY (`field_id`) REFERENCES `partner_fields` (`id`),
  ADD CONSTRAINT `partners_ibfk_2` FOREIGN KEY (`subfield_id`) REFERENCES `partner_subfields` (`id`);

--
-- Constraints for table `partner_subfields`
--
ALTER TABLE `partner_subfields`
  ADD CONSTRAINT `partner_subfields_ibfk_1` FOREIGN KEY (`field_id`) REFERENCES `partner_fields` (`id`);

--
-- Constraints for table `sub_budgets`
--
ALTER TABLE `sub_budgets`
  ADD CONSTRAINT `sub_budgets_ibfk_1` FOREIGN KEY (`budget_id`) REFERENCES `budgets` (`id`);

--
-- Constraints for table `transfers`
--
ALTER TABLE `transfers`
  ADD CONSTRAINT `transfers_ibfk_1` FOREIGN KEY (`fiscal_year_id`) REFERENCES `fiscal_years` (`id`),
  ADD CONSTRAINT `transfers_ibfk_2` FOREIGN KEY (`from_account_id`) REFERENCES `bank_accounts` (`id`),
  ADD CONSTRAINT `transfers_ibfk_3` FOREIGN KEY (`to_account_id`) REFERENCES `bank_accounts` (`id`);

--
-- Constraints for table `widows`
--
ALTER TABLE `widows`
  ADD CONSTRAINT `widows_ibfk_1` FOREIGN KEY (`family_id`) REFERENCES `families` (`id`);

--
-- Constraints for table `widow_aid`
--
ALTER TABLE `widow_aid`
  ADD CONSTRAINT `widow_aid_ibfk_1` FOREIGN KEY (`widow_file_id`) REFERENCES `widow_files` (`id`),
  ADD CONSTRAINT `widow_aid_ibfk_2` FOREIGN KEY (`aid_type_id`) REFERENCES `aid_types` (`id`);

--
-- Constraints for table `widow_files`
--
ALTER TABLE `widow_files`
  ADD CONSTRAINT `widow_files_ibfk_1` FOREIGN KEY (`widow_id`) REFERENCES `widows` (`id`);

--
-- Constraints for table `widow_illness`
--
ALTER TABLE `widow_illness`
  ADD CONSTRAINT `widow_illness_ibfk_1` FOREIGN KEY (`widow_file_id`) REFERENCES `widow_files` (`id`),
  ADD CONSTRAINT `widow_illness_ibfk_2` FOREIGN KEY (`illness_id`) REFERENCES `illnesses` (`id`);

--
-- Constraints for table `widow_maouna`
--
ALTER TABLE `widow_maouna`
  ADD CONSTRAINT `widow_maouna_ibfk_1` FOREIGN KEY (`widow_file_id`) REFERENCES `widow_files` (`id`),
  ADD CONSTRAINT `widow_maouna_ibfk_2` FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`);

--
-- Constraints for table `widow_skill`
--
ALTER TABLE `widow_skill`
  ADD CONSTRAINT `widow_skill_ibfk_1` FOREIGN KEY (`widow_file_id`) REFERENCES `widow_files` (`id`),
  ADD CONSTRAINT `widow_skill_ibfk_2` FOREIGN KEY (`skill_id`) REFERENCES `skills` (`id`);

--
-- Constraints for table `widow_social`
--
ALTER TABLE `widow_social`
  ADD CONSTRAINT `widow_social_ibfk_1` FOREIGN KEY (`widow_file_id`) REFERENCES `widow_files` (`id`),
  ADD CONSTRAINT `widow_social_ibfk_2` FOREIGN KEY (`housing_type_id`) REFERENCES `housing_types` (`id`);

--
-- Constraints for table `widow_social_expense`
--
ALTER TABLE `widow_social_expense`
  ADD CONSTRAINT `widow_social_expense_ibfk_1` FOREIGN KEY (`widow_file_id`) REFERENCES `widow_files` (`id`),
  ADD CONSTRAINT `widow_social_expense_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `widow_expense_categories` (`id`);

--
-- Constraints for table `widow_social_income`
--
ALTER TABLE `widow_social_income`
  ADD CONSTRAINT `widow_social_income_ibfk_1` FOREIGN KEY (`widow_file_id`) REFERENCES `widow_files` (`id`),
  ADD CONSTRAINT `widow_social_income_ibfk_2` FOREIGN KEY (`source_id`) REFERENCES `widow_income_sources` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
