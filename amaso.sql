-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Aug 30, 2025 at 10:12 PM
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
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `label` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `aid_types_label_unique` (`label`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `aid_types`
--

INSERT INTO `aid_types` (`id`, `label`, `created_at`, `updated_at`) VALUES
(1, 'مساعدة شهرية', '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(2, 'مساعدة طبية', '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(3, 'مساعدة تعليمية', '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(4, 'مساعدة طارئة', '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(5, 'مساعدة غذائية', '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(6, 'مساعدة كسوة', '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(7, 'مساعدة إيجار', '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(8, 'مساعدة فواتير', '2025-08-20 10:40:20', '2025-08-20 10:40:20');

-- --------------------------------------------------------

--
-- Table structure for table `bank_accounts`
--

DROP TABLE IF EXISTS `bank_accounts`;
CREATE TABLE IF NOT EXISTS `bank_accounts` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `label` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_name` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_number` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `balance` decimal(16,2) NOT NULL DEFAULT '0.00',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `bank_accounts_label_unique` (`label`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `bank_accounts`
--

INSERT INTO `bank_accounts` (`id`, `label`, `bank_name`, `account_number`, `balance`, `notes`, `created_at`, `updated_at`) VALUES
(1, 'حساب البنك الشعبي الرئيسي', 'البنك الشعبي', '001234567890', 309700.00, 'الحساب الرئيسي للجمعية', '2025-08-28 23:19:23', '2025-08-30 16:06:20'),
(2, 'حساب التوفير - التجاري وفا', 'التجاري وفا بنك', '002345678901', 164000.00, 'حساب التوفير للطوارئ', '2025-08-28 23:19:23', '2025-08-29 13:30:29');

-- --------------------------------------------------------

--
-- Table structure for table `beneficiary_groups`
--

DROP TABLE IF EXISTS `beneficiary_groups`;
CREATE TABLE IF NOT EXISTS `beneficiary_groups` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `label` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `beneficiary_groups_label_unique` (`label`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `beneficiary_group_members`
--

DROP TABLE IF EXISTS `beneficiary_group_members`;
CREATE TABLE IF NOT EXISTS `beneficiary_group_members` (
  `group_id` bigint UNSIGNED NOT NULL,
  `beneficiary_type` enum('Widow','Orphan') COLLATE utf8mb4_unicode_ci NOT NULL,
  `beneficiary_id` bigint UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`group_id`,`beneficiary_type`,`beneficiary_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cache`
--

DROP TABLE IF EXISTS `cache`;
CREATE TABLE IF NOT EXISTS `cache` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cache_locks`
--

DROP TABLE IF EXISTS `cache_locks`;
CREATE TABLE IF NOT EXISTS `cache_locks` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `donors`
--

DROP TABLE IF EXISTS `donors`;
CREATE TABLE IF NOT EXISTS `donors` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `first_name` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `is_kafil` tinyint(1) NOT NULL DEFAULT '0',
  `total_given` decimal(16,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `donors`
--

INSERT INTO `donors` (`id`, `first_name`, `last_name`, `phone`, `email`, `address`, `created_at`, `updated_at`, `is_kafil`, `total_given`) VALUES
(1, 'test', 'donor', '4534346345634', NULL, 'sdrgsdfgsd', '2025-08-20 14:36:56', '2025-08-20 14:36:56', 0, 0.00),
(11, 'kaFIL', 'duplicate', '54554434', 'fsgfsg@dgdfsf.sdfdsf', NULL, '2025-08-21 09:24:29', '2025-08-21 10:35:56', 1, 0.00),
(13, 'bdfghgd', 'gfdfgdf', '453455435435', 'gfdg@fddfg.dfgdgdf', 'fdgsgfdg', '2025-08-24 17:34:40', '2025-08-25 12:35:08', 1, 0.00),
(14, 'أحمد', 'المحسن', '+212661234567', 'ahmed.donor@email.com', 'الرباط، المغرب', '2025-08-28 23:19:23', '2025-08-28 23:19:23', 0, 0.00),
(15, 'فاطمة', 'الخيرية', '+212662345678', 'fatima.donor@email.com', 'الدار البيضاء، المغرب', '2025-08-28 23:19:23', '2025-08-28 23:19:23', 0, 0.00);

-- --------------------------------------------------------

--
-- Table structure for table `expenses`
--

DROP TABLE IF EXISTS `expenses`;
CREATE TABLE IF NOT EXISTS `expenses` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `fiscal_year_id` bigint UNSIGNED NOT NULL,
  `sub_budget_id` bigint UNSIGNED NOT NULL,
  `expense_category_id` bigint UNSIGNED NOT NULL,
  `partner_id` bigint UNSIGNED DEFAULT NULL,
  `details` text COLLATE utf8mb4_unicode_ci,
  `expense_date` date NOT NULL,
  `amount` decimal(16,2) NOT NULL,
  `payment_method` enum('Cash','Cheque','BankWire') COLLATE utf8mb4_unicode_ci NOT NULL,
  `cheque_number` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `receipt_number` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_account_id` bigint UNSIGNED DEFAULT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `unrelated_to_benef` tinyint(1) NOT NULL DEFAULT '0',
  `status` enum('Draft','Approved') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Draft',
  `created_by` bigint UNSIGNED DEFAULT NULL,
  `approved_by` bigint UNSIGNED DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `expenses_fiscal_year_id_foreign` (`fiscal_year_id`),
  KEY `expenses_sub_budget_id_foreign` (`sub_budget_id`),
  KEY `expenses_expense_category_id_foreign` (`expense_category_id`),
  KEY `expenses_partner_id_foreign` (`partner_id`),
  KEY `expenses_bank_account_id_foreign` (`bank_account_id`),
  KEY `expenses_created_by_foreign` (`created_by`),
  KEY `expenses_approved_by_foreign` (`approved_by`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `expenses`
--

INSERT INTO `expenses` (`id`, `fiscal_year_id`, `sub_budget_id`, `expense_category_id`, `partner_id`, `details`, `expense_date`, `amount`, `payment_method`, `cheque_number`, `receipt_number`, `bank_account_id`, `remarks`, `unrelated_to_benef`, `status`, `created_by`, `approved_by`, `approved_at`, `created_at`, `updated_at`) VALUES
(1, 2, 1, 1, NULL, 'مساعدة شهرية للأرامل - مارس 2024', '2024-03-25', 15000.00, 'BankWire', NULL, 'EXP-2024-001', 1, 'دفعة مارس للأرامل المستفيدات', 0, 'Approved', 2, 2, '2025-08-16 23:19:23', '2025-08-28 23:19:23', '2025-08-28 23:19:23'),
(2, 2, 2, 2, NULL, 'شراء مواد تعليمية للبرنامج', '2024-06-20', 3500.00, 'Cash', NULL, 'EXP-2024-002', NULL, 'مصروف في انتظار الموافقة', 0, 'Draft', 2, NULL, NULL, '2025-08-28 23:19:23', '2025-08-28 23:19:23'),
(3, 2, 1, 1, NULL, 'مساعدة طبية عاجلة', '2024-05-30', 2500.00, 'Cheque', 'CHQ-EXP-001', 'EXP-2024-003', NULL, 'مساعدة طبية للأرملة خديجة', 0, 'Approved', 2, 2, '2025-08-22 23:19:23', '2025-08-28 23:19:23', '2025-08-28 23:19:23');

-- --------------------------------------------------------

--
-- Table structure for table `expense_beneficiaries`
--

DROP TABLE IF EXISTS `expense_beneficiaries`;
CREATE TABLE IF NOT EXISTS `expense_beneficiaries` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `expense_id` bigint UNSIGNED NOT NULL,
  `beneficiary_type` enum('Widow','Orphan') COLLATE utf8mb4_unicode_ci NOT NULL,
  `beneficiary_id` bigint UNSIGNED NOT NULL,
  `amount` decimal(16,2) NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `expense_beneficiaries_expense_id_foreign` (`expense_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `expense_beneficiary_groups`
--

DROP TABLE IF EXISTS `expense_beneficiary_groups`;
CREATE TABLE IF NOT EXISTS `expense_beneficiary_groups` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `expense_id` bigint UNSIGNED NOT NULL,
  `group_id` bigint UNSIGNED NOT NULL,
  `amount` decimal(16,2) NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `expense_beneficiary_groups_expense_id_foreign` (`expense_id`),
  KEY `expense_beneficiary_groups_group_id_foreign` (`group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `expense_categories`
--

DROP TABLE IF EXISTS `expense_categories`;
CREATE TABLE IF NOT EXISTS `expense_categories` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `sub_budget_id` bigint UNSIGNED NOT NULL,
  `label` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `expense_categories_label_unique` (`label`),
  KEY `expense_categories_sub_budget_id_foreign` (`sub_budget_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1001 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `expense_categories`
--

INSERT INTO `expense_categories` (`id`, `sub_budget_id`, `label`, `created_at`, `updated_at`) VALUES
(1, 1, 'أدوية ومستلزمات طبية', '2025-08-29 19:56:42', '2025-08-29 19:56:42'),
(2, 1, 'فحوصات طبية', '2025-08-29 19:56:42', '2025-08-29 19:56:42'),
(3, 1, 'عمليات جراحية', '2025-08-29 19:56:42', '2025-08-29 19:56:42'),
(4, 1, 'علاج طبيعي', '2025-08-29 19:56:42', '2025-08-29 19:56:42'),
(5, 1, 'مساعدات طبية طارئة', '2025-08-29 19:56:42', '2025-08-29 19:56:42'),
(6, 2, 'رسوم مدرسية', '2025-08-29 19:56:42', '2025-08-29 19:56:42'),
(7, 2, 'مواد تعليمية', '2025-08-29 19:56:42', '2025-08-29 19:56:42'),
(8, 2, 'دورات تدريبية', '2025-08-29 19:56:42', '2025-08-29 19:56:42'),
(9, 2, 'منح الطلاب', '2025-08-29 19:56:42', '2025-08-29 19:56:42'),
(10, 2, 'مصاريف النقل للطلاب', '2025-08-29 19:56:42', '2025-08-29 19:56:42'),
(11, 3, 'وقود', '2025-08-29 19:56:42', '2025-08-29 19:56:42'),
(12, 3, 'صيانة المركبات', '2025-08-29 19:56:42', '2025-08-29 19:56:42'),
(13, 3, 'تأمين المركبات', '2025-08-29 19:56:42', '2025-08-29 19:56:42'),
(14, 3, 'أجرة سائقين', '2025-08-29 19:56:42', '2025-08-29 19:56:42'),
(15, 3, 'تذاكر النقل العام', '2025-08-29 19:56:42', '2025-08-29 19:56:42'),
(16, 4, 'رواتب الموظفين', '2025-08-29 19:56:42', '2025-08-29 19:56:42'),
(17, 4, 'مصاريف المكتب', '2025-08-29 19:56:42', '2025-08-29 19:56:42'),
(18, 4, 'إيجار', '2025-08-29 19:56:42', '2025-08-29 19:56:42'),
(19, 4, 'كهرباء وماء', '2025-08-29 19:56:42', '2025-08-29 19:56:42'),
(20, 4, 'مصاريف الاتصالات', '2025-08-29 19:56:42', '2025-08-29 19:56:42'),
(21, 4, 'مصاريف قانونية ومحاسبية', '2025-08-29 19:56:42', '2025-08-29 19:56:42'),
(22, 5, 'مساعدات نقدية للأرامل', '2025-08-29 19:56:42', '2025-08-29 19:56:42'),
(23, 5, 'مساعدات نقدية للأيتام', '2025-08-29 19:56:42', '2025-08-29 19:56:42'),
(24, 5, 'مساعدات غذائية', '2025-08-29 19:56:42', '2025-08-29 19:56:42'),
(25, 5, 'مساعدات سكن', '2025-08-29 19:56:42', '2025-08-29 19:56:42'),
(26, 5, 'مساعدات كسوة', '2025-08-29 19:56:42', '2025-08-29 19:56:42'),
(27, 6, 'تنظيم الفعاليات', '2025-08-29 19:56:42', '2025-08-29 19:56:42'),
(28, 6, 'برامج ترفيهية للأطفال', '2025-08-29 19:56:42', '2025-08-29 19:56:42'),
(29, 6, 'ورش تدريبية', '2025-08-29 19:56:42', '2025-08-29 19:56:42'),
(30, 6, 'مؤتمرات ولقاءات', '2025-08-29 19:56:42', '2025-08-29 19:56:42'),
(31, 6, 'مواد دعائية وإعلانية', '2025-08-29 19:56:42', '2025-08-29 19:56:42'),
(999, 1, 'Deleted Category (Default)', '2025-08-29 22:44:14', '2025-08-29 22:44:14');

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

DROP TABLE IF EXISTS `failed_jobs`;
CREATE TABLE IF NOT EXISTS `failed_jobs` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `fiscal_years`
--

DROP TABLE IF EXISTS `fiscal_years`;
CREATE TABLE IF NOT EXISTS `fiscal_years` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `year` year NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `carryover_prev_year` decimal(16,2) NOT NULL DEFAULT '0.00',
  `carryover_next_year` decimal(16,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `fiscal_years_year_unique` (`year`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `fiscal_years`
--

INSERT INTO `fiscal_years` (`id`, `year`, `is_active`, `carryover_prev_year`, `carryover_next_year`, `created_at`, `updated_at`) VALUES
(1, '2023', 0, 15000.00, 45000.00, '2025-08-28 23:19:23', '2025-08-28 23:19:23'),
(2, '2024', 0, 45000.00, 431000.00, '2025-08-28 23:19:23', '2025-08-29 13:30:29'),
(3, '2025', 1, 431000.00, 0.00, '2025-08-29 13:30:29', '2025-08-29 19:03:25');

-- --------------------------------------------------------

--
-- Table structure for table `housing_types`
--

DROP TABLE IF EXISTS `housing_types`;
CREATE TABLE IF NOT EXISTS `housing_types` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `label` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `housing_types_label_unique` (`label`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `housing_types`
--

INSERT INTO `housing_types` (`id`, `label`, `created_at`, `updated_at`) VALUES
(1, 'شقة', '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(2, 'منزل', '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(3, 'غرفة', '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(4, 'بيت شعبي', '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(5, 'كوخ', '2025-08-20 10:40:20', '2025-08-20 10:40:20');

-- --------------------------------------------------------

--
-- Table structure for table `illnesses`
--

DROP TABLE IF EXISTS `illnesses`;
CREATE TABLE IF NOT EXISTS `illnesses` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `label` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_chronic` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `illnesses_label_unique` (`label`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `illnesses`
--

INSERT INTO `illnesses` (`id`, `label`, `is_chronic`, `created_at`, `updated_at`) VALUES
(1, 'سكري', 0, '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(2, 'ضغط دم', 0, '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(3, 'قلب', 0, '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(4, 'كلى', 0, '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(5, 'ربو', 0, '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(6, 'التهاب مفاصل', 0, '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(7, 'صداع نصفي', 0, '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(8, 'فقر دم', 0, '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(9, 'غدة درقية', 0, '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(10, 'dsds', 0, '2025-08-25 11:30:11', '2025-08-25 11:30:11'),
(13, 'chronic', 1, '2025-08-28 16:03:48', '2025-08-28 16:04:20');

-- --------------------------------------------------------

--
-- Table structure for table `incomes`
--

DROP TABLE IF EXISTS `incomes`;
CREATE TABLE IF NOT EXISTS `incomes` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `fiscal_year_id` bigint UNSIGNED NOT NULL,
  `sub_budget_id` bigint UNSIGNED NOT NULL,
  `income_category_id` bigint UNSIGNED NOT NULL,
  `donor_id` bigint UNSIGNED DEFAULT NULL,
  `kafil_id` bigint UNSIGNED DEFAULT NULL,
  `income_date` date NOT NULL,
  `amount` decimal(16,2) NOT NULL,
  `payment_method` enum('Cash','Cheque','BankWire') COLLATE utf8mb4_unicode_ci NOT NULL,
  `cheque_number` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `receipt_number` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_account_id` bigint UNSIGNED DEFAULT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `status` enum('Draft','Approved') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Draft',
  `created_by` bigint UNSIGNED DEFAULT NULL,
  `approved_by` bigint UNSIGNED DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `transferred_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `incomes_fiscal_year_id_foreign` (`fiscal_year_id`),
  KEY `incomes_sub_budget_id_foreign` (`sub_budget_id`),
  KEY `incomes_income_category_id_foreign` (`income_category_id`),
  KEY `incomes_donor_id_foreign` (`donor_id`),
  KEY `incomes_kafil_id_foreign` (`kafil_id`),
  KEY `incomes_bank_account_id_foreign` (`bank_account_id`),
  KEY `incomes_created_by_foreign` (`created_by`),
  KEY `incomes_approved_by_foreign` (`approved_by`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `incomes`
--

INSERT INTO `incomes` (`id`, `fiscal_year_id`, `sub_budget_id`, `income_category_id`, `donor_id`, `kafil_id`, `income_date`, `amount`, `payment_method`, `cheque_number`, `receipt_number`, `bank_account_id`, `remarks`, `status`, `created_by`, `approved_by`, `approved_at`, `transferred_at`, `created_at`, `updated_at`) VALUES
(1, 2, 1, 1, 14, NULL, '2024-03-15', 25000.00, 'BankWire', NULL, 'REC-2024-001', 1, 'تبرع شهري من أحمد المحسن', 'Approved', 2, 2, '2025-08-18 23:19:23', NULL, '2025-08-28 23:19:23', '2025-08-28 23:19:23'),
(2, 2, 1, 1, 15, NULL, '2024-04-20', 5000.00, 'Cash', NULL, 'REC-2024-002', 1, 'تبرع نقدي من فاطمة الخيرية', 'Approved', 2, 2, '2025-08-23 23:19:23', '2025-08-28 23:19:48', '2025-08-28 23:19:23', '2025-08-28 23:19:48'),
(3, 2, 2, 999, 14, NULL, '2024-05-10', 15000.00, 'Cheque', 'CHQ-001234', 'REC-2024-003', 2, 'تبرع بشيك لبرنامج التعليم', 'Approved', 2, 2, '2025-08-20 23:19:23', '2025-08-25 23:19:23', '2025-08-28 23:19:23', '2025-08-29 22:53:10'),
(5, 2, 2, 999, 14, NULL, '2024-07-15', 12000.00, 'Cheque', 'CHQ-005678', 'REC-2024-005', 1, 'شيك لم يتم إيداعه بعد', 'Approved', 2, 2, '2025-08-26 23:19:23', '2025-07-30 23:00:00', '2025-08-28 23:19:23', '2025-08-30 12:09:42'),
(13, 3, 6, 14, 1, NULL, '2025-07-02', 1000.00, 'Cash', '', '343', 1, 'adfadfad', 'Approved', 1, 1, '2025-08-30 12:06:29', '2025-08-01 23:00:00', '2025-08-30 10:50:38', '2025-08-30 12:08:59'),
(16, 3, 5, 12, 11, NULL, '2025-02-28', 1500.00, 'BankWire', NULL, NULL, 1, 'fdsdf', 'Approved', 1, 1, '2025-08-30 12:13:15', '2025-02-28 00:00:00', '2025-08-30 12:11:02', '2025-08-30 12:13:15'),
(17, 3, 8, 1002, NULL, 16, '2025-06-12', 1200.00, 'BankWire', NULL, NULL, 1, 'kafala', 'Approved', 1, 1, '2025-08-30 15:38:07', '2025-06-11 23:00:00', '2025-08-30 15:37:54', '2025-08-30 15:38:07'),
(18, 3, 4, 10, 15, NULL, '2025-06-29', 6000.00, 'Cash', NULL, '55446', 1, 'dsfsdf sdfsdfs', 'Approved', 1, 1, '2025-08-30 15:53:52', '2025-08-29 23:00:00', '2025-08-30 15:46:07', '2025-08-30 15:56:25'),
(19, 3, 4, 10, 14, NULL, '2025-08-14', 5000.00, 'Cash', NULL, '55446', 1, 'dsfsdf sdfsdfs', 'Approved', 1, 1, '2025-08-30 16:00:10', '2025-07-28 23:00:00', '2025-08-30 15:46:55', '2025-08-30 16:06:20');

-- --------------------------------------------------------

--
-- Table structure for table `income_categories`
--

DROP TABLE IF EXISTS `income_categories`;
CREATE TABLE IF NOT EXISTS `income_categories` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `sub_budget_id` bigint UNSIGNED NOT NULL,
  `label` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `income_categories_label_unique` (`label`),
  KEY `income_categories_sub_budget_id_foreign` (`sub_budget_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1003 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `income_categories`
--

INSERT INTO `income_categories` (`id`, `sub_budget_id`, `label`, `created_at`, `updated_at`) VALUES
(1, 1, 'تبرعات للرعاية الصحية', '2025-08-29 19:56:42', '2025-08-29 19:56:42'),
(3, 1, 'دعم العلاجات', '2025-08-29 19:56:42', '2025-08-29 19:56:42'),
(4, 2, 'رسوم التدريب', '2025-08-29 19:56:42', '2025-08-29 19:56:42'),
(5, 2, 'تبرعات تعليمية', '2025-08-29 19:56:42', '2025-08-29 19:56:42'),
(6, 2, 'منح دراسية', '2025-08-29 19:56:42', '2025-08-29 19:56:42'),
(7, 3, 'تبرعات للمواصلات', '2025-08-29 19:56:42', '2025-08-29 19:56:42'),
(8, 3, 'دعم النقل', '2025-08-29 19:56:42', '2025-08-29 19:56:42'),
(9, 4, 'رسوم إدارية', '2025-08-29 19:56:42', '2025-08-29 19:56:42'),
(10, 4, 'تبرعات عامة', '2025-08-29 19:56:42', '2025-08-29 19:56:42'),
(11, 5, 'تبرعات للمساعدات الاجتماعية', '2025-08-29 19:56:42', '2025-08-29 19:56:42'),
(12, 5, 'زكاة', '2025-08-29 19:56:42', '2025-08-29 19:56:42'),
(13, 5, 'صدقات', '2025-08-29 19:56:42', '2025-08-29 19:56:42'),
(14, 6, 'رعاية الفعاليات', '2025-08-29 19:56:42', '2025-08-29 19:56:42'),
(15, 6, 'تبرعات للبرامج', '2025-08-29 19:56:42', '2025-08-29 19:56:42'),
(999, 1, 'Deleted Category (Default)', '2025-08-29 22:44:14', '2025-08-29 22:44:14'),
(1002, 8, 'كفالة شاملة', '2025-08-30 15:29:30', '2025-08-30 15:29:30');

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
CREATE TABLE IF NOT EXISTS `jobs` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` tinyint UNSIGNED NOT NULL,
  `reserved_at` int UNSIGNED DEFAULT NULL,
  `available_at` int UNSIGNED NOT NULL,
  `created_at` int UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_batches`
--

DROP TABLE IF EXISTS `job_batches`;
CREATE TABLE IF NOT EXISTS `job_batches` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `kafils`
--

DROP TABLE IF EXISTS `kafils`;
CREATE TABLE IF NOT EXISTS `kafils` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `first_name` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `donor_id` bigint UNSIGNED DEFAULT NULL,
  `monthly_pledge` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `kafils_donor_id_foreign` (`donor_id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `kafils`
--

INSERT INTO `kafils` (`id`, `first_name`, `last_name`, `phone`, `email`, `address`, `created_at`, `updated_at`, `donor_id`, `monthly_pledge`) VALUES
(16, 'kaFIL', 'duplicate', '54554434', 'fsgfsg@dgdfsf.sdfdsf', NULL, '2025-08-21 10:35:56', '2025-08-24 20:51:57', 11, 1200.00),
(18, 'bdfghgd', 'gfdfgdf', '453455435435', 'gfdg@fddfg.dfgdgdf', 'fdgsgfdg', '2025-08-25 12:35:08', '2025-08-25 12:35:08', 13, 1000.00);

-- --------------------------------------------------------

--
-- Table structure for table `kafil_sponsorship`
--

DROP TABLE IF EXISTS `kafil_sponsorship`;
CREATE TABLE IF NOT EXISTS `kafil_sponsorship` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `kafil_id` bigint UNSIGNED NOT NULL,
  `widow_id` bigint UNSIGNED NOT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `kafil_sponsorship_kafil_id_widow_id_unique` (`kafil_id`,`widow_id`),
  UNIQUE KEY `kafil_sponsorship_kafil_widow_unique` (`kafil_id`,`widow_id`),
  KEY `kafil_sponsorship_widow_id_foreign` (`widow_id`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `kafil_sponsorship`
--

INSERT INTO `kafil_sponsorship` (`id`, `kafil_id`, `widow_id`, `amount`, `created_at`, `updated_at`) VALUES
(19, 16, 2, 500.00, '2025-08-21 10:35:56', '2025-08-21 10:35:56'),
(21, 16, 3, 200.00, '2025-08-24 20:47:19', '2025-08-24 20:47:19'),
(22, 16, 1, 200.00, '2025-08-24 20:48:42', '2025-08-24 20:48:42'),
(23, 16, 13, 300.00, '2025-08-25 12:44:23', '2025-08-25 12:44:23'),
(24, 18, 13, 500.00, '2025-08-25 12:44:24', '2025-08-25 12:44:24'),
(25, 18, 15, 500.00, '2025-08-25 12:58:04', '2025-08-25 12:58:04');

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
CREATE TABLE IF NOT EXISTS `migrations` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000000_create_users_table', 1),
(2, '0001_01_01_000001_create_cache_table', 1),
(3, '0001_01_01_000002_create_jobs_table', 1),
(4, '2024_01_01_000001_create_aid_types_table', 1),
(5, '2024_01_01_000002_create_housing_types_table', 1),
(6, '2024_01_01_000003_create_skills_table', 1),
(7, '2024_01_01_000004_create_illnesses_table', 1),
(8, '2024_01_01_000005_create_partner_fields_table', 1),
(9, '2024_01_01_000006_create_partner_subfields_table', 1),
(10, '2024_01_01_000007_create_fiscal_years_table', 1),
(11, '2024_01_01_000008_create_bank_accounts_table', 1),
(12, '2024_01_01_000009_create_budgets_table', 1),
(13, '2024_01_01_000010_create_sub_budgets_table', 1),
(14, '2024_01_01_000011_create_donors_table', 1),
(15, '2024_01_01_000012_create_kafils_table', 1),
(16, '2024_01_01_000014_create_widows_table', 1),
(17, '2024_01_01_000015_create_orphans_table', 1),
(18, '2024_01_01_000016_create_kafil_sponsorship_table', 1),
(19, '2024_01_01_000017_create_income_categories_table', 1),
(20, '2024_01_01_000018_create_expense_categories_table', 1),
(21, '2024_01_01_000019_create_partners_table', 1),
(22, '2024_01_01_000020_create_incomes_table', 1),
(23, '2024_01_01_000021_create_expenses_table', 1),
(24, '2024_01_01_000022_create_transfers_table', 1),
(25, '2024_01_01_000023_create_beneficiary_groups_table', 1),
(26, '2024_01_01_000024_create_beneficiary_group_members_table', 1),
(27, '2024_01_01_000025_create_expense_beneficiaries_table', 1),
(28, '2024_01_01_000026_create_expense_beneficiary_groups_table', 1),
(29, '2024_01_01_000027_add_is_kafil_to_donors_table', 1),
(30, '2024_01_01_000028_add_donor_id_to_kafils_table', 1),
(31, '2024_01_01_000029_create_widow_files_table', 1),
(32, '2024_01_01_000030_create_widow_social_table', 1),
(33, '2024_01_01_000031_create_widow_income_categories_table', 1),
(34, '2024_01_01_000032_create_widow_expense_categories_table', 1),
(35, '2024_01_01_000033_create_widow_social_income_table', 1),
(36, '2024_01_01_000034_create_widow_social_expense_table', 1),
(37, '2024_01_01_000035_create_widow_skill_table', 1),
(38, '2024_01_01_000036_create_widow_illness_table', 1),
(39, '2024_01_01_000037_create_widow_aid_table', 1),
(40, '2024_01_01_000038_create_widow_maouna_table', 1),
(41, '2025_08_20_000001_remove_families_table_restructure', 1),
(42, '2025_08_25_132108_add_has_maouna_to_widow_files_table', 2),
(43, '2025_08_26_123720_create_orphans_education_level_table', 3),
(44, '2025_08_26_123806_modify_orphans_table_add_education_level_foreign_key', 3),
(45, '2025_08_28_233444_add_carryover_next_year_to_budgets_table', 4),
(46, '2025_08_28_233514_add_transferred_at_to_incomes_table', 4),
(47, '2025_08_29_200000_remove_fiscal_year_from_sub_budgets', 5),
(48, '2025_08_29_234353_add_default_categories_for_deleted_references', 6),
(49, '2025_08_30_001218_alter_incomes_table_remove_entry_month_rename_entry_date', 7);

-- --------------------------------------------------------

--
-- Table structure for table `orphans`
--

DROP TABLE IF EXISTS `orphans`;
CREATE TABLE IF NOT EXISTS `orphans` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `widow_id` bigint UNSIGNED NOT NULL,
  `first_name` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gender` enum('male','female') COLLATE utf8mb4_unicode_ci NOT NULL,
  `birth_date` date DEFAULT NULL,
  `education_level_id` bigint UNSIGNED DEFAULT NULL,
  `health_status` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `orphans_widow_id_foreign` (`widow_id`),
  KEY `orphans_education_level_id_foreign` (`education_level_id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `orphans`
--

INSERT INTO `orphans` (`id`, `widow_id`, `first_name`, `last_name`, `gender`, `birth_date`, `education_level_id`, `health_status`, `created_at`, `updated_at`) VALUES
(1, 1, 'محمد', 'الزهراء', 'male', '2010-03-15', 1, 'سليم', '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(2, 1, 'فاطمة', 'الزهراء', 'female', '2012-07-22', 1, 'سليمة', '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(3, 2, 'عائشة', 'النور', 'female', '2008-05-10', 8, 'سليمة', '2025-08-20 10:40:21', '2025-08-20 10:40:21'),
(4, 2, 'عمر', 'النور', 'male', '2011-09-18', 6, 'يعاني من ربو خفيف', '2025-08-20 10:40:21', '2025-08-20 10:40:21'),
(5, 2, 'زينب', 'النور', 'female', '2014-12-05', 11, 'سليمة', '2025-08-20 10:40:21', '2025-08-20 10:40:21'),
(6, 3, 'أحمد', 'السلام', 'male', '2015-08-30', 10, 'سليم', '2025-08-20 10:40:21', '2025-08-20 10:40:21'),
(12, 15, 'sdfdsf', 'dfdsf', 'male', '2018-07-31', 5, NULL, '2025-08-25 19:43:17', '2025-08-25 19:43:17'),
(17, 16, 'test', 'educ', 'male', '2020-08-03', NULL, NULL, '2025-08-26 11:57:19', '2025-08-26 11:57:19'),
(24, 17, 'sfdsf', 'sfsdf', 'male', '2022-08-01', NULL, NULL, '2025-08-26 12:36:39', '2025-08-26 12:36:39');

-- --------------------------------------------------------

--
-- Table structure for table `orphans_education_level`
--

DROP TABLE IF EXISTS `orphans_education_level`;
CREATE TABLE IF NOT EXISTS `orphans_education_level` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `name_ar` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_en` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `orphans_education_level`
--

INSERT INTO `orphans_education_level` (`id`, `name_ar`, `name_en`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'لم يلتحق بالمدرسة', 'Not Enrolled', 1, 1, '2025-08-26 11:38:35', '2025-08-28 16:25:38'),
(2, 'روضة أطفال', 'Kindergarten', 2, 1, '2025-08-26 11:38:35', '2025-08-28 16:25:38'),
(3, 'الصف الأول الابتدائي', 'First Grade', 3, 1, '2025-08-26 11:38:35', '2025-08-28 16:25:38'),
(4, 'الصف الثاني الابتدائي', 'Second Grade', 4, 1, '2025-08-26 11:38:35', '2025-08-28 16:25:38'),
(5, 'الصف الثالث الابتدائي', 'Third Grade', 5, 1, '2025-08-26 11:38:35', '2025-08-28 16:25:38'),
(6, 'الصف الرابع الابتدائي', 'Fourth Grade', 6, 1, '2025-08-26 11:38:35', '2025-08-28 16:25:38'),
(7, 'الصف الخامس الابتدائي', 'Fifth Grade', 7, 1, '2025-08-26 11:38:35', '2025-08-28 16:25:38'),
(8, 'الصف السادس الابتدائي', 'Sixth Grade', 8, 1, '2025-08-26 11:38:35', '2025-08-28 16:25:38'),
(9, 'الصف الأول الإعدادي', 'Seventh Grade', 9, 1, '2025-08-26 11:38:35', '2025-08-28 16:25:38'),
(10, 'الصف الثاني الإعدادي', 'Eighth Grade', 10, 1, '2025-08-26 11:38:35', '2025-08-28 16:25:38'),
(11, 'الصف الثالث الإعدادي', 'Ninth Grade', 11, 1, '2025-08-26 11:38:35', '2025-08-28 16:25:38'),
(12, 'الصف الأول الثانوي', 'Tenth Grade', 12, 1, '2025-08-26 11:38:35', '2025-08-28 16:25:38'),
(13, 'الصف الثاني الثانوي', 'Eleventh Grade', 13, 1, '2025-08-26 11:38:35', '2025-08-28 16:25:38'),
(14, 'الصف الثالث الثانوي', 'Twelfth Grade', 14, 1, '2025-08-26 11:38:35', '2025-08-28 16:25:38'),
(15, 'تخرج من الثانوية', 'High School Graduate', 15, 1, '2025-08-26 11:38:35', '2025-08-28 16:25:38'),
(16, 'جامعي', 'University', 16, 1, '2025-08-26 11:38:35', '2025-08-28 16:25:38'),
(17, 'تخرج من الجامعة', 'University Graduate', 17, 1, '2025-08-26 11:38:35', '2025-08-28 16:25:38');

-- --------------------------------------------------------

--
-- Table structure for table `partners`
--

DROP TABLE IF EXISTS `partners`;
CREATE TABLE IF NOT EXISTS `partners` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `field_id` bigint UNSIGNED DEFAULT NULL,
  `subfield_id` bigint UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `partners_name_unique` (`name`),
  KEY `partners_field_id_foreign` (`field_id`),
  KEY `partners_subfield_id_foreign` (`subfield_id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `partners`
--

INSERT INTO `partners` (`id`, `name`, `phone`, `email`, `address`, `field_id`, `subfield_id`, `created_at`, `updated_at`) VALUES
(1, 'شريك المعونة الأول', NULL, NULL, NULL, 1, 1, '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(2, 'شريك المعونة الثاني', NULL, NULL, NULL, 1, 1, '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(3, 'وزارة التنمية الاجتماعية', NULL, NULL, NULL, 1, 1, '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(5, 'جمعية خيرية محلية', NULL, NULL, NULL, 1, 1, '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(6, 'test partner', NULL, NULL, NULL, NULL, NULL, '2025-08-28 15:54:40', '2025-08-28 15:54:40'),
(7, 'partner new ref', NULL, NULL, NULL, 1, 2, '2025-08-28 16:05:41', '2025-08-28 16:41:07'),
(8, 'pharmacy 1', NULL, NULL, NULL, NULL, NULL, '2025-08-28 16:35:11', '2025-08-28 16:35:11'),
(9, 'new partner', NULL, NULL, NULL, 3, 3, '2025-08-28 16:44:45', '2025-08-28 16:44:45');

-- --------------------------------------------------------

--
-- Table structure for table `partner_fields`
--

DROP TABLE IF EXISTS `partner_fields`;
CREATE TABLE IF NOT EXISTS `partner_fields` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `label` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `partner_fields_label_unique` (`label`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `partner_fields`
--

INSERT INTO `partner_fields` (`id`, `label`, `created_at`, `updated_at`) VALUES
(1, 'health', '2025-08-20 10:40:20', '2025-08-28 16:34:15'),
(2, 'test 2', '2025-08-28 16:34:25', '2025-08-28 16:34:37'),
(3, 'new field', '2025-08-28 16:44:26', '2025-08-28 16:44:26');

-- --------------------------------------------------------

--
-- Table structure for table `partner_subfields`
--

DROP TABLE IF EXISTS `partner_subfields`;
CREATE TABLE IF NOT EXISTS `partner_subfields` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `field_id` bigint UNSIGNED NOT NULL,
  `label` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `partner_subfields_field_id_label_unique` (`field_id`,`label`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `partner_subfields`
--

INSERT INTO `partner_subfields` (`id`, `field_id`, `label`, `created_at`, `updated_at`) VALUES
(1, 2, 'معونات مالية', '2025-08-20 10:40:20', '2025-08-28 16:41:25'),
(2, 1, 'pharmacies', '2025-08-28 16:34:56', '2025-08-28 16:34:56'),
(3, 3, 'new subfield', '2025-08-28 16:44:35', '2025-08-28 16:44:35');

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
CREATE TABLE IF NOT EXISTS `sessions` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `skills`
--

DROP TABLE IF EXISTS `skills`;
CREATE TABLE IF NOT EXISTS `skills` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `label` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `skills_label_unique` (`label`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `skills`
--

INSERT INTO `skills` (`id`, `label`, `created_at`, `updated_at`) VALUES
(1, 'خياطة', '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(2, 'طبخ', '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(3, 'تنظيف', '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(4, 'تدريس', '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(5, 'أشغال يدوية', '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(6, 'حياكة', '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(7, 'تطريز', '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(8, 'حلاقة نسائية', '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(9, 'ماكياج', '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(10, 'حاسوب', '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(11, 'ddsds', '2025-08-25 11:30:11', '2025-08-25 11:30:11'),
(13, 'test skill', '2025-08-28 15:38:51', '2025-08-28 15:38:51'),
(15, 'edit skill', '2025-08-28 16:04:28', '2025-08-28 16:04:35');

-- --------------------------------------------------------

--
-- Table structure for table `sub_budgets`
--

DROP TABLE IF EXISTS `sub_budgets`;
CREATE TABLE IF NOT EXISTS `sub_budgets` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `label` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sub_budgets`
--

INSERT INTO `sub_budgets` (`id`, `label`, `created_at`, `updated_at`) VALUES
(1, 'الرعاية الصحية', '2025-08-29 19:56:42', '2025-08-29 19:56:42'),
(2, 'التعليم والتدريب', '2025-08-29 19:56:42', '2025-08-29 19:56:42'),
(3, 'النقل والمواصلات', '2025-08-29 19:56:42', '2025-08-29 19:56:42'),
(4, 'الإدارة العامة', '2025-08-29 19:56:42', '2025-08-29 19:56:42'),
(5, 'المساعدات الاجتماعية', '2025-08-29 19:56:42', '2025-08-29 19:56:42'),
(6, 'البرامج والفعاليات', '2025-08-29 19:56:42', '2025-08-29 19:56:42'),
(8, 'كفالة شاملة', '2025-08-30 15:29:30', '2025-08-30 15:29:30');

-- --------------------------------------------------------

--
-- Table structure for table `transfers`
--

DROP TABLE IF EXISTS `transfers`;
CREATE TABLE IF NOT EXISTS `transfers` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `fiscal_year_id` bigint UNSIGNED NOT NULL,
  `transfer_date` date NOT NULL,
  `from_account_id` bigint UNSIGNED NOT NULL,
  `to_account_id` bigint UNSIGNED NOT NULL,
  `amount` decimal(16,2) NOT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `status` enum('Draft','Approved') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Draft',
  `created_by` bigint UNSIGNED DEFAULT NULL,
  `approved_by` bigint UNSIGNED DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `transfers_fiscal_year_id_foreign` (`fiscal_year_id`),
  KEY `transfers_from_account_id_foreign` (`from_account_id`),
  KEY `transfers_to_account_id_foreign` (`to_account_id`),
  KEY `transfers_created_by_foreign` (`created_by`),
  KEY `transfers_approved_by_foreign` (`approved_by`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `transfers`
--

INSERT INTO `transfers` (`id`, `fiscal_year_id`, `transfer_date`, `from_account_id`, `to_account_id`, `amount`, `remarks`, `status`, `created_by`, `approved_by`, `approved_at`, `created_at`, `updated_at`) VALUES
(1, 2, '2024-01-15', 1, 2, 25000.00, 'تحويل لتغطية مصاريف الطوارئ - يناير', 'Approved', 2, 2, '2025-07-15 12:29:28', '2025-08-29 12:29:28', '2025-08-29 12:29:28'),
(2, 2, '2024-02-10', 2, 1, 10000.00, 'إعادة توزيع السيولة للحساب الرئيسي', 'Approved', 2, 2, '2025-07-22 12:29:28', '2025-08-29 12:29:28', '2025-08-29 12:29:28'),
(3, 2, '2024-03-05', 1, 2, 15000.00, 'تحويل لحساب التوفير - مارس', 'Approved', 2, 2, '2025-07-28 12:29:28', '2025-08-29 12:29:28', '2025-08-29 12:29:28'),
(4, 2, '2024-04-22', 1, 2, 30000.00, 'تحويل كبير لحساب الطوارئ', 'Approved', 2, 2, '2025-08-04 12:29:28', '2025-08-29 12:29:28', '2025-08-29 12:29:28'),
(5, 2, '2024-05-18', 2, 1, 20000.00, 'تحويل لتغطية المصاريف التشغيلية', 'Approved', 2, 2, '2025-08-11 12:29:28', '2025-08-29 12:29:28', '2025-08-29 12:29:28'),
(6, 2, '2024-06-12', 1, 2, 8000.00, 'تحويل صغير لضبط الأرصدة', 'Approved', 2, 2, '2025-08-17 12:29:28', '2025-08-29 12:29:28', '2025-08-29 12:29:28'),
(7, 2, '2024-07-08', 1, 2, 12000.00, 'تحويل في انتظار الموافقة - يوليو', 'Approved', 2, 1, '2025-08-29 12:35:47', '2025-08-29 12:29:28', '2025-08-29 12:35:47'),
(8, 2, '2024-08-15', 2, 1, 5000.00, 'تحويل صغير في انتظار الموافقة', 'Approved', 2, 1, '2025-08-29 12:35:11', '2025-08-29 12:29:28', '2025-08-29 12:35:11'),
(9, 2, '2024-06-25', 1, 2, 2500.00, 'تحويل مبلغ صغير للاختبار', 'Approved', 2, 2, '2025-08-19 12:29:28', '2025-08-29 12:29:28', '2025-08-29 12:29:28'),
(10, 2, '2024-07-30', 2, 1, 50000.00, 'تحويل مبلغ كبير للاختبار', 'Approved', 2, 2, '2025-08-26 12:29:28', '2025-08-29 12:29:28', '2025-08-29 12:29:28'),
(11, 2, '2024-01-15', 1, 2, 25000.00, 'تحويل لتغطية مصاريف الطوارئ - يناير', 'Approved', 2, 2, '2025-07-15 12:38:46', '2025-08-29 12:38:46', '2025-08-29 12:38:46'),
(12, 2, '2024-02-10', 2, 1, 10000.00, 'إعادة توزيع السيولة للحساب الرئيسي', 'Approved', 2, 2, '2025-07-22 12:38:46', '2025-08-29 12:38:46', '2025-08-29 12:38:46'),
(13, 2, '2024-03-05', 1, 2, 15000.00, 'تحويل لحساب التوفير - مارس', 'Approved', 2, 2, '2025-07-28 12:38:46', '2025-08-29 12:38:46', '2025-08-29 12:38:46'),
(14, 2, '2024-04-22', 1, 2, 30000.00, 'تحويل كبير لحساب الطوارئ', 'Approved', 2, 2, '2025-08-04 12:38:46', '2025-08-29 12:38:46', '2025-08-29 12:38:46'),
(15, 2, '2024-05-18', 2, 1, 20000.00, 'تحويل لتغطية المصاريف التشغيلية', 'Approved', 2, 2, '2025-08-11 12:38:46', '2025-08-29 12:38:47', '2025-08-29 12:38:47'),
(16, 2, '2024-06-12', 1, 2, 8000.00, 'تحويل صغير لضبط الأرصدة', 'Approved', 2, 2, '2025-08-17 12:38:46', '2025-08-29 12:38:47', '2025-08-29 12:38:47'),
(17, 2, '2024-07-08', 1, 2, 12000.00, 'تحويل في انتظار الموافقة - يوليو', 'Approved', 2, 1, '2025-08-29 12:40:27', '2025-08-29 12:38:47', '2025-08-29 12:40:27'),
(18, 2, '2024-08-15', 2, 1, 5000.00, 'تحويل صغير في انتظار الموافقة', 'Approved', 2, 1, '2025-08-29 12:39:52', '2025-08-29 12:38:47', '2025-08-29 12:39:52'),
(19, 2, '2024-06-25', 1, 2, 2500.00, 'تحويل مبلغ صغير للاختبار', 'Approved', 2, 2, '2025-08-19 12:38:46', '2025-08-29 12:38:47', '2025-08-29 12:38:47'),
(20, 2, '2024-07-30', 2, 1, 50000.00, 'تحويل مبلغ كبير للاختبار', 'Approved', 2, 2, '2025-08-26 12:38:46', '2025-08-29 12:38:47', '2025-08-29 12:38:47'),
(22, 2, '2024-11-06', 1, 2, 11000.00, 'approved new transfer', 'Approved', 1, 1, '2025-08-29 13:08:46', '2025-08-29 13:08:06', '2025-08-29 13:08:46'),
(26, 2, '2024-10-16', 1, 2, 55000.00, 'new remark', 'Approved', 1, 1, '2025-08-29 13:21:56', '2025-08-29 13:19:32', '2025-08-29 13:21:56'),
(28, 3, '2025-01-15', 1, 2, 25000.00, 'تحويل رأس المال للاستثمار', 'Approved', NULL, NULL, '2025-01-15 09:30:00', '2025-01-15 04:00:00', '2025-01-15 08:00:00'),
(29, 3, '2025-02-01', 2, 2, 15000.00, 'تمويل العمليات الشهرية', 'Approved', NULL, NULL, '2025-02-01 13:20:00', '2025-02-01 01:00:00', '2025-02-01 08:00:00'),
(30, 3, '2025-03-10', 1, 2, 8500.00, 'سداد مستحقات المورديين', 'Draft', NULL, NULL, NULL, '2025-03-10 01:00:00', '2025-03-10 09:00:00'),
(31, 3, '2025-03-20', 2, 1, 12000.00, 'إعادة تمويل الحساب الرئيسي', 'Approved', NULL, NULL, '2025-03-20 09:15:00', '2025-03-20 01:00:00', '2025-03-20 10:00:00'),
(32, 3, '2025-04-05', 2, 1, 30000.00, 'تحويل أرباح الاستثمار', 'Approved', NULL, NULL, '2025-04-05 16:45:00', '2025-04-05 03:00:00', '2025-04-05 09:00:00'),
(33, 3, '2025-05-12', 1, 2, 18000.00, 'استثمار في الأسهم', 'Draft', NULL, NULL, NULL, '2025-05-12 01:00:00', '2025-05-12 08:00:00'),
(34, 3, '2025-06-18', 2, 2, 7500.00, 'تسوية حسابات ربع السنة', 'Approved', NULL, NULL, '2025-06-18 10:30:00', '2025-06-18 01:00:00', '2025-06-18 07:00:00'),
(35, 3, '2025-07-25', 2, 2, 22000.00, 'تمويل مشروع جديد', 'Approved', NULL, NULL, '2025-07-25 12:20:00', '2025-07-25 00:00:00', '2025-07-25 07:00:00'),
(36, 3, '2025-08-10', 1, 2, 5000.00, 'مصاريف إدارية', 'Draft', NULL, NULL, NULL, '2025-08-10 00:00:00', '2025-08-10 05:00:00'),
(37, 3, '2025-08-28', 2, 1, 35000.00, 'إيرادات شهر أغسطس', 'Draft', NULL, NULL, NULL, '2025-08-28 01:00:00', '2025-08-28 07:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `email_verified_at`, `password`, `remember_token`, `created_at`, `updated_at`) VALUES
(1, 'Test User', 'test@example.com', '2025-08-20 10:40:20', '$2y$12$vh/CkRotEqxlACN/bKS2sOppH3xNcJt8bmLGL2zKGDnPdgVtyG.tm', 'JpdwtDsIC5', '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(2, 'Test Admin', 'admin@test.com', NULL, '$2y$12$2Jy/EOgs4U4UJ1gsja/6sevpvLiYzYJWfCKFIfYn9ZWKXAo9B6wf.', NULL, '2025-08-28 23:19:23', '2025-08-28 23:19:23');

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_current_cash`
-- (See below for the actual view)
--
DROP VIEW IF EXISTS `v_current_cash`;
CREATE TABLE IF NOT EXISTS `v_current_cash` (
`current_cash` decimal(38,2)
);

-- --------------------------------------------------------

--
-- Table structure for table `widows`
--

DROP TABLE IF EXISTS `widows`;
CREATE TABLE IF NOT EXISTS `widows` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `first_name` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `neighborhood` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `admission_date` date DEFAULT NULL,
  `national_id` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `marital_status` enum('Single','Widowed','Remarried','Divorced') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Widowed',
  `education_level` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `disability_flag` tinyint(1) NOT NULL DEFAULT '0',
  `disability_type` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `widows`
--

INSERT INTO `widows` (`id`, `first_name`, `last_name`, `phone`, `email`, `address`, `neighborhood`, `admission_date`, `national_id`, `birth_date`, `marital_status`, `education_level`, `disability_flag`, `disability_type`, `created_at`, `updated_at`) VALUES
(1, 'خديجة', 'الزهراء', '0599111222', 'khadija.zahra@example.com', 'شارع الكرامة، حي الزهراء', 'حي الزهراء', '2024-01-15', 'W001234567', '1975-08-12', 'Widowed', 'ثانوي', 1, 'إعاقة حركية في الساق اليمنى', '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(2, 'أمينة', 'النور', '0599333444', 'amina.noor@example.com', 'شارع الجلاء، حي النور', 'حي النور', '2024-03-10', 'W002345678', '1982-11-28', 'Widowed', 'جامعية', 1, 'rsfgsg', '2025-08-20 10:40:21', '2025-08-20 10:43:54'),
(3, 'مريم', 'السلام', '0599555666', NULL, 'شارع المجد، حي السلام', 'حي السلام', '2024-06-20', 'W003456789', '1978-02-14', 'Widowed', 'ابتدائي', 0, NULL, '2025-08-20 10:40:21', '2025-08-20 10:40:21'),
(13, 'daasdd', 'asdsad', '2423432', 'dfdaf@dfdsf.fsdfdsf', 'sf fdfdf', 'dsffsddf', '2025-08-04', 'sd32323', '2003-08-12', 'Widowed', 'ثانوي', 0, NULL, '2025-08-25 12:44:22', '2025-08-25 12:44:22'),
(15, 'dfdsfdsfs', 'test', '43243243243', 'adfdaf@dfafds.sdffsdf', 'fsgsfdfsd', 'sddf', '2025-07-28', 'd434324', '2000-08-02', 'Widowed', 'ثانوي', 0, NULL, '2025-08-25 12:58:04', '2025-08-25 19:36:56'),
(16, 'education', 'test', '65365656', 'sfdgfsg@fdgfg.fsdgfds', 'fsfsd fdsfrdsw', 'dfddf', '2025-07-28', 'f445545', '1990-08-07', 'Widowed', 'ثانوي', 0, NULL, '2025-08-26 11:49:31', '2025-08-26 11:49:31'),
(17, 'dfsfesd', 'testsss', '435435435', 'fsgfsg@dsfggss.sdfdsf', 'dsfsdfsdfsdsdf sdfsdf', 'dsfdsfdsfsdfsf', '2025-07-28', 'f434324', '2002-07-31', 'Widowed', 'دبلوم', 0, NULL, '2025-08-26 11:58:23', '2025-08-26 11:58:23'),
(18, 'maouna', 'test new', '45544354354543', 'dssdfdsf@fgs.sfdgsdf', 'dfs sdf f dssfsdsdf', 'dsdfsdsfsdfdsf', '2025-08-03', 'd434344', '1999-08-02', 'Widowed', 'دبلوم', 0, NULL, '2025-08-28 21:38:07', '2025-08-28 21:38:07');

-- --------------------------------------------------------

--
-- Table structure for table `widow_aid`
--

DROP TABLE IF EXISTS `widow_aid`;
CREATE TABLE IF NOT EXISTS `widow_aid` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `widow_id` bigint UNSIGNED NOT NULL,
  `aid_type_id` bigint UNSIGNED NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `widow_aid_widow_id_aid_type_id_unique` (`widow_id`,`aid_type_id`),
  KEY `widow_aid_aid_type_id_foreign` (`aid_type_id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `widow_aid`
--

INSERT INTO `widow_aid` (`id`, `widow_id`, `aid_type_id`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 1, NULL, NULL),
(2, 1, 2, 1, NULL, NULL),
(3, 1, 5, 1, NULL, NULL),
(4, 2, 3, 1, NULL, NULL),
(5, 2, 5, 1, NULL, NULL),
(6, 3, 1, 1, NULL, NULL),
(7, 3, 2, 1, NULL, NULL),
(8, 3, 5, 1, NULL, NULL),
(9, 3, 6, 1, NULL, NULL),
(14, 15, 7, 1, NULL, NULL),
(15, 15, 1, 1, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `widow_expense_categories`
--

DROP TABLE IF EXISTS `widow_expense_categories`;
CREATE TABLE IF NOT EXISTS `widow_expense_categories` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `widow_expense_categories`
--

INSERT INTO `widow_expense_categories` (`id`, `name`, `created_at`, `updated_at`) VALUES
(1, 'إيجار', '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(2, 'طعام', '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(3, 'دواء', '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(4, 'تعليم', '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(5, 'فواتير', '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(6, 'مواصلات', '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(7, 'ملابس', '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(8, 'مستلزمات منزلية', '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(9, 'رعاية صحية', '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(10, 'sswere', '2025-08-25 11:34:37', '2025-08-25 11:34:37');

-- --------------------------------------------------------

--
-- Table structure for table `widow_files`
--

DROP TABLE IF EXISTS `widow_files`;
CREATE TABLE IF NOT EXISTS `widow_files` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `widow_id` bigint UNSIGNED NOT NULL,
  `social_situation` enum('single','widow','divorced','remarried') COLLATE utf8mb4_unicode_ci NOT NULL,
  `has_chronic_disease` tinyint(1) NOT NULL DEFAULT '0',
  `has_maouna` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `widow_files_widow_id_foreign` (`widow_id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `widow_files`
--

INSERT INTO `widow_files` (`id`, `widow_id`, `social_situation`, `has_chronic_disease`, `has_maouna`, `created_at`, `updated_at`) VALUES
(1, 1, 'widow', 1, 0, '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(2, 2, 'widow', 0, 0, '2025-08-20 10:40:21', '2025-08-20 10:40:21'),
(3, 3, 'widow', 1, 0, '2025-08-20 10:40:21', '2025-08-20 10:40:21'),
(13, 13, 'widow', 0, 0, '2025-08-25 12:44:22', '2025-08-25 12:44:22'),
(15, 15, 'widow', 1, 1, '2025-08-25 12:58:04', '2025-08-25 12:58:04'),
(16, 16, 'widow', 0, 0, '2025-08-26 11:49:31', '2025-08-26 11:49:31'),
(17, 17, 'widow', 0, 0, '2025-08-26 11:58:23', '2025-08-26 11:58:23'),
(18, 18, 'widow', 0, 1, '2025-08-28 21:38:07', '2025-08-28 21:38:07');

-- --------------------------------------------------------

--
-- Table structure for table `widow_illness`
--

DROP TABLE IF EXISTS `widow_illness`;
CREATE TABLE IF NOT EXISTS `widow_illness` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `widow_id` bigint UNSIGNED NOT NULL,
  `illness_id` bigint UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `widow_illness_widow_id_illness_id_unique` (`widow_id`,`illness_id`),
  KEY `widow_illness_illness_id_foreign` (`illness_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `widow_illness`
--

INSERT INTO `widow_illness` (`id`, `widow_id`, `illness_id`, `created_at`, `updated_at`) VALUES
(1, 1, 1, NULL, NULL),
(2, 1, 2, NULL, NULL),
(3, 3, 6, NULL, NULL),
(4, 3, 3, NULL, NULL),
(12, 15, 5, NULL, NULL),
(13, 15, 1, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `widow_income_categories`
--

DROP TABLE IF EXISTS `widow_income_categories`;
CREATE TABLE IF NOT EXISTS `widow_income_categories` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `widow_income_categories`
--

INSERT INTO `widow_income_categories` (`id`, `name`, `created_at`, `updated_at`) VALUES
(1, 'راتب', '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(2, 'معاش', '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(3, 'مساعدة', '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(4, 'تجارة', '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(5, 'عمل حر', '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(6, 'تبرعات', '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(7, 'إيجار عقار', '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(8, 'حرفة', '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(9, 'fggfg', '2025-08-25 11:34:37', '2025-08-25 11:34:37'),
(10, 'madkhoul1', '2025-08-25 11:45:53', '2025-08-25 11:45:53');

-- --------------------------------------------------------

--
-- Table structure for table `widow_maouna`
--

DROP TABLE IF EXISTS `widow_maouna`;
CREATE TABLE IF NOT EXISTS `widow_maouna` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `widow_id` bigint UNSIGNED NOT NULL,
  `partner_id` bigint UNSIGNED NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `widow_maouna_widow_id_foreign` (`widow_id`),
  KEY `widow_maouna_partner_id_foreign` (`partner_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `widow_maouna`
--

INSERT INTO `widow_maouna` (`id`, `widow_id`, `partner_id`, `amount`, `is_active`, `created_at`, `updated_at`) VALUES
(8, 15, 3, 400.00, 1, '2025-08-25 19:43:17', '2025-08-25 19:43:17'),
(12, 18, 7, 400.00, 1, '2025-08-28 21:46:36', '2025-08-28 21:46:36');

-- --------------------------------------------------------

--
-- Table structure for table `widow_skill`
--

DROP TABLE IF EXISTS `widow_skill`;
CREATE TABLE IF NOT EXISTS `widow_skill` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `widow_id` bigint UNSIGNED NOT NULL,
  `skill_id` bigint UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `widow_skill_widow_id_skill_id_unique` (`widow_id`,`skill_id`),
  KEY `widow_skill_skill_id_foreign` (`skill_id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `widow_skill`
--

INSERT INTO `widow_skill` (`id`, `widow_id`, `skill_id`, `created_at`, `updated_at`) VALUES
(1, 1, 7, NULL, NULL),
(2, 1, 1, NULL, NULL),
(3, 1, 2, NULL, NULL),
(4, 2, 4, NULL, NULL),
(5, 2, 10, NULL, NULL),
(6, 2, 2, NULL, NULL),
(7, 3, 5, NULL, NULL),
(8, 3, 3, NULL, NULL),
(15, 15, 5, NULL, NULL),
(16, 15, 7, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `widow_social`
--

DROP TABLE IF EXISTS `widow_social`;
CREATE TABLE IF NOT EXISTS `widow_social` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `widow_id` bigint UNSIGNED NOT NULL,
  `housing_type_id` bigint UNSIGNED NOT NULL,
  `housing_status` enum('owned','rented','free') COLLATE utf8mb4_unicode_ci NOT NULL,
  `has_water` tinyint(1) NOT NULL DEFAULT '0',
  `has_electricity` tinyint(1) NOT NULL DEFAULT '0',
  `has_furniture` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `widow_social_widow_id_foreign` (`widow_id`),
  KEY `widow_social_housing_type_id_foreign` (`housing_type_id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `widow_social`
--

INSERT INTO `widow_social` (`id`, `widow_id`, `housing_type_id`, `housing_status`, `has_water`, `has_electricity`, `has_furniture`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'rented', 1, 1, 3, '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(2, 2, 2, 'owned', 1, 1, 4, '2025-08-20 10:40:21', '2025-08-20 10:40:21'),
(3, 3, 3, 'free', 0, 1, 1, '2025-08-20 10:40:21', '2025-08-20 10:40:21'),
(13, 13, 1, 'rented', 1, 1, 0, '2025-08-25 12:44:22', '2025-08-25 12:44:22'),
(15, 15, 3, 'rented', 1, 1, 3, '2025-08-25 12:58:04', '2025-08-25 19:43:17'),
(16, 16, 1, 'rented', 1, 1, 0, '2025-08-26 11:49:31', '2025-08-26 11:49:31'),
(17, 17, 1, 'rented', 1, 1, 0, '2025-08-26 11:58:23', '2025-08-26 11:58:23'),
(18, 18, 1, 'rented', 1, 1, 4, '2025-08-28 21:38:07', '2025-08-28 21:46:36');

-- --------------------------------------------------------

--
-- Table structure for table `widow_social_expense`
--

DROP TABLE IF EXISTS `widow_social_expense`;
CREATE TABLE IF NOT EXISTS `widow_social_expense` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `widow_id` bigint UNSIGNED NOT NULL,
  `expense_category_id` bigint UNSIGNED NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `widow_social_expense_widow_id_foreign` (`widow_id`),
  KEY `widow_social_expense_expense_category_id_foreign` (`expense_category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `widow_social_expense`
--

INSERT INTO `widow_social_expense` (`id`, `widow_id`, `expense_category_id`, `amount`, `remarks`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 400.00, 'إيجار شهري', '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(2, 1, 2, 250.00, 'مصاريف طعام شهرية', '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(3, 1, 3, 150.00, 'أدوية للمرض المزمن', '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(4, 2, 2, 350.00, 'مصاريف طعام للعائلة', '2025-08-20 10:40:21', '2025-08-20 10:40:21'),
(5, 2, 4, 200.00, 'رسوم مدرسية وقرطاسية', '2025-08-20 10:40:21', '2025-08-20 10:40:21'),
(6, 2, 5, 180.00, 'كهرباء وماء', '2025-08-20 10:40:21', '2025-08-20 10:40:21'),
(7, 3, 2, 200.00, 'مصاريف طعام أساسية', '2025-08-20 10:40:21', '2025-08-20 10:40:21'),
(8, 3, 3, 100.00, 'أدوية للقلب', '2025-08-20 10:40:21', '2025-08-20 10:40:21'),
(9, 3, 6, 50.00, 'مواصلات للمستشفى', '2025-08-20 10:40:21', '2025-08-20 10:40:21'),
(17, 15, 1, 500.00, 'fdsfdsf', '2025-08-25 19:43:17', '2025-08-25 19:43:17'),
(18, 18, 9, 400.00, NULL, '2025-08-28 21:46:36', '2025-08-28 21:46:36');

-- --------------------------------------------------------

--
-- Table structure for table `widow_social_income`
--

DROP TABLE IF EXISTS `widow_social_income`;
CREATE TABLE IF NOT EXISTS `widow_social_income` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `widow_id` bigint UNSIGNED NOT NULL,
  `income_category_id` bigint UNSIGNED NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `widow_social_income_widow_id_foreign` (`widow_id`),
  KEY `widow_social_income_income_category_id_foreign` (`income_category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `widow_social_income`
--

INSERT INTO `widow_social_income` (`id`, `widow_id`, `income_category_id`, `amount`, `remarks`, `created_at`, `updated_at`) VALUES
(1, 1, 2, 800.00, 'معاش الضمان الاجتماعي', '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(2, 1, 5, 300.00, 'خياطة في المنزل', '2025-08-20 10:40:20', '2025-08-20 10:40:20'),
(3, 2, 5, 1200.00, 'دروس خصوصية', '2025-08-20 10:40:21', '2025-08-20 10:40:21'),
(4, 2, 6, 200.00, 'تبرعات من الأقارب', '2025-08-20 10:40:21', '2025-08-20 10:40:21'),
(5, 3, 3, 600.00, 'مساعدة من الجمعيات الخيرية', '2025-08-20 10:40:21', '2025-08-20 10:40:21'),
(13, 15, 2, 400.00, 'dfsdf', '2025-08-25 19:43:17', '2025-08-25 19:43:17'),
(14, 18, 4, 500.00, NULL, '2025-08-28 21:46:36', '2025-08-28 21:46:36');

-- --------------------------------------------------------

--
-- Structure for view `v_current_cash`
--
DROP TABLE IF EXISTS `v_current_cash`;

DROP VIEW IF EXISTS `v_current_cash`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_current_cash`  AS SELECT ifnull(sum(`bank_accounts`.`balance`),0.00) AS `current_cash` FROM `bank_accounts` ;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `beneficiary_group_members`
--
ALTER TABLE `beneficiary_group_members`
  ADD CONSTRAINT `beneficiary_group_members_group_id_foreign` FOREIGN KEY (`group_id`) REFERENCES `beneficiary_groups` (`id`);

--
-- Constraints for table `expenses`
--
ALTER TABLE `expenses`
  ADD CONSTRAINT `expenses_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `expenses_bank_account_id_foreign` FOREIGN KEY (`bank_account_id`) REFERENCES `bank_accounts` (`id`),
  ADD CONSTRAINT `expenses_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `expenses_expense_category_id_foreign` FOREIGN KEY (`expense_category_id`) REFERENCES `expense_categories` (`id`),
  ADD CONSTRAINT `expenses_fiscal_year_id_foreign` FOREIGN KEY (`fiscal_year_id`) REFERENCES `fiscal_years` (`id`),
  ADD CONSTRAINT `expenses_partner_id_foreign` FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`),
  ADD CONSTRAINT `expenses_sub_budget_id_foreign` FOREIGN KEY (`sub_budget_id`) REFERENCES `sub_budgets` (`id`);

--
-- Constraints for table `expense_beneficiaries`
--
ALTER TABLE `expense_beneficiaries`
  ADD CONSTRAINT `expense_beneficiaries_expense_id_foreign` FOREIGN KEY (`expense_id`) REFERENCES `expenses` (`id`);

--
-- Constraints for table `expense_beneficiary_groups`
--
ALTER TABLE `expense_beneficiary_groups`
  ADD CONSTRAINT `expense_beneficiary_groups_expense_id_foreign` FOREIGN KEY (`expense_id`) REFERENCES `expenses` (`id`),
  ADD CONSTRAINT `expense_beneficiary_groups_group_id_foreign` FOREIGN KEY (`group_id`) REFERENCES `beneficiary_groups` (`id`);

--
-- Constraints for table `expense_categories`
--
ALTER TABLE `expense_categories`
  ADD CONSTRAINT `expense_categories_sub_budget_id_foreign` FOREIGN KEY (`sub_budget_id`) REFERENCES `sub_budgets` (`id`);

--
-- Constraints for table `incomes`
--
ALTER TABLE `incomes`
  ADD CONSTRAINT `incomes_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `incomes_bank_account_id_foreign` FOREIGN KEY (`bank_account_id`) REFERENCES `bank_accounts` (`id`),
  ADD CONSTRAINT `incomes_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `incomes_donor_id_foreign` FOREIGN KEY (`donor_id`) REFERENCES `donors` (`id`),
  ADD CONSTRAINT `incomes_fiscal_year_id_foreign` FOREIGN KEY (`fiscal_year_id`) REFERENCES `fiscal_years` (`id`),
  ADD CONSTRAINT `incomes_income_category_id_foreign` FOREIGN KEY (`income_category_id`) REFERENCES `income_categories` (`id`),
  ADD CONSTRAINT `incomes_kafil_id_foreign` FOREIGN KEY (`kafil_id`) REFERENCES `kafils` (`id`),
  ADD CONSTRAINT `incomes_sub_budget_id_foreign` FOREIGN KEY (`sub_budget_id`) REFERENCES `sub_budgets` (`id`);

--
-- Constraints for table `income_categories`
--
ALTER TABLE `income_categories`
  ADD CONSTRAINT `income_categories_sub_budget_id_foreign` FOREIGN KEY (`sub_budget_id`) REFERENCES `sub_budgets` (`id`);

--
-- Constraints for table `kafils`
--
ALTER TABLE `kafils`
  ADD CONSTRAINT `kafils_donor_id_foreign` FOREIGN KEY (`donor_id`) REFERENCES `donors` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `kafil_sponsorship`
--
ALTER TABLE `kafil_sponsorship`
  ADD CONSTRAINT `kafil_sponsorship_kafil_id_foreign` FOREIGN KEY (`kafil_id`) REFERENCES `kafils` (`id`),
  ADD CONSTRAINT `kafil_sponsorship_widow_id_foreign` FOREIGN KEY (`widow_id`) REFERENCES `widows` (`id`);

--
-- Constraints for table `orphans`
--
ALTER TABLE `orphans`
  ADD CONSTRAINT `orphans_education_level_id_foreign` FOREIGN KEY (`education_level_id`) REFERENCES `orphans_education_level` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `orphans_widow_id_foreign` FOREIGN KEY (`widow_id`) REFERENCES `widows` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `partners`
--
ALTER TABLE `partners`
  ADD CONSTRAINT `partners_field_id_foreign` FOREIGN KEY (`field_id`) REFERENCES `partner_fields` (`id`),
  ADD CONSTRAINT `partners_subfield_id_foreign` FOREIGN KEY (`subfield_id`) REFERENCES `partner_subfields` (`id`);

--
-- Constraints for table `partner_subfields`
--
ALTER TABLE `partner_subfields`
  ADD CONSTRAINT `partner_subfields_field_id_foreign` FOREIGN KEY (`field_id`) REFERENCES `partner_fields` (`id`);

--
-- Constraints for table `transfers`
--
ALTER TABLE `transfers`
  ADD CONSTRAINT `transfers_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `transfers_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `transfers_fiscal_year_id_foreign` FOREIGN KEY (`fiscal_year_id`) REFERENCES `fiscal_years` (`id`),
  ADD CONSTRAINT `transfers_from_account_id_foreign` FOREIGN KEY (`from_account_id`) REFERENCES `bank_accounts` (`id`),
  ADD CONSTRAINT `transfers_to_account_id_foreign` FOREIGN KEY (`to_account_id`) REFERENCES `bank_accounts` (`id`);

--
-- Constraints for table `widow_aid`
--
ALTER TABLE `widow_aid`
  ADD CONSTRAINT `widow_aid_aid_type_id_foreign` FOREIGN KEY (`aid_type_id`) REFERENCES `aid_types` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `widow_aid_widow_id_foreign` FOREIGN KEY (`widow_id`) REFERENCES `widows` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `widow_files`
--
ALTER TABLE `widow_files`
  ADD CONSTRAINT `widow_files_widow_id_foreign` FOREIGN KEY (`widow_id`) REFERENCES `widows` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `widow_illness`
--
ALTER TABLE `widow_illness`
  ADD CONSTRAINT `widow_illness_illness_id_foreign` FOREIGN KEY (`illness_id`) REFERENCES `illnesses` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `widow_illness_widow_id_foreign` FOREIGN KEY (`widow_id`) REFERENCES `widows` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `widow_maouna`
--
ALTER TABLE `widow_maouna`
  ADD CONSTRAINT `widow_maouna_partner_id_foreign` FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `widow_maouna_widow_id_foreign` FOREIGN KEY (`widow_id`) REFERENCES `widows` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `widow_skill`
--
ALTER TABLE `widow_skill`
  ADD CONSTRAINT `widow_skill_skill_id_foreign` FOREIGN KEY (`skill_id`) REFERENCES `skills` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `widow_skill_widow_id_foreign` FOREIGN KEY (`widow_id`) REFERENCES `widows` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `widow_social`
--
ALTER TABLE `widow_social`
  ADD CONSTRAINT `widow_social_housing_type_id_foreign` FOREIGN KEY (`housing_type_id`) REFERENCES `housing_types` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `widow_social_widow_id_foreign` FOREIGN KEY (`widow_id`) REFERENCES `widows` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `widow_social_expense`
--
ALTER TABLE `widow_social_expense`
  ADD CONSTRAINT `widow_social_expense_expense_category_id_foreign` FOREIGN KEY (`expense_category_id`) REFERENCES `widow_expense_categories` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `widow_social_expense_widow_id_foreign` FOREIGN KEY (`widow_id`) REFERENCES `widows` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `widow_social_income`
--
ALTER TABLE `widow_social_income`
  ADD CONSTRAINT `widow_social_income_income_category_id_foreign` FOREIGN KEY (`income_category_id`) REFERENCES `widow_income_categories` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `widow_social_income_widow_id_foreign` FOREIGN KEY (`widow_id`) REFERENCES `widows` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
