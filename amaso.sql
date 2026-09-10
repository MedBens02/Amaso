-- AMASO - قاعدة بيانات تجريبية / Demo database
-- جمعية المنصور لكفالة اليتيم
--
-- Generated: 2026-09-10
-- Charset:   utf8mb4 / utf8mb4_unicode_ci
--
-- ماذا يحتوي هذا الملف / What this file contains
--   Schema for all 52 tables and the v_current_cash view, plus reference
--   data (categories,
--   budgets, aid types, education levels, kafala chamila split rules) and a
--   full set of FICTIONAL demo records: 26 families, 53 orphans, 18 donors,
--   8 sponsors, three fiscal years of income and expenses, three academic
--   years of school enrollments and grades.
--
--   Every name, national ID, phone number and amount in here is invented.
--   There is no real beneficiary data in this file.
--
-- كيفية الاستيراد / How to import
--   phpMyAdmin : create an empty database (utf8mb4_unicode_ci), select it,
--                then Import > choose this file > Go.
--   Command line:
--                mysql -u root -p amaso < amaso.sql
--
--   The file drops and recreates each table, so importing it twice is safe -
--   it always ends with exactly this data. Anything already in those tables
--   is lost, so do not run it against a database holding real records.
--
-- بديل / Alternative
--   The same data can be built from the code instead, which is preferable
--   during development because it always matches the current migrations:
--       php artisan migrate:fresh
--       php artisan db:seed
--       php artisan db:seed --class=DemoDataSeeder
--
-- حسابات الدخول / Login accounts (password for all three: password)
--   admin@amaso.org       مدير            admin
--   accountant@amaso.org  محاسب           accountant
--   social@amaso.org      أخصائي اجتماعي  social_worker
--
--   Change these before the application is used for anything real.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";

/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `academic_years`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `academic_years` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `start_year` smallint unsigned NOT NULL,
  `label` varchar(9) NOT NULL,
  `is_current` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `academic_years_start_year_unique` (`start_year`),
  UNIQUE KEY `academic_years_label_unique` (`label`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `academic_years` DISABLE KEYS */;
INSERT INTO `academic_years` (`id`, `start_year`, `label`, `is_current`, `created_at`, `updated_at`) VALUES (1,2026,'2026/2027',1,'2026-09-10 19:26:10','2026-09-10 19:26:10'),
(2,2024,'2024/2025',0,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(3,2025,'2025/2026',0,'2026-09-10 19:26:11','2026-09-10 19:26:11');
/*!40000 ALTER TABLE `academic_years` ENABLE KEYS */;
DROP TABLE IF EXISTS `aid_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `aid_types` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `label` varchar(120) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `aid_types_label_unique` (`label`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `aid_types` DISABLE KEYS */;
INSERT INTO `aid_types` (`id`, `label`, `created_at`, `updated_at`) VALUES (1,'مساعدة شهرية','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(2,'مساعدة طبية','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(3,'مساعدة تعليمية','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(4,'مساعدة طارئة','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(5,'مساعدة غذائية','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(6,'مساعدة كسوة','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(7,'مساعدة إيجار','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(8,'مساعدة فواتير','2026-09-10 19:26:10','2026-09-10 19:26:10');
/*!40000 ALTER TABLE `aid_types` ENABLE KEYS */;
DROP TABLE IF EXISTS `bank_account_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `bank_account_transactions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `bank_account_id` bigint unsigned NOT NULL,
  `source_type` varchar(30) NOT NULL,
  `source_id` bigint unsigned DEFAULT NULL,
  `amount` decimal(16,2) NOT NULL,
  `balance_after` decimal(16,2) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `bank_account_transactions_created_by_foreign` (`created_by`),
  KEY `bank_account_transactions_bank_account_id_id_index` (`bank_account_id`,`id`),
  KEY `bank_account_transactions_source_type_source_id_index` (`source_type`,`source_id`),
  CONSTRAINT `bank_account_transactions_bank_account_id_foreign` FOREIGN KEY (`bank_account_id`) REFERENCES `bank_accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `bank_account_transactions_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `bank_account_transactions` DISABLE KEYS */;
INSERT INTO `bank_account_transactions` (`id`, `bank_account_id`, `source_type`, `source_id`, `amount`, `balance_after`, `description`, `created_by`, `created_at`, `updated_at`) VALUES (1,2,'income',24,400.00,20400.00,'اعتماد إيراد بحوالة بنكية',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(2,2,'income',25,400.00,20800.00,'اعتماد إيراد بحوالة بنكية',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(3,1,'expense',10,-1500.00,48500.00,'اعتماد مصروف',NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(4,1,'transfer_out',1,-6000.00,42500.00,'تحويل إلى حساب \"حساب الكفالات\"',NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(5,2,'transfer_in',1,6000.00,26800.00,'تحويل من حساب \"الحساب الرئيسي\"',NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12');
/*!40000 ALTER TABLE `bank_account_transactions` ENABLE KEYS */;
DROP TABLE IF EXISTS `bank_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `bank_accounts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `label` varchar(120) DEFAULT NULL,
  `bank_name` varchar(120) DEFAULT NULL,
  `account_number` varchar(60) DEFAULT NULL,
  `balance` decimal(16,2) NOT NULL DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `bank_accounts_label_unique` (`label`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `bank_accounts` DISABLE KEYS */;
INSERT INTO `bank_accounts` (`id`, `label`, `bank_name`, `account_number`, `balance`, `notes`, `created_at`, `updated_at`) VALUES (1,'الحساب الرئيسي','بنك التجارة','MA-1001',42500.00,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:12'),
(2,'حساب الكفالات','بنك الوفاء','MA-1002',26800.00,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:12');
/*!40000 ALTER TABLE `bank_accounts` ENABLE KEYS */;
DROP TABLE IF EXISTS `beneficiaries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `beneficiaries` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `type` enum('Widow','Orphan') NOT NULL,
  `widow_id` bigint unsigned DEFAULT NULL,
  `orphan_id` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_widow` (`widow_id`),
  UNIQUE KEY `uniq_orphan` (`orphan_id`),
  CONSTRAINT `fk_benef_orphan` FOREIGN KEY (`orphan_id`) REFERENCES `orphans` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_benef_widow` FOREIGN KEY (`widow_id`) REFERENCES `widows` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=80 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `beneficiaries` DISABLE KEYS */;
INSERT INTO `beneficiaries` (`id`, `type`, `widow_id`, `orphan_id`, `created_at`, `updated_at`) VALUES (1,'Widow',1,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(2,'Orphan',NULL,1,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(3,'Orphan',NULL,2,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(4,'Widow',2,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(5,'Orphan',NULL,3,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(6,'Orphan',NULL,4,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(7,'Orphan',NULL,5,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(8,'Widow',3,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(9,'Orphan',NULL,6,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(10,'Widow',4,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(11,'Orphan',NULL,7,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(12,'Orphan',NULL,8,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(13,'Widow',5,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(14,'Orphan',NULL,9,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(15,'Widow',6,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(16,'Orphan',NULL,10,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(17,'Orphan',NULL,11,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(18,'Orphan',NULL,12,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(19,'Widow',7,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(20,'Orphan',NULL,13,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(21,'Orphan',NULL,14,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(22,'Widow',8,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(23,'Orphan',NULL,15,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(24,'Widow',9,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(25,'Orphan',NULL,16,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(26,'Orphan',NULL,17,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(27,'Widow',10,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(28,'Orphan',NULL,18,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(29,'Widow',11,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(30,'Orphan',NULL,19,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(31,'Orphan',NULL,20,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(32,'Widow',12,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(33,'Orphan',NULL,21,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(34,'Orphan',NULL,22,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(35,'Orphan',NULL,23,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(36,'Orphan',NULL,24,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(37,'Widow',13,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(38,'Orphan',NULL,25,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(39,'Orphan',NULL,26,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(40,'Widow',14,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(41,'Orphan',NULL,27,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(42,'Orphan',NULL,28,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(43,'Orphan',NULL,29,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(44,'Widow',15,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(45,'Orphan',NULL,30,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(46,'Widow',16,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(47,'Orphan',NULL,31,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(48,'Orphan',NULL,32,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(49,'Widow',17,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(50,'Orphan',NULL,33,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(51,'Orphan',NULL,34,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(52,'Orphan',NULL,35,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(53,'Widow',18,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(54,'Orphan',NULL,36,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(55,'Orphan',NULL,37,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(56,'Widow',19,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(57,'Orphan',NULL,38,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(58,'Widow',20,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(59,'Orphan',NULL,39,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(60,'Orphan',NULL,40,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(61,'Orphan',NULL,41,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(62,'Widow',21,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(63,'Orphan',NULL,42,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(64,'Orphan',NULL,43,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(65,'Widow',22,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(66,'Orphan',NULL,44,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(67,'Orphan',NULL,45,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(68,'Orphan',NULL,46,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(69,'Orphan',NULL,47,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(70,'Widow',23,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(71,'Orphan',NULL,48,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(72,'Widow',24,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(73,'Orphan',NULL,49,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(74,'Orphan',NULL,50,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(75,'Widow',25,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(76,'Orphan',NULL,51,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(77,'Orphan',NULL,52,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(78,'Orphan',NULL,53,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(79,'Widow',26,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11');
/*!40000 ALTER TABLE `beneficiaries` ENABLE KEYS */;
DROP TABLE IF EXISTS `beneficiary_group_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `beneficiary_group_members` (
  `group_id` bigint unsigned NOT NULL,
  `beneficiary_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`group_id`,`beneficiary_id`),
  KEY `idx_bgm_beneficiary_id` (`beneficiary_id`),
  CONSTRAINT `beneficiary_group_members_group_id_foreign` FOREIGN KEY (`group_id`) REFERENCES `beneficiary_groups` (`id`),
  CONSTRAINT `fk_bgm_beneficiaries` FOREIGN KEY (`beneficiary_id`) REFERENCES `beneficiaries` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `beneficiary_group_members` DISABLE KEYS */;
INSERT INTO `beneficiary_group_members` (`group_id`, `beneficiary_id`, `created_at`, `updated_at`) VALUES (1,1,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(1,4,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(1,8,'2026-09-10 19:26:12','2026-09-10 19:26:12');
/*!40000 ALTER TABLE `beneficiary_group_members` ENABLE KEYS */;
DROP TABLE IF EXISTS `beneficiary_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `beneficiary_groups` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `label` varchar(120) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `beneficiary_groups_label_unique` (`label`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `beneficiary_groups` DISABLE KEYS */;
INSERT INTO `beneficiary_groups` (`id`, `label`, `description`, `created_at`, `updated_at`) VALUES (1,'مجموعة حي السلام','الأسر المستفيدة في حي السلام','2026-09-10 19:26:12','2026-09-10 19:26:12');
/*!40000 ALTER TABLE `beneficiary_groups` ENABLE KEYS */;
DROP TABLE IF EXISTS `budgets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `budgets` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `label` varchar(120) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `budgets` DISABLE KEYS */;
INSERT INTO `budgets` (`id`, `label`, `created_at`, `updated_at`, `is_default`) VALUES (1,'الرعاية الصحية','2026-09-10 19:26:10','2026-09-10 19:26:10',0),
(2,'التعليم والتدريب','2026-09-10 19:26:10','2026-09-10 19:26:10',0),
(3,'النقل والمواصلات','2026-09-10 19:26:10','2026-09-10 19:26:10',0),
(4,'الإدارة العامة','2026-09-10 19:26:10','2026-09-10 19:26:10',0),
(5,'المساعدات الاجتماعية','2026-09-10 19:26:10','2026-09-10 19:26:10',0),
(6,'البرامج والفعاليات','2026-09-10 19:26:10','2026-09-10 19:26:10',0),
(7,'الميزانية العامة','2026-09-10 19:26:10','2026-09-10 19:26:10',1),
(8,'كفالة شاملة','2026-09-10 19:26:10','2026-09-10 19:26:10',0),
(9,'كفالة شاملة - تسيير','2026-09-10 19:26:10','2026-09-10 19:26:10',0),
(10,'كفالة شاملة - مؤونة','2026-09-10 19:26:11','2026-09-10 19:26:11',0),
(11,'كفالة شاملة - تعليم','2026-09-10 19:26:11','2026-09-10 19:26:11',0),
(12,'كفالة شاملة - صحة','2026-09-10 19:26:11','2026-09-10 19:26:11',0),
(13,'كفالة شاملة - تربية وترفيه','2026-09-10 19:26:11','2026-09-10 19:26:11',0),
(14,'كفالة شاملة - مشاريع','2026-09-10 19:26:11','2026-09-10 19:26:11',0),
(15,'كفالة شاملة - تكوين','2026-09-10 19:26:11','2026-09-10 19:26:11',0);
/*!40000 ALTER TABLE `budgets` ENABLE KEYS */;
DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `cache` DISABLE KEYS */;
INSERT INTO `cache` (`key`, `value`, `expiration`) VALUES ('laravel-cache-5c785c036466adea360111aa28563bfd556b5fba','i:1;',1789068442),
('laravel-cache-5c785c036466adea360111aa28563bfd556b5fba:timer','i:1789068442;',1789068442),
('laravel-cache-settings.all','a:0:{}',2104428383);
/*!40000 ALTER TABLE `cache` ENABLE KEYS */;
DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `cache_locks` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache_locks` ENABLE KEYS */;
DROP TABLE IF EXISTS `donors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `donors` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `first_name` varchar(120) DEFAULT NULL,
  `last_name` varchar(120) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `email` varchar(120) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `is_kafil` tinyint(1) NOT NULL DEFAULT 0,
  `total_given` decimal(16,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `donors` DISABLE KEYS */;
INSERT INTO `donors` (`id`, `first_name`, `last_name`, `phone`, `email`, `address`, `created_at`, `updated_at`, `is_kafil`, `total_given`) VALUES (1,'عبد الكريم','الودغيري','0682540987','عبد الكريم.الودغيري@example.com',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:12',1,1070.00),
(2,'خالد','بنموسى','0610077164','خالد.بنموسى@example.com',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:12',1,3020.00),
(3,'ياسمين','الشرقاوي','0667350722','ياسمين.الشرقاوي@example.com',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:12',1,3040.00),
(4,'محمد','الغالي','0677351437','محمد.الغالي@example.com',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:12',1,2120.00),
(5,'سارة','أمين','0613554142','سارة.أمين@example.com',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11',1,2300.00),
(6,'عثمان','الفيلالي','0628583539','عثمان.الفيلالي@example.com',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11',1,700.00),
(7,'ليلى','حمداوي','0687625913','ليلى.حمداوي@example.com',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11',1,1800.00),
(8,'طارق','بوستة','0632061239','طارق.بوستة@example.com',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11',1,900.00),
(9,'رشيد','العلمي','0699026746','رشيد.العلمي@example.com',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11',0,500.00),
(10,'نبيلة','بنكيران','0617059195','نبيلة.بنكيران@example.com',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:12',0,1400.00),
(11,'يوسف','الحلو','0657258408','يوسف.الحلو@example.com',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:12',0,1160.00),
(12,'سلمى','برادة','0651219955','سلمى.برادة@example.com',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:12',0,2750.00),
(13,'إدريس','المكاوي','0679668167','إدريس.المكاوي@example.com',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:12',0,1570.00),
(14,'غزلان','الطاهري','0626430649','غزلان.الطاهري@example.com',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:12',0,2120.00),
(15,'أنس','زروال','0678099089','أنس.زروال@example.com',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:12',0,940.00),
(16,'سميرة','القادري','0630834079','سميرة.القادري@example.com',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:12',0,2420.00),
(17,'مصطفى','العروسي','0688625217','مصطفى.العروسي@example.com',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:12',0,1360.00),
(18,'نزهة','بنشقرون','0623183793','نزهة.بنشقرون@example.com',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:12',0,2750.00);
/*!40000 ALTER TABLE `donors` ENABLE KEYS */;
DROP TABLE IF EXISTS `expense_beneficiaries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `expense_beneficiaries` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `expense_id` bigint unsigned NOT NULL,
  `beneficiary_id` bigint unsigned DEFAULT NULL,
  `group_id` bigint unsigned DEFAULT NULL,
  `amount` decimal(16,2) NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `expense_beneficiaries_expense_id_foreign` (`expense_id`),
  KEY `idx_eb_beneficiary_id` (`beneficiary_id`),
  KEY `fk_exp_ben_group` (`group_id`),
  CONSTRAINT `expense_beneficiaries_expense_id_foreign` FOREIGN KEY (`expense_id`) REFERENCES `expenses` (`id`),
  CONSTRAINT `fk_eb_beneficiaries` FOREIGN KEY (`beneficiary_id`) REFERENCES `beneficiaries` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_exp_ben_group` FOREIGN KEY (`group_id`) REFERENCES `beneficiary_groups` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `expense_beneficiaries` DISABLE KEYS */;
INSERT INTO `expense_beneficiaries` (`id`, `expense_id`, `beneficiary_id`, `group_id`, `amount`, `notes`, `created_at`, `updated_at`) VALUES (1,1,13,NULL,750.00,NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(2,2,24,NULL,1200.00,NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(3,3,37,NULL,450.00,NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(4,4,49,NULL,600.00,NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(5,5,62,NULL,900.00,NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(6,6,75,NULL,1350.00,NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(7,7,8,NULL,520.00,NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(8,8,19,NULL,680.00,NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(9,9,29,NULL,1050.00,NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(10,11,15,NULL,770.00,NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(11,12,24,NULL,280.00,NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(12,13,32,NULL,630.00,NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(13,14,44,NULL,450.00,NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(14,15,53,NULL,770.00,NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(15,16,62,NULL,280.00,NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(16,17,72,NULL,630.00,NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(17,18,1,NULL,450.00,NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(18,19,13,NULL,550.00,NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(19,20,22,NULL,940.00,NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(20,21,29,NULL,340.00,NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(21,22,40,NULL,770.00,NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(22,23,49,NULL,550.00,NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(23,24,58,NULL,940.00,NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(24,25,70,NULL,340.00,NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(25,26,79,NULL,770.00,NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(26,27,8,NULL,550.00,NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12');
/*!40000 ALTER TABLE `expense_beneficiaries` ENABLE KEYS */;
DROP TABLE IF EXISTS `expense_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `expense_categories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `parent_id` bigint unsigned DEFAULT NULL,
  `label` varchar(120) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `expense_categories_label_unique` (`label`),
  KEY `expense_categories_parent_id_foreign` (`parent_id`),
  CONSTRAINT `expense_categories_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `expense_categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=1026 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `expense_categories` DISABLE KEYS */;
INSERT INTO `expense_categories` (`id`, `parent_id`, `label`, `created_at`, `updated_at`) VALUES (1,NULL,'أدوية ومستلزمات طبية','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(2,NULL,'فحوصات طبية','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(3,NULL,'عمليات جراحية','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(4,NULL,'علاج طبيعي','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(5,NULL,'مساعدات طبية طارئة','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(6,NULL,'رسوم مدرسية','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(7,NULL,'مواد تعليمية','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(8,NULL,'دورات تدريبية','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(9,NULL,'منح الطلاب','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(10,NULL,'مصاريف النقل للطلاب','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(11,NULL,'وقود','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(12,NULL,'صيانة المركبات','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(13,NULL,'تأمين المركبات','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(14,NULL,'أجرة سائقين','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(15,NULL,'تذاكر النقل العام','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(16,NULL,'رواتب الموظفين','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(17,NULL,'مصاريف المكتب','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(18,NULL,'إيجار','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(19,NULL,'كهرباء وماء','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(20,NULL,'مصاريف الاتصالات','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(21,NULL,'مصاريف قانونية ومحاسبية','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(22,NULL,'مساعدات نقدية للأرامل','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(23,NULL,'مساعدات نقدية للأيتام','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(24,NULL,'مساعدات غذائية','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(25,NULL,'مساعدات سكن','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(26,NULL,'مساعدات كسوة','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(27,NULL,'تنظيم الفعاليات','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(28,NULL,'برامج ترفيهية للأطفال','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(29,NULL,'ورش تدريبية','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(30,NULL,'مؤتمرات ولقاءات','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(31,NULL,'مواد دعائية وإعلانية','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(999,NULL,'Deleted Category (Default)','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(1000,NULL,'مصاريف إدارية','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(1001,NULL,'أدوات ومستلزمات مكتبية','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(1002,NULL,'اتصالات وإنترنت','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(1003,NULL,'سلة غذائية','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(1004,NULL,'مساعدة نقدية شهرية','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(1005,NULL,'كسوة وملابس','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(1006,NULL,'مساعدة في الإيجار','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(1007,NULL,'فواتير الماء والكهرباء','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(1008,NULL,'رسوم التمدرس','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(1009,NULL,'أدوات ولوازم مدرسية','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(1010,NULL,'دعم ومساندة دراسية','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(1011,NULL,'نقل مدرسي','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(1012,NULL,'أدوية','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(1013,NULL,'فحوصات وتحاليل','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(1014,NULL,'استشارات طبية','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(1015,NULL,'نظارات وأجهزة طبية','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(1016,NULL,'رحلات وخرجات','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(1017,NULL,'مخيمات صيفية','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(1018,NULL,'أنشطة ثقافية ورياضية','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(1019,NULL,'هدايا المناسبات','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(1020,NULL,'مشاريع مدرة للدخل','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(1021,NULL,'تجهيز مشروع أسرة','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(1022,NULL,'دعم نشاط حر','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(1023,NULL,'دورات تكوينية','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(1024,NULL,'تكوين مهني','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(1025,NULL,'ورشات تأهيلية','2026-09-10 19:26:11','2026-09-10 19:26:11');
/*!40000 ALTER TABLE `expense_categories` ENABLE KEYS */;
DROP TABLE IF EXISTS `expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `expenses` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `fiscal_year_id` bigint unsigned NOT NULL,
  `budget_id` bigint unsigned NOT NULL,
  `expense_category_id` bigint unsigned NOT NULL,
  `partner_id` bigint unsigned DEFAULT NULL,
  `details` text DEFAULT NULL,
  `expense_date` date NOT NULL,
  `amount` decimal(16,2) NOT NULL,
  `payment_method` enum('Cash','Cheque','BankWire') NOT NULL,
  `cheque_number` varchar(60) DEFAULT NULL,
  `receipt_number` varchar(60) DEFAULT NULL,
  `bank_account_id` bigint unsigned DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `unrelated_to_benef` tinyint(1) NOT NULL DEFAULT 0,
  `status` enum('Draft','Approved') NOT NULL DEFAULT 'Draft',
  `created_by` bigint unsigned DEFAULT NULL,
  `approved_by` bigint unsigned DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `expenses_fiscal_year_id_foreign` (`fiscal_year_id`),
  KEY `expenses_sub_budget_id_foreign` (`budget_id`),
  KEY `expenses_expense_category_id_foreign` (`expense_category_id`),
  KEY `expenses_partner_id_foreign` (`partner_id`),
  KEY `expenses_bank_account_id_foreign` (`bank_account_id`),
  KEY `expenses_created_by_foreign` (`created_by`),
  KEY `expenses_approved_by_foreign` (`approved_by`),
  CONSTRAINT `expenses_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`),
  CONSTRAINT `expenses_bank_account_id_foreign` FOREIGN KEY (`bank_account_id`) REFERENCES `bank_accounts` (`id`),
  CONSTRAINT `expenses_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `expenses_expense_category_id_foreign` FOREIGN KEY (`expense_category_id`) REFERENCES `expense_categories` (`id`),
  CONSTRAINT `expenses_fiscal_year_id_foreign` FOREIGN KEY (`fiscal_year_id`) REFERENCES `fiscal_years` (`id`),
  CONSTRAINT `expenses_partner_id_foreign` FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`),
  CONSTRAINT `expenses_sub_budget_id_foreign` FOREIGN KEY (`budget_id`) REFERENCES `budgets` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `expenses` DISABLE KEYS */;
INSERT INTO `expenses` (`id`, `fiscal_year_id`, `budget_id`, `expense_category_id`, `partner_id`, `details`, `expense_date`, `amount`, `payment_method`, `cheque_number`, `receipt_number`, `bank_account_id`, `remarks`, `unrelated_to_benef`, `status`, `created_by`, `approved_by`, `approved_at`, `created_at`, `updated_at`) VALUES (1,1,7,2,NULL,NULL,'2026-01-13',750.00,'Cash',NULL,'EX-2026-01',NULL,NULL,0,'Approved',1,1,'2026-09-10 19:26:12','2026-09-10 19:26:12','2026-09-10 19:26:12'),
(2,1,7,3,NULL,NULL,'2026-02-18',1200.00,'Cash',NULL,'EX-2026-02',NULL,NULL,0,'Approved',1,1,'2026-09-10 19:26:12','2026-09-10 19:26:12','2026-09-10 19:26:12'),
(3,1,7,4,NULL,NULL,'2026-03-23',450.00,'Cash',NULL,'EX-2026-03',NULL,NULL,0,'Approved',1,1,'2026-09-10 19:26:12','2026-09-10 19:26:12','2026-09-10 19:26:12'),
(4,1,7,5,NULL,NULL,'2026-04-10',600.00,'Cheque',NULL,'EX-2026-04',NULL,NULL,0,'Approved',1,1,'2026-09-10 19:26:12','2026-09-10 19:26:12','2026-09-10 19:26:12'),
(5,1,7,6,NULL,NULL,'2026-05-15',900.00,'Cash',NULL,'EX-2026-05',NULL,NULL,0,'Approved',1,1,'2026-09-10 19:26:12','2026-09-10 19:26:12','2026-09-10 19:26:12'),
(6,1,7,7,NULL,NULL,'2026-06-20',1350.00,'Cash',NULL,'EX-2026-06',NULL,NULL,0,'Approved',1,1,'2026-09-10 19:26:12','2026-09-10 19:26:12','2026-09-10 19:26:12'),
(7,1,7,8,NULL,NULL,'2026-07-25',520.00,'Cash',NULL,'EX-2026-07',NULL,NULL,0,'Approved',1,1,'2026-09-10 19:26:12','2026-09-10 19:26:12','2026-09-10 19:26:12'),
(8,1,7,9,NULL,NULL,'2026-08-12',680.00,'Cheque',NULL,'EX-2026-08',NULL,NULL,0,'Draft',1,NULL,NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(9,1,7,10,NULL,NULL,'2026-09-10',1050.00,'Cash',NULL,'EX-2026-09',NULL,NULL,0,'Draft',1,NULL,NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(10,1,7,1,NULL,NULL,'2026-09-10',1500.00,'BankWire',NULL,NULL,1,NULL,1,'Approved',1,1,'2026-09-10 19:26:12','2026-09-10 19:26:12','2026-09-10 19:26:12'),
(11,2,7,4,NULL,NULL,'2024-08-23',770.00,'Cash',NULL,'EX-2024-01',NULL,NULL,0,'Approved',1,1,'2026-09-10 19:26:12','2026-09-10 19:26:12','2026-09-10 19:26:12'),
(12,2,7,5,NULL,NULL,'2024-01-11',280.00,'Cash',NULL,'EX-2024-02',NULL,NULL,0,'Approved',1,1,'2026-09-10 19:26:12','2026-09-10 19:26:12','2026-09-10 19:26:12'),
(13,2,7,6,NULL,NULL,'2024-06-15',630.00,'Cheque',NULL,'EX-2024-03',NULL,NULL,0,'Approved',1,1,'2026-09-10 19:26:12','2026-09-10 19:26:12','2026-09-10 19:26:12'),
(14,2,7,7,NULL,NULL,'2024-11-23',450.00,'Cash',NULL,'EX-2024-04',NULL,NULL,0,'Approved',1,1,'2026-09-10 19:26:12','2026-09-10 19:26:12','2026-09-10 19:26:12'),
(15,2,7,8,NULL,NULL,'2024-04-21',770.00,'Cash',NULL,'EX-2024-05',NULL,NULL,0,'Approved',1,1,'2026-09-10 19:26:12','2026-09-10 19:26:12','2026-09-10 19:26:12'),
(16,2,7,9,NULL,NULL,'2024-09-10',280.00,'Cheque',NULL,'EX-2024-06',NULL,NULL,0,'Approved',1,1,'2026-09-10 19:26:12','2026-09-10 19:26:12','2026-09-10 19:26:12'),
(17,2,7,10,NULL,NULL,'2024-02-07',630.00,'Cash',NULL,'EX-2024-07',NULL,NULL,0,'Approved',1,1,'2026-09-10 19:26:12','2026-09-10 19:26:12','2026-09-10 19:26:12'),
(18,2,7,11,NULL,NULL,'2024-07-12',450.00,'Cash',NULL,'EX-2024-08',NULL,NULL,0,'Approved',1,1,'2026-09-10 19:26:12','2026-09-10 19:26:12','2026-09-10 19:26:12'),
(19,3,7,3,NULL,NULL,'2025-07-18',550.00,'Cash',NULL,'EX-2025-01',NULL,NULL,0,'Approved',1,1,'2026-09-10 19:26:12','2026-09-10 19:26:12','2026-09-10 19:26:12'),
(20,3,7,4,NULL,NULL,'2025-12-18',940.00,'Cash',NULL,'EX-2025-02',NULL,NULL,0,'Approved',1,1,'2026-09-10 19:26:12','2026-09-10 19:26:12','2026-09-10 19:26:12'),
(21,3,7,5,NULL,NULL,'2025-05-11',340.00,'Cheque',NULL,'EX-2025-03',NULL,NULL,0,'Approved',1,1,'2026-09-10 19:26:12','2026-09-10 19:26:12','2026-09-10 19:26:12'),
(22,3,7,6,NULL,NULL,'2025-10-25',770.00,'Cash',NULL,'EX-2025-04',NULL,NULL,0,'Approved',1,1,'2026-09-10 19:26:12','2026-09-10 19:26:12','2026-09-10 19:26:12'),
(23,3,7,7,NULL,NULL,'2025-03-17',550.00,'Cash',NULL,'EX-2025-05',NULL,NULL,0,'Approved',1,1,'2026-09-10 19:26:12','2026-09-10 19:26:12','2026-09-10 19:26:12'),
(24,3,7,8,NULL,NULL,'2025-08-04',940.00,'Cheque',NULL,'EX-2025-06',NULL,NULL,0,'Approved',1,1,'2026-09-10 19:26:12','2026-09-10 19:26:12','2026-09-10 19:26:12'),
(25,3,7,9,NULL,NULL,'2025-01-10',340.00,'Cash',NULL,'EX-2025-07',NULL,NULL,0,'Approved',1,1,'2026-09-10 19:26:12','2026-09-10 19:26:12','2026-09-10 19:26:12'),
(26,3,7,10,NULL,NULL,'2025-06-07',770.00,'Cash',NULL,'EX-2025-08',NULL,NULL,0,'Approved',1,1,'2026-09-10 19:26:12','2026-09-10 19:26:12','2026-09-10 19:26:12'),
(27,3,7,11,NULL,NULL,'2025-11-16',550.00,'Cheque',NULL,'EX-2025-09',NULL,NULL,0,'Approved',1,1,'2026-09-10 19:26:12','2026-09-10 19:26:12','2026-09-10 19:26:12');
/*!40000 ALTER TABLE `expenses` ENABLE KEYS */;
DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `failed_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `failed_jobs` ENABLE KEYS */;
DROP TABLE IF EXISTS `fiscal_years`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `fiscal_years` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `year` year(4) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `carryover_prev_year` decimal(16,2) NOT NULL DEFAULT 0.00,
  `carryover_next_year` decimal(16,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `fiscal_years_year_unique` (`year`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `fiscal_years` DISABLE KEYS */;
INSERT INTO `fiscal_years` (`id`, `year`, `is_active`, `carryover_prev_year`, `carryover_next_year`, `created_at`, `updated_at`) VALUES (1,2026,1,0.00,0.00,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(2,2024,0,0.00,0.00,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(3,2025,0,0.00,0.00,'2026-09-10 19:26:11','2026-09-10 19:26:11');
/*!40000 ALTER TABLE `fiscal_years` ENABLE KEYS */;
DROP TABLE IF EXISTS `housing_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `housing_types` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `label` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `housing_types_label_unique` (`label`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `housing_types` DISABLE KEYS */;
INSERT INTO `housing_types` (`id`, `label`, `created_at`, `updated_at`) VALUES (1,'شقة','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(2,'منزل','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(3,'غرفة','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(4,'بيت شعبي','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(5,'كوخ','2026-09-10 19:26:10','2026-09-10 19:26:10');
/*!40000 ALTER TABLE `housing_types` ENABLE KEYS */;
DROP TABLE IF EXISTS `illnesses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `illnesses` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `label` varchar(120) DEFAULT NULL,
  `is_chronic` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `illnesses_label_unique` (`label`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `illnesses` DISABLE KEYS */;
INSERT INTO `illnesses` (`id`, `label`, `is_chronic`, `created_at`, `updated_at`) VALUES (1,'سكري',0,'2026-09-10 19:26:10','2026-09-10 19:26:10'),
(2,'ضغط دم',0,'2026-09-10 19:26:10','2026-09-10 19:26:10'),
(3,'قلب',0,'2026-09-10 19:26:10','2026-09-10 19:26:10'),
(4,'كلى',0,'2026-09-10 19:26:10','2026-09-10 19:26:10'),
(5,'ربو',0,'2026-09-10 19:26:10','2026-09-10 19:26:10'),
(6,'التهاب مفاصل',0,'2026-09-10 19:26:10','2026-09-10 19:26:10'),
(7,'صداع نصفي',0,'2026-09-10 19:26:10','2026-09-10 19:26:10'),
(8,'فقر دم',0,'2026-09-10 19:26:10','2026-09-10 19:26:10'),
(9,'غدة درقية',0,'2026-09-10 19:26:10','2026-09-10 19:26:10');
/*!40000 ALTER TABLE `illnesses` ENABLE KEYS */;
DROP TABLE IF EXISTS `income_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `income_categories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `parent_id` bigint unsigned DEFAULT NULL,
  `label` varchar(120) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `income_categories_label_unique` (`label`),
  KEY `income_categories_parent_id_foreign` (`parent_id`),
  CONSTRAINT `income_categories_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `income_categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=1003 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `income_categories` DISABLE KEYS */;
INSERT INTO `income_categories` (`id`, `parent_id`, `label`, `created_at`, `updated_at`) VALUES (1,NULL,'تبرعات للرعاية الصحية','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(3,NULL,'دعم العلاجات','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(4,NULL,'رسوم التدريب','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(5,NULL,'تبرعات تعليمية','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(6,NULL,'منح دراسية','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(7,NULL,'تبرعات للمواصلات','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(8,NULL,'دعم النقل','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(9,NULL,'رسوم إدارية','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(10,NULL,'تبرعات عامة','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(11,NULL,'تبرعات للمساعدات الاجتماعية','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(12,NULL,'زكاة','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(13,NULL,'صدقات','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(14,NULL,'رعاية الفعاليات','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(15,NULL,'تبرعات للبرامج','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(999,NULL,'Deleted Category (Default)','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(1002,NULL,'كفالة شاملة','2026-09-10 19:26:10','2026-09-10 19:26:10');
/*!40000 ALTER TABLE `income_categories` ENABLE KEYS */;
DROP TABLE IF EXISTS `incomes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `incomes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `fiscal_year_id` bigint unsigned NOT NULL,
  `budget_id` bigint unsigned NOT NULL,
  `income_category_id` bigint unsigned NOT NULL,
  `donor_id` bigint unsigned DEFAULT NULL,
  `kafil_id` bigint unsigned DEFAULT NULL,
  `widow_id` bigint unsigned DEFAULT NULL,
  `income_date` date NOT NULL,
  `amount` decimal(16,2) NOT NULL,
  `payment_method` enum('Cash','Cheque','BankWire') NOT NULL,
  `cheque_number` varchar(60) DEFAULT NULL,
  `receipt_number` varchar(60) DEFAULT NULL,
  `bank_account_id` bigint unsigned DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `status` enum('Draft','Approved') NOT NULL DEFAULT 'Draft',
  `created_by` bigint unsigned DEFAULT NULL,
  `approved_by` bigint unsigned DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `transferred_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `incomes_fiscal_year_id_foreign` (`fiscal_year_id`),
  KEY `incomes_sub_budget_id_foreign` (`budget_id`),
  KEY `incomes_income_category_id_foreign` (`income_category_id`),
  KEY `incomes_donor_id_foreign` (`donor_id`),
  KEY `incomes_kafil_id_foreign` (`kafil_id`),
  KEY `incomes_bank_account_id_foreign` (`bank_account_id`),
  KEY `incomes_created_by_foreign` (`created_by`),
  KEY `incomes_approved_by_foreign` (`approved_by`),
  KEY `incomes_widow_id_foreign` (`widow_id`),
  CONSTRAINT `incomes_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`),
  CONSTRAINT `incomes_bank_account_id_foreign` FOREIGN KEY (`bank_account_id`) REFERENCES `bank_accounts` (`id`),
  CONSTRAINT `incomes_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `incomes_donor_id_foreign` FOREIGN KEY (`donor_id`) REFERENCES `donors` (`id`),
  CONSTRAINT `incomes_fiscal_year_id_foreign` FOREIGN KEY (`fiscal_year_id`) REFERENCES `fiscal_years` (`id`),
  CONSTRAINT `incomes_income_category_id_foreign` FOREIGN KEY (`income_category_id`) REFERENCES `income_categories` (`id`),
  CONSTRAINT `incomes_kafil_id_foreign` FOREIGN KEY (`kafil_id`) REFERENCES `kafils` (`id`),
  CONSTRAINT `incomes_sub_budget_id_foreign` FOREIGN KEY (`budget_id`) REFERENCES `budgets` (`id`),
  CONSTRAINT `incomes_widow_id_foreign` FOREIGN KEY (`widow_id`) REFERENCES `widows` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `incomes` DISABLE KEYS */;
INSERT INTO `incomes` (`id`, `fiscal_year_id`, `budget_id`, `income_category_id`, `donor_id`, `kafil_id`, `widow_id`, `income_date`, `amount`, `payment_method`, `cheque_number`, `receipt_number`, `bank_account_id`, `remarks`, `status`, `created_by`, `approved_by`, `approved_at`, `transferred_at`, `created_at`, `updated_at`) VALUES (1,1,7,10,2,NULL,NULL,'2026-01-08',900.00,'Cash',NULL,'RC-2026-01',NULL,NULL,'Approved',1,1,'2026-09-10 19:26:11',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(2,1,7,10,3,NULL,NULL,'2026-02-11',2400.00,'Cash',NULL,'RC-2026-02',NULL,NULL,'Approved',1,1,'2026-09-10 19:26:11',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(3,1,7,10,4,NULL,NULL,'2026-03-14',1100.00,'Cheque',NULL,'RC-2026-03',NULL,NULL,'Approved',1,1,'2026-09-10 19:26:11',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(4,1,7,10,5,NULL,NULL,'2026-04-17',1800.00,'Cash',NULL,'RC-2026-04',NULL,NULL,'Approved',1,1,'2026-09-10 19:26:11',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(5,1,7,10,6,NULL,NULL,'2026-05-20',700.00,'Cash',NULL,'RC-2026-05',NULL,NULL,'Approved',1,1,'2026-09-10 19:26:11',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(6,1,7,10,7,NULL,NULL,'2026-06-23',1500.00,'Cheque',NULL,'RC-2026-06',NULL,NULL,'Approved',1,1,'2026-09-10 19:26:11',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(7,1,7,10,8,NULL,NULL,'2026-07-06',900.00,'Cash',NULL,'RC-2026-07',NULL,NULL,'Approved',1,1,'2026-09-10 19:26:11',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(8,1,7,10,9,NULL,NULL,'2026-08-09',2400.00,'Cash',NULL,'RC-2026-08',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(9,1,7,10,10,NULL,NULL,'2026-09-10',1100.00,'Cheque',NULL,'RC-2026-09',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(10,1,7,10,5,NULL,NULL,'2026-01-11',500.00,'Cash',NULL,'RC-1000',NULL,NULL,'Approved',1,1,'2026-09-10 19:26:11',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(11,1,7,10,6,NULL,NULL,'2026-02-12',1200.00,'Cash',NULL,'RC-1001',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(12,1,7,10,7,NULL,NULL,'2026-03-13',300.00,'Cash',NULL,'RC-1002',NULL,NULL,'Approved',1,1,'2026-09-10 19:26:11',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(13,1,7,10,8,NULL,NULL,'2026-04-14',2000.00,'Cash',NULL,'RC-1003',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(14,1,7,10,9,NULL,NULL,'2026-05-15',500.00,'Cash',NULL,'RC-1004',NULL,NULL,'Approved',1,1,'2026-09-10 19:26:11',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(15,1,7,10,10,NULL,NULL,'2026-06-16',1200.00,'Cash',NULL,'RC-1005',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(16,1,7,10,11,NULL,NULL,'2026-07-17',300.00,'Cash',NULL,'RC-1006',NULL,NULL,'Approved',1,1,'2026-09-10 19:26:11',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(17,1,7,10,12,NULL,NULL,'2026-08-18',2000.00,'Cash',NULL,'RC-1007',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(18,1,7,10,13,NULL,NULL,'2026-09-10',500.00,'Cash',NULL,'RC-1008',NULL,NULL,'Approved',1,1,'2026-09-10 19:26:11',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(19,1,7,10,14,NULL,NULL,'2026-01-20',1200.00,'Cash',NULL,'RC-1009',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(20,1,7,10,15,NULL,NULL,'2026-02-21',300.00,'Cash',NULL,'RC-1010',NULL,NULL,'Approved',1,1,'2026-09-10 19:26:11',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(21,1,7,10,16,NULL,NULL,'2026-03-22',2000.00,'Cash',NULL,'RC-1011',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(22,1,7,10,17,NULL,NULL,'2026-04-23',500.00,'Cash',NULL,'RC-1012',NULL,NULL,'Approved',1,1,'2026-09-10 19:26:11',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(23,1,7,10,18,NULL,NULL,'2026-05-24',1200.00,'Cash',NULL,'RC-1013',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(24,1,8,1002,NULL,3,3,'2026-09-03',400.00,'BankWire',NULL,NULL,2,NULL,'Approved',1,1,'2026-09-10 19:26:11',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(25,1,8,1002,NULL,3,4,'2026-09-03',400.00,'BankWire',NULL,NULL,2,NULL,'Approved',1,1,'2026-09-10 19:26:11',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(26,1,9,1002,NULL,1,1,'2026-08-14',80.00,'Cash',NULL,'RC-KC-1',NULL,NULL,'Approved',1,1,'2026-09-10 19:26:11',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(27,1,10,1002,NULL,1,1,'2026-08-14',400.00,'Cash',NULL,'RC-KC-1',NULL,NULL,'Approved',1,1,'2026-09-10 19:26:11',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(28,1,11,1002,NULL,1,1,'2026-08-14',160.00,'Cash',NULL,'RC-KC-1',NULL,NULL,'Approved',1,1,'2026-09-10 19:26:12',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:12'),
(29,1,12,1002,NULL,1,1,'2026-08-14',32.00,'Cash',NULL,'RC-KC-1',NULL,NULL,'Approved',1,1,'2026-09-10 19:26:12',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:12'),
(30,1,13,1002,NULL,1,1,'2026-08-14',40.00,'Cash',NULL,'RC-KC-1',NULL,NULL,'Approved',1,1,'2026-09-10 19:26:12',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:12'),
(31,1,14,1002,NULL,1,1,'2026-08-14',48.00,'Cash',NULL,'RC-KC-1',NULL,NULL,'Approved',1,1,'2026-09-10 19:26:12',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:12'),
(32,1,15,1002,NULL,1,1,'2026-08-14',40.00,'Cash',NULL,'RC-KC-1',NULL,NULL,'Approved',1,1,'2026-09-10 19:26:12',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:12'),
(33,1,9,1002,NULL,2,NULL,'2026-09-10',80.00,'Cash',NULL,'RC-KC-2',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(34,1,10,1002,NULL,2,NULL,'2026-09-10',400.00,'Cash',NULL,'RC-KC-2',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(35,1,11,1002,NULL,2,NULL,'2026-09-10',160.00,'Cash',NULL,'RC-KC-2',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(36,1,12,1002,NULL,2,NULL,'2026-09-10',32.00,'Cash',NULL,'RC-KC-2',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(37,1,13,1002,NULL,2,NULL,'2026-09-10',40.00,'Cash',NULL,'RC-KC-2',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(38,1,14,1002,NULL,2,NULL,'2026-09-10',48.00,'Cash',NULL,'RC-KC-2',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(39,1,15,1002,NULL,2,NULL,'2026-09-10',40.00,'Cash',NULL,'RC-KC-2',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(40,2,7,10,10,NULL,NULL,'2024-01-04',1400.00,'Cash',NULL,'RC-2024-01',NULL,NULL,'Approved',1,1,'2026-09-10 19:26:12',NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(41,2,7,10,11,NULL,NULL,'2024-02-21',600.00,'Cash',NULL,'RC-2024-02',NULL,NULL,'Approved',1,1,'2026-09-10 19:26:12',NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(42,2,7,10,12,NULL,NULL,'2024-03-08',1050.00,'Cash',NULL,'RC-2024-03',NULL,NULL,'Approved',1,1,'2026-09-10 19:26:12',NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(43,2,7,10,13,NULL,NULL,'2024-04-20',350.00,'Cheque',NULL,'RC-2024-04',NULL,NULL,'Approved',1,1,'2026-09-10 19:26:12',NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(44,2,7,10,14,NULL,NULL,'2024-05-23',840.00,'Cash',NULL,'RC-2024-05',NULL,NULL,'Approved',1,1,'2026-09-10 19:26:12',NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(45,2,7,10,15,NULL,NULL,'2024-06-17',210.00,'Cash',NULL,'RC-2024-06',NULL,NULL,'Approved',1,1,'2026-09-10 19:26:12',NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(46,2,7,10,16,NULL,NULL,'2024-07-10',1400.00,'Cash',NULL,'RC-2024-07',NULL,NULL,'Approved',1,1,'2026-09-10 19:26:12',NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(47,2,7,10,17,NULL,NULL,'2024-08-18',600.00,'Cheque',NULL,'RC-2024-08',NULL,NULL,'Approved',1,1,'2026-09-10 19:26:12',NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(48,2,7,10,18,NULL,NULL,'2024-09-15',1050.00,'Cash',NULL,'RC-2024-09',NULL,NULL,'Approved',1,1,'2026-09-10 19:26:12',NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(49,2,7,10,1,NULL,NULL,'2024-10-14',350.00,'Cash',NULL,'RC-2024-10',NULL,NULL,'Approved',1,1,'2026-09-10 19:26:12',NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(50,2,7,10,2,NULL,NULL,'2024-11-27',840.00,'Cash',NULL,'RC-2024-11',NULL,NULL,'Approved',1,1,'2026-09-10 19:26:12',NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(51,2,7,10,3,NULL,NULL,'2024-12-17',210.00,'Cheque',NULL,'RC-2024-12',NULL,NULL,'Approved',1,1,'2026-09-10 19:26:12',NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(52,3,7,10,11,NULL,NULL,'2025-01-05',260.00,'Cash',NULL,'RC-2025-01',NULL,NULL,'Approved',1,1,'2026-09-10 19:26:12',NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(53,3,7,10,12,NULL,NULL,'2025-02-19',1700.00,'Cash',NULL,'RC-2025-02',NULL,NULL,'Approved',1,1,'2026-09-10 19:26:12',NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(54,3,7,10,13,NULL,NULL,'2025-03-03',720.00,'Cash',NULL,'RC-2025-03',NULL,NULL,'Approved',1,1,'2026-09-10 19:26:12',NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(55,3,7,10,14,NULL,NULL,'2025-04-10',1280.00,'Cheque',NULL,'RC-2025-04',NULL,NULL,'Approved',1,1,'2026-09-10 19:26:12',NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(56,3,7,10,15,NULL,NULL,'2025-05-12',430.00,'Cash',NULL,'RC-2025-05',NULL,NULL,'Approved',1,1,'2026-09-10 19:26:12',NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(57,3,7,10,16,NULL,NULL,'2025-06-13',1020.00,'Cash',NULL,'RC-2025-06',NULL,NULL,'Approved',1,1,'2026-09-10 19:26:12',NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(58,3,7,10,17,NULL,NULL,'2025-07-06',260.00,'Cash',NULL,'RC-2025-07',NULL,NULL,'Approved',1,1,'2026-09-10 19:26:12',NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(59,3,7,10,18,NULL,NULL,'2025-08-20',1700.00,'Cheque',NULL,'RC-2025-08',NULL,NULL,'Approved',1,1,'2026-09-10 19:26:12',NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(60,3,7,10,1,NULL,NULL,'2025-09-14',720.00,'Cash',NULL,'RC-2025-09',NULL,NULL,'Approved',1,1,'2026-09-10 19:26:12',NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(61,3,7,10,2,NULL,NULL,'2025-10-03',1280.00,'Cash',NULL,'RC-2025-10',NULL,NULL,'Approved',1,1,'2026-09-10 19:26:12',NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(62,3,7,10,3,NULL,NULL,'2025-11-13',430.00,'Cash',NULL,'RC-2025-11',NULL,NULL,'Approved',1,1,'2026-09-10 19:26:12',NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12'),
(63,3,7,10,4,NULL,NULL,'2025-12-25',1020.00,'Cheque',NULL,'RC-2025-12',NULL,NULL,'Approved',1,1,'2026-09-10 19:26:12',NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12');
/*!40000 ALTER TABLE `incomes` ENABLE KEYS */;
DROP TABLE IF EXISTS `job_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `job_batches` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_batches` ENABLE KEYS */;
DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) unsigned NOT NULL,
  `reserved_at` int unsigned DEFAULT NULL,
  `available_at` int unsigned NOT NULL,
  `created_at` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
DROP TABLE IF EXISTS `kafala_chamila_splits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `kafala_chamila_splits` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `key` varchar(30) NOT NULL,
  `label` varchar(120) NOT NULL,
  `percentage` decimal(5,2) NOT NULL,
  `budget_id` bigint unsigned NOT NULL,
  `income_category_id` bigint unsigned NOT NULL,
  `sort_order` smallint unsigned NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `kafala_chamila_splits_key_unique` (`key`),
  KEY `kafala_chamila_splits_sub_budget_id_foreign` (`budget_id`),
  KEY `kafala_chamila_splits_income_category_id_foreign` (`income_category_id`),
  CONSTRAINT `kafala_chamila_splits_income_category_id_foreign` FOREIGN KEY (`income_category_id`) REFERENCES `income_categories` (`id`),
  CONSTRAINT `kafala_chamila_splits_sub_budget_id_foreign` FOREIGN KEY (`budget_id`) REFERENCES `budgets` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `kafala_chamila_splits` DISABLE KEYS */;
INSERT INTO `kafala_chamila_splits` (`id`, `key`, `label`, `percentage`, `budget_id`, `income_category_id`, `sort_order`, `created_at`, `updated_at`) VALUES (1,'management','تسيير',10.00,9,1002,1,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(2,'maouna','مؤونة',50.00,10,1002,2,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(3,'education','تعليم',20.00,11,1002,3,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(4,'health','صحة',4.00,12,1002,4,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(5,'activities','تربية وترفيه',5.00,13,1002,5,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(6,'projects','مشاريع',6.00,14,1002,6,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(7,'formation','تكوين',5.00,15,1002,7,'2026-09-10 19:26:11','2026-09-10 19:26:11');
/*!40000 ALTER TABLE `kafala_chamila_splits` ENABLE KEYS */;
DROP TABLE IF EXISTS `kafil_sponsorship`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `kafil_sponsorship` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kafil_id` bigint unsigned NOT NULL,
  `widow_id` bigint unsigned NOT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `kafil_sponsorship_kafil_widow_unique` (`kafil_id`,`widow_id`),
  KEY `kafil_sponsorship_widow_id_foreign` (`widow_id`),
  CONSTRAINT `kafil_sponsorship_kafil_id_foreign` FOREIGN KEY (`kafil_id`) REFERENCES `kafils` (`id`),
  CONSTRAINT `kafil_sponsorship_widow_id_foreign` FOREIGN KEY (`widow_id`) REFERENCES `widows` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `kafil_sponsorship` DISABLE KEYS */;
INSERT INTO `kafil_sponsorship` (`id`, `kafil_id`, `widow_id`, `amount`, `created_at`, `updated_at`) VALUES (1,1,1,400.00,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(2,2,2,800.00,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(3,3,3,400.00,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(4,3,4,400.00,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(5,4,6,400.00,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(6,5,7,400.00,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(7,5,8,400.00,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(8,5,9,400.00,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(9,6,11,400.00,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(10,7,13,400.00,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(11,7,14,400.00,'2026-09-10 19:26:11','2026-09-10 19:26:11');
/*!40000 ALTER TABLE `kafil_sponsorship` ENABLE KEYS */;
DROP TABLE IF EXISTS `kafils`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `kafils` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `first_name` varchar(120) DEFAULT NULL,
  `last_name` varchar(120) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `email` varchar(120) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `donor_id` bigint unsigned DEFAULT NULL,
  `monthly_pledge` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `kafils_donor_id_foreign` (`donor_id`),
  CONSTRAINT `kafils_donor_id_foreign` FOREIGN KEY (`donor_id`) REFERENCES `donors` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `kafils` DISABLE KEYS */;
INSERT INTO `kafils` (`id`, `first_name`, `last_name`, `phone`, `email`, `address`, `created_at`, `updated_at`, `donor_id`, `monthly_pledge`) VALUES (1,'عبد الكريم','الودغيري','0682540987','عبد الكريم.الودغيري@example.com',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11',1,800.00),
(2,'خالد','بنموسى','0610077164','خالد.بنموسى@example.com',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11',2,1600.00),
(3,'ياسمين','الشرقاوي','0667350722','ياسمين.الشرقاوي@example.com',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11',3,800.00),
(4,'محمد','الغالي','0677351437','محمد.الغالي@example.com',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11',4,400.00),
(5,'سارة','أمين','0613554142','سارة.أمين@example.com',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11',5,2400.00),
(6,'عثمان','الفيلالي','0628583539','عثمان.الفيلالي@example.com',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11',6,800.00),
(7,'ليلى','حمداوي','0687625913','ليلى.حمداوي@example.com',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11',7,1200.00),
(8,'طارق','بوستة','0632061239','طارق.بوستة@example.com',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11',8,800.00);
/*!40000 ALTER TABLE `kafils` ENABLE KEYS */;
DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (1,'0001_01_01_000000_create_users_table',1),
(2,'0001_01_01_000001_create_cache_table',1),
(3,'0001_01_01_000002_create_jobs_table',1),
(4,'2025_09_04_000001_create_aid_types_table',1),
(5,'2025_09_04_000002_create_housing_types_table',1),
(6,'2025_09_04_000003_create_skills_table',1),
(7,'2025_09_04_000004_create_illnesses_table',1),
(8,'2025_09_04_000005_create_partner_fields_table',1),
(9,'2025_09_04_000006_create_partner_subfields_table',1),
(10,'2025_09_04_000007_create_fiscal_years_table',1),
(11,'2025_09_04_000008_create_bank_accounts_table',1),
(12,'2025_09_04_000009_create_sub_budgets_table',1),
(13,'2025_09_04_000010_create_income_categories_table',1),
(14,'2025_09_04_000011_create_expense_categories_table',1),
(15,'2025_09_04_000012_create_partners_table',1),
(16,'2025_09_04_000013_create_donors_table',1),
(17,'2025_09_04_000014_create_kafils_table',1),
(18,'2025_09_04_000015_create_widows_table',1),
(19,'2025_09_04_000016_create_orphans_education_level_table',1),
(20,'2025_09_04_000017_create_orphans_table',1),
(21,'2025_09_04_000018_create_kafil_sponsorship_table',1),
(22,'2025_09_04_000019_create_beneficiaries_table',1),
(23,'2025_09_04_000020_create_beneficiary_groups_table',1),
(24,'2025_09_04_000021_create_beneficiary_group_members_table',1),
(25,'2025_09_04_000022_create_widow_files_table',1),
(26,'2025_09_04_000023_create_widow_social_table',1),
(27,'2025_09_04_000024_create_widow_income_categories_table',1),
(28,'2025_09_04_000025_create_widow_expense_categories_table',1),
(29,'2025_09_04_000026_create_widow_social_income_table',1),
(30,'2025_09_04_000027_create_widow_social_expense_table',1),
(31,'2025_09_04_000028_create_widow_skill_table',1),
(32,'2025_09_04_000029_create_widow_illness_table',1),
(33,'2025_09_04_000030_create_widow_aid_table',1),
(34,'2025_09_04_000031_create_widow_maouna_table',1),
(35,'2025_09_04_000032_create_incomes_table',1),
(36,'2025_09_04_000033_create_expenses_table',1),
(37,'2025_09_04_000034_create_expense_beneficiaries_table',1),
(38,'2025_09_04_000035_create_transfers_table',1),
(39,'2025_09_04_000036_create_v_current_cash_view',1),
(40,'2025_09_05_000001_create_widow_phones_table',1),
(41,'2025_09_05_000002_add_liaison_and_leaving_to_widows_table',1),
(42,'2025_09_05_000003_add_personal_and_education_fields_to_orphans_table',1),
(43,'2025_09_05_000004_create_schools_table',1),
(44,'2025_09_05_000005_create_academic_years_table',1),
(45,'2025_09_05_000006_create_orphan_enrollments_table',1),
(46,'2025_09_06_000001_create_personal_access_tokens_table',1),
(47,'2025_09_06_000002_add_role_to_users_table',1),
(48,'2025_09_07_000001_create_kafala_chamila_splits_table',1),
(49,'2025_09_09_000001_add_widow_id_to_incomes_table',1),
(50,'2025_09_10_000001_create_bank_account_transactions_table',1),
(51,'2025_09_11_000001_separate_budgets_from_categories',1),
(52,'2025_09_12_000001_add_semester_grades_to_orphan_enrollments',1),
(53,'2025_09_12_000002_normalize_school_type_values',1),
(54,'2025_09_13_000001_add_profile_and_status_to_users_table',1),
(55,'2025_09_13_000002_create_settings_table',1);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
DROP TABLE IF EXISTS `orphan_enrollments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `orphan_enrollments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `orphan_id` bigint unsigned NOT NULL,
  `academic_year_id` bigint unsigned NOT NULL,
  `education_level_id` bigint unsigned DEFAULT NULL,
  `school_id` bigint unsigned DEFAULT NULL,
  `specialty` varchar(150) DEFAULT NULL,
  `first_semester_grade` decimal(5,2) DEFAULT NULL,
  `second_semester_grade` decimal(5,2) DEFAULT NULL,
  `grade_scale` decimal(5,2) NOT NULL DEFAULT 20.00,
  `status` enum('enrolled','passed','failed','left') NOT NULL DEFAULT 'enrolled',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `orphan_enrollments_orphan_id_academic_year_id_unique` (`orphan_id`,`academic_year_id`),
  KEY `orphan_enrollments_academic_year_id_foreign` (`academic_year_id`),
  KEY `orphan_enrollments_education_level_id_foreign` (`education_level_id`),
  KEY `orphan_enrollments_school_id_foreign` (`school_id`),
  CONSTRAINT `orphan_enrollments_academic_year_id_foreign` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`),
  CONSTRAINT `orphan_enrollments_education_level_id_foreign` FOREIGN KEY (`education_level_id`) REFERENCES `orphans_education_level` (`id`) ON DELETE SET NULL,
  CONSTRAINT `orphan_enrollments_orphan_id_foreign` FOREIGN KEY (`orphan_id`) REFERENCES `orphans` (`id`) ON DELETE CASCADE,
  CONSTRAINT `orphan_enrollments_school_id_foreign` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=151 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `orphan_enrollments` DISABLE KEYS */;
INSERT INTO `orphan_enrollments` (`id`, `orphan_id`, `academic_year_id`, `education_level_id`, `school_id`, `specialty`, `first_semester_grade`, `second_semester_grade`, `grade_scale`, `status`, `notes`, `created_at`, `updated_at`) VALUES (1,1,1,3,1,NULL,NULL,NULL,20.00,'enrolled',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(2,2,1,8,2,NULL,8.38,12.00,20.00,'enrolled',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(3,3,1,6,1,NULL,14.59,11.12,20.00,'enrolled',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(4,4,1,11,3,NULL,16.47,NULL,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(5,5,1,16,5,'الإعلاميات',67.17,68.99,100.00,'failed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(6,6,1,9,3,NULL,11.11,15.84,20.00,'enrolled',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(7,9,1,16,5,'علوم الحياة والأرض',57.96,63.86,100.00,'enrolled',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(8,10,1,16,6,'الإعلاميات',NULL,NULL,100.00,'enrolled',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(9,11,1,6,1,NULL,12.03,NULL,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(10,12,1,11,3,NULL,13.06,12.38,20.00,'failed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(11,13,1,4,1,NULL,16.82,14.86,20.00,'enrolled',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(12,14,1,9,3,NULL,13.11,18.51,20.00,'enrolled',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(13,15,1,7,1,NULL,15.84,12.34,20.00,'enrolled',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(14,16,1,10,3,NULL,9.62,NULL,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(15,17,1,16,5,'الاقتصاد',NULL,NULL,100.00,'failed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(16,19,1,16,6,'علوم الحياة والأرض',71.23,74.75,100.00,'enrolled',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(17,20,1,4,1,NULL,8.03,9.44,20.00,'enrolled',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(18,21,1,16,6,'الاقتصاد',51.24,90.82,100.00,'enrolled',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(19,22,1,7,1,NULL,11.05,NULL,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(20,23,1,12,4,NULL,8.45,17.80,20.00,'failed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(21,24,1,16,5,'الاقتصاد',36.96,78.73,100.00,'enrolled',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(22,25,1,5,2,NULL,NULL,NULL,20.00,'enrolled',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(23,26,1,10,3,NULL,11.85,18.39,20.00,'enrolled',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(24,27,1,8,2,NULL,9.52,NULL,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(25,28,1,13,4,NULL,8.86,14.37,20.00,'failed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(26,29,1,16,6,'الإعلاميات',71.45,37.02,100.00,'enrolled',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(27,30,1,11,3,NULL,10.11,14.15,20.00,'enrolled',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(28,31,1,14,4,NULL,18.60,18.84,20.00,'enrolled',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(29,32,1,16,5,'الإعلاميات',NULL,NULL,100.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(30,33,1,16,6,'الاقتصاد',37.05,68.12,100.00,'failed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(31,34,1,5,1,NULL,10.02,7.05,20.00,'enrolled',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(32,35,1,10,3,NULL,7.21,14.65,20.00,'enrolled',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(33,36,1,3,1,NULL,16.56,8.63,20.00,'enrolled',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(34,37,1,8,2,NULL,10.06,NULL,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(35,38,1,6,1,NULL,16.90,14.57,20.00,'failed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(36,39,1,9,3,NULL,NULL,NULL,20.00,'enrolled',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(37,40,1,14,4,NULL,7.34,16.22,20.00,'enrolled',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(38,41,1,16,6,'الإعلاميات',87.86,66.52,100.00,'enrolled',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(39,42,1,12,4,NULL,7.23,NULL,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(40,43,1,16,6,'علوم الحياة والأرض',88.22,62.61,100.00,'failed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(41,44,1,16,5,'الإعلاميات',81.39,88.12,100.00,'enrolled',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(42,45,1,3,2,NULL,7.87,7.26,20.00,'enrolled',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(43,46,1,8,1,NULL,NULL,NULL,20.00,'enrolled',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(44,47,1,13,4,NULL,12.89,NULL,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(45,48,1,16,5,'الاقتصاد',70.02,76.27,100.00,'failed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(46,49,1,4,2,NULL,11.93,16.28,20.00,'enrolled',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(47,50,1,9,3,NULL,12.49,17.93,20.00,'enrolled',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(48,51,1,7,2,NULL,16.69,16.94,20.00,'enrolled',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(49,52,1,12,4,NULL,18.95,NULL,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(50,53,1,16,6,'الإعلاميات',NULL,NULL,100.00,'failed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(51,1,2,3,1,NULL,8.33,NULL,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(52,1,3,3,1,NULL,15.54,8.88,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(53,2,2,6,2,NULL,7.30,14.39,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(54,2,3,7,2,NULL,16.05,10.28,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(55,3,2,4,1,NULL,7.48,7.64,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(56,3,3,5,1,NULL,11.25,10.95,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(57,4,2,9,3,NULL,16.25,9.81,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(58,4,3,10,3,NULL,14.63,14.15,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(59,5,2,14,4,NULL,10.96,14.69,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(60,5,3,15,5,'الإعلاميات',90.38,NULL,100.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(61,6,2,7,2,NULL,7.90,NULL,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(62,6,3,8,2,NULL,11.82,12.23,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(63,9,2,14,4,NULL,8.05,9.03,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(64,9,3,15,5,'علوم الحياة والأرض',91.91,37.15,100.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(65,10,2,14,4,NULL,18.57,7.06,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(66,10,3,15,6,'الإعلاميات',63.11,68.13,100.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(67,11,2,4,1,NULL,9.82,19.00,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(68,11,3,5,1,NULL,8.79,18.18,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(69,12,2,9,3,NULL,7.82,10.91,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(70,12,3,10,3,NULL,10.87,NULL,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(71,13,2,3,1,NULL,15.43,NULL,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(72,13,3,3,1,NULL,16.13,10.40,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(73,14,2,7,2,NULL,8.23,7.65,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(74,14,3,8,2,NULL,9.69,15.82,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(75,15,2,5,1,NULL,8.18,11.33,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(76,15,3,6,1,NULL,10.23,16.49,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(77,16,2,8,2,NULL,18.76,7.31,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(78,16,3,9,3,NULL,7.60,14.03,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(79,17,2,14,4,NULL,16.13,9.28,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(80,17,3,15,5,'الاقتصاد',73.73,NULL,100.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(81,19,2,14,4,NULL,12.42,NULL,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(82,19,3,15,6,'علوم الحياة والأرض',50.88,49.24,100.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(83,20,2,3,1,NULL,16.77,10.51,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(84,20,3,3,1,NULL,15.65,13.88,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(85,21,2,14,4,NULL,9.93,17.64,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(86,21,3,15,6,'الاقتصاد',95.33,58.71,100.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(87,22,2,5,1,NULL,8.51,17.03,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(88,22,3,6,1,NULL,17.58,10.03,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(89,23,2,10,3,NULL,15.04,18.37,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(90,23,3,11,3,NULL,7.58,NULL,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(91,24,2,14,4,NULL,7.09,NULL,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(92,24,3,15,5,'الاقتصاد',42.99,77.36,100.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(93,25,2,3,2,NULL,7.97,16.83,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(94,25,3,4,2,NULL,18.99,7.64,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(95,26,2,8,1,NULL,16.62,13.56,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(96,26,3,9,3,NULL,16.50,16.15,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(97,27,2,6,2,NULL,18.39,16.19,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(98,27,3,7,2,NULL,11.11,12.65,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(99,28,2,11,3,NULL,7.66,17.73,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(100,28,3,12,4,NULL,15.55,NULL,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(101,29,2,14,4,NULL,11.76,NULL,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(102,29,3,15,6,'الإعلاميات',60.03,92.54,100.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(103,30,2,9,3,NULL,18.58,18.13,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(104,30,3,10,3,NULL,17.27,17.41,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(105,31,2,12,4,NULL,9.89,8.43,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(106,31,3,13,4,NULL,12.63,15.10,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(107,32,2,14,4,NULL,16.96,15.69,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(108,32,3,15,5,'الإعلاميات',41.31,66.61,100.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(109,33,2,14,4,NULL,14.26,13.50,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(110,33,3,15,6,'الاقتصاد',93.46,NULL,100.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(111,34,2,3,1,NULL,12.22,NULL,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(112,34,3,4,1,NULL,8.90,9.50,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(113,35,2,8,2,NULL,18.52,11.40,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(114,35,3,9,3,NULL,17.17,13.58,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(115,36,2,3,1,NULL,8.31,11.89,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(116,36,3,3,1,NULL,17.98,14.11,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(117,37,2,6,2,NULL,18.02,13.02,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(118,37,3,7,2,NULL,16.54,7.17,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(119,38,2,4,1,NULL,11.50,15.60,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(120,38,3,5,1,NULL,7.91,NULL,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(121,39,2,7,2,NULL,18.85,NULL,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(122,39,3,8,2,NULL,14.37,9.74,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(123,40,2,12,4,NULL,17.11,11.78,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(124,40,3,13,4,NULL,10.95,13.05,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(125,41,2,14,4,NULL,16.44,13.35,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(126,41,3,15,6,'الإعلاميات',42.96,88.39,100.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(127,42,2,10,3,NULL,18.27,11.06,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(128,42,3,11,3,NULL,8.59,9.25,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(129,43,2,14,4,NULL,9.90,10.36,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(130,43,3,15,6,'علوم الحياة والأرض',62.60,NULL,100.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(131,44,2,14,4,NULL,9.36,NULL,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(132,44,3,15,5,'الإعلاميات',81.81,74.89,100.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(133,45,2,3,2,NULL,7.71,18.07,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(134,45,3,3,2,NULL,11.57,18.18,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(135,46,2,6,1,NULL,9.31,9.29,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(136,46,3,7,1,NULL,9.32,8.96,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(137,47,2,11,3,NULL,8.02,12.07,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(138,47,3,12,4,NULL,12.66,7.88,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(139,48,2,14,4,NULL,13.43,15.56,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(140,48,3,15,5,'الاقتصاد',66.76,NULL,100.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(141,49,2,3,2,NULL,16.57,NULL,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(142,49,3,3,2,NULL,18.57,9.05,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(143,50,2,7,1,NULL,16.25,7.81,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(144,50,3,8,1,NULL,16.91,10.58,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(145,51,2,5,2,NULL,13.96,15.24,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(146,51,3,6,2,NULL,10.88,18.55,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(147,52,2,10,3,NULL,9.40,17.22,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(148,52,3,11,3,NULL,16.97,15.81,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(149,53,2,14,4,NULL,10.00,15.19,20.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(150,53,3,15,6,'الإعلاميات',89.01,NULL,100.00,'passed',NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11');
/*!40000 ALTER TABLE `orphan_enrollments` ENABLE KEYS */;
DROP TABLE IF EXISTS `orphans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `orphans` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `widow_id` bigint unsigned NOT NULL,
  `first_name` varchar(120) DEFAULT NULL,
  `last_name` varchar(120) DEFAULT NULL,
  `gender` enum('male','female') NOT NULL,
  `birth_date` date DEFAULT NULL,
  `education_level_id` bigint unsigned DEFAULT NULL,
  `health_status` varchar(200) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `cin` varchar(30) DEFAULT NULL,
  `is_working` tinyint(1) NOT NULL DEFAULT 0,
  `work_type` varchar(120) DEFAULT NULL,
  `is_work_permanent` tinyint(1) NOT NULL DEFAULT 0,
  `is_married` tinyint(1) NOT NULL DEFAULT 0,
  `is_schooled` tinyint(1) NOT NULL DEFAULT 1,
  `masar_code` varchar(30) DEFAULT NULL,
  `is_not_interested` tinyint(1) NOT NULL DEFAULT 0,
  `is_inactive` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `orphans_widow_id_foreign` (`widow_id`),
  KEY `orphans_education_level_id_foreign` (`education_level_id`),
  CONSTRAINT `orphans_education_level_id_foreign` FOREIGN KEY (`education_level_id`) REFERENCES `orphans_education_level` (`id`) ON DELETE SET NULL,
  CONSTRAINT `orphans_widow_id_foreign` FOREIGN KEY (`widow_id`) REFERENCES `widows` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `orphans` DISABLE KEYS */;
INSERT INTO `orphans` (`id`, `widow_id`, `first_name`, `last_name`, `gender`, `birth_date`, `education_level_id`, `health_status`, `phone`, `cin`, `is_working`, `work_type`, `is_work_permanent`, `is_married`, `is_schooled`, `masar_code`, `is_not_interested`, `is_inactive`, `created_at`, `updated_at`, `deleted_at`) VALUES (1,1,'يوسف','الزهراء','male','2020-04-11',3,'ربو مزمن - متابعة شهرية',NULL,NULL,0,NULL,0,0,1,'M000000100',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(2,1,'مريم','الزهراء','female','2014-12-26',8,NULL,NULL,NULL,0,NULL,0,0,1,'M000000101',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(3,2,'مريم','بنعلي','male','2017-01-21',6,NULL,NULL,NULL,0,NULL,0,0,1,'M000000200',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(4,2,'أحمد','بنعلي','female','2012-06-07',11,NULL,NULL,NULL,0,NULL,0,0,1,'M000000201',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(5,2,'سلمى','بنعلي','male','2007-01-21',16,NULL,'0613120086','D505671',0,NULL,0,0,1,'M000000202',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(6,3,'أحمد','الحسني','male','2014-03-31',9,NULL,NULL,NULL,0,NULL,0,0,1,'M000000300',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(7,4,'سلمى','المرابط','male','2011-02-07',12,NULL,NULL,NULL,1,'خياطة منزلية',0,0,0,'M000000400',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(8,4,'إلياس','المرابط','female','2005-12-22',16,NULL,'0691102437','D495900',1,'خياطة منزلية',0,0,0,'M000000401',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(9,5,'إلياس','بوزيان','male','2008-08-13',16,NULL,'0656711303','D114164',0,NULL,0,0,1,'M000000500',1,0,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(10,6,'زكرياء','العلوي','male','2005-04-24',16,NULL,'0611192353','D578469',0,NULL,0,0,1,'M000000600',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(11,6,'خديجة','العلوي','female','2017-03-16',6,NULL,NULL,NULL,0,NULL,0,0,1,'M000000601',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(12,6,'عمر','العلوي','male','2012-04-19',11,NULL,NULL,NULL,0,NULL,0,0,1,'M000000602',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(13,7,'خديجة','الإدريسي','male','2019-03-07',4,'ربو مزمن - متابعة شهرية',NULL,NULL,0,NULL,0,0,1,'M000000700',0,1,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(14,7,'عمر','الإدريسي','female','2014-02-18',9,NULL,NULL,NULL,0,NULL,0,0,1,'M000000701',0,1,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(15,8,'عمر','التازي','male','2016-04-03',7,NULL,NULL,NULL,0,NULL,0,0,1,'M000000800',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(16,9,'هاجر','بنجلون','male','2012-12-09',10,NULL,NULL,NULL,0,NULL,0,0,1,'M000000900',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(17,9,'أيوب','بنجلون','female','2008-02-15',16,NULL,'0644105178','D124059',0,NULL,0,0,1,'M000000901',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(18,10,'أيوب','الوردي','male','2010-03-07',13,NULL,NULL,NULL,0,NULL,0,1,0,'M000001000',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(19,11,'نور','الفاسي','male','2007-06-24',16,NULL,'0620766110','D615973',0,NULL,0,0,1,'M000001100',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(20,11,'حمزة','الفاسي','female','2019-04-03',4,NULL,NULL,NULL,0,NULL,0,0,1,'M000001101',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(21,12,'حمزة','بركة','male','2004-04-22',16,NULL,'0682946058','D384388',0,NULL,0,0,1,'M000001200',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(22,12,'يوسف','بركة','female','2016-05-24',7,NULL,NULL,NULL,0,NULL,0,0,1,'M000001201',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(23,12,'مريم','بركة','male','2011-05-02',12,NULL,NULL,NULL,0,NULL,0,0,1,'M000001202',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(24,12,'أحمد','بركة','female','2006-02-21',16,NULL,'0693917924','D651404',0,NULL,0,0,1,'M000001203',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(25,13,'يوسف','الصقلي','male','2018-02-25',5,'ربو مزمن - متابعة شهرية',NULL,NULL,0,NULL,0,0,1,'M000001300',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(26,13,'مريم','الصقلي','female','2013-02-22',10,NULL,NULL,NULL,0,NULL,0,0,1,'M000001301',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(27,14,'مريم','العمراني','male','2015-01-04',8,NULL,NULL,NULL,0,NULL,0,0,1,'M000001400',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(28,14,'أحمد','العمراني','female','2010-05-15',13,NULL,NULL,NULL,0,NULL,0,0,1,'M000001401',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(29,14,'سلمى','العمراني','male','2004-11-19',16,NULL,'0640544419','D394904',0,NULL,0,0,1,'M000001402',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(30,15,'أحمد','الحداد','male','2012-06-06',11,NULL,NULL,NULL,1,'تنظيف',0,0,1,'M000001500',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(31,16,'سلمى','الرامي','male','2009-08-07',14,NULL,NULL,NULL,0,NULL,0,0,1,'M000001600',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(32,16,'إلياس','الرامي','female','2004-01-22',16,NULL,'0636535459','D902055',0,NULL,0,0,1,'M000001601',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(33,17,'إلياس','الشامي','male','2005-12-03',16,NULL,'0655215004','D983134',0,NULL,0,0,1,'M000001700',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(34,17,'زكرياء','الشامي','female','2018-03-12',5,NULL,NULL,NULL,0,NULL,0,0,1,'M000001701',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(35,17,'خديجة','الشامي','male','2013-05-15',10,NULL,NULL,NULL,0,NULL,0,0,1,'M000001702',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(36,18,'زكرياء','بنعمر','male','2019-11-19',3,NULL,NULL,NULL,0,NULL,0,0,1,'M000001800',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(37,18,'خديجة','بنعمر','female','2015-05-30',8,NULL,NULL,NULL,0,NULL,0,0,1,'M000001801',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(38,19,'خديجة','الكتاني','male','2016-12-27',6,'ربو مزمن - متابعة شهرية',NULL,NULL,0,NULL,0,0,1,'M000001900',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(39,20,'عمر','السباعي','male','2014-07-31',9,NULL,NULL,NULL,0,NULL,0,0,1,'M000002000',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(40,20,'هاجر','السباعي','female','2009-01-13',14,NULL,NULL,NULL,0,NULL,0,0,1,'M000002001',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(41,20,'أيوب','السباعي','male','2004-08-05',16,NULL,'0698601474','D444538',0,NULL,0,0,1,'M000002002',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(42,21,'هاجر','المنصوري','male','2010-12-18',12,NULL,NULL,NULL,0,NULL,0,0,1,'M000002100',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(43,21,'أيوب','المنصوري','female','2006-08-07',16,NULL,'0646840323','D934683',0,NULL,0,0,1,'M000002101',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(44,22,'أيوب','بلحاج','male','2008-05-05',16,NULL,'0644933099','D811714',0,NULL,0,0,1,'M000002200',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(45,22,'نور','بلحاج','female','2020-08-30',3,NULL,NULL,NULL,0,NULL,0,0,1,'M000002201',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(46,22,'حمزة','بلحاج','male','2015-08-10',8,NULL,NULL,NULL,0,NULL,0,0,1,'M000002202',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(47,22,'يوسف','بلحاج','female','2009-11-30',13,NULL,NULL,NULL,0,NULL,0,0,1,'M000002203',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(48,23,'نور','الغزواني','male','2004-11-29',16,NULL,'0646011230','D542249',0,NULL,0,0,1,'M000002300',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(49,24,'حمزة','الرگراگي','male','2019-05-27',4,NULL,NULL,NULL,1,'بيع منتجات منزلية',0,0,1,'M000002400',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(50,24,'يوسف','الرگراگي','female','2013-11-21',9,NULL,NULL,NULL,1,'بيع منتجات منزلية',0,0,1,'M000002401',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(51,25,'يوسف','أوبيهي','male','2016-07-01',7,'ربو مزمن - متابعة شهرية',NULL,NULL,0,NULL,0,0,1,'M000002500',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(52,25,'مريم','أوبيهي','female','2011-08-28',12,NULL,NULL,NULL,0,NULL,0,0,1,'M000002501',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(53,25,'أحمد','أوبيهي','male','2006-09-09',16,NULL,'0610815657','D323657',0,NULL,0,0,1,'M000002502',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL);
/*!40000 ALTER TABLE `orphans` ENABLE KEYS */;
DROP TABLE IF EXISTS `orphans_education_level`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `orphans_education_level` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name_ar` varchar(100) NOT NULL,
  `name_en` varchar(100) DEFAULT NULL,
  `sort_order` int NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `orphans_education_level` DISABLE KEYS */;
INSERT INTO `orphans_education_level` (`id`, `name_ar`, `name_en`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES (1,'لم يلتحق بالمدرسة','Not Enrolled',1,1,'2026-09-10 19:26:10','2026-09-10 19:26:10'),
(2,'روضة أطفال','Kindergarten',2,1,'2026-09-10 19:26:10','2026-09-10 19:26:10'),
(3,'الصف الأول الابتدائي','First Grade',3,1,'2026-09-10 19:26:10','2026-09-10 19:26:10'),
(4,'الصف الثاني الابتدائي','Second Grade',4,1,'2026-09-10 19:26:10','2026-09-10 19:26:10'),
(5,'الصف الثالث الابتدائي','Third Grade',5,1,'2026-09-10 19:26:10','2026-09-10 19:26:10'),
(6,'الصف الرابع الابتدائي','Fourth Grade',6,1,'2026-09-10 19:26:10','2026-09-10 19:26:10'),
(7,'الصف الخامس الابتدائي','Fifth Grade',7,1,'2026-09-10 19:26:10','2026-09-10 19:26:10'),
(8,'الصف السادس الابتدائي','Sixth Grade',8,1,'2026-09-10 19:26:10','2026-09-10 19:26:10'),
(9,'الصف الأول الإعدادي','Seventh Grade',9,1,'2026-09-10 19:26:10','2026-09-10 19:26:10'),
(10,'الصف الثاني الإعدادي','Eighth Grade',10,1,'2026-09-10 19:26:10','2026-09-10 19:26:10'),
(11,'الصف الثالث الإعدادي','Ninth Grade',11,1,'2026-09-10 19:26:10','2026-09-10 19:26:10'),
(12,'الصف الأول الثانوي','Tenth Grade',12,1,'2026-09-10 19:26:10','2026-09-10 19:26:10'),
(13,'الصف الثاني الثانوي','Eleventh Grade',13,1,'2026-09-10 19:26:10','2026-09-10 19:26:10'),
(14,'الصف الثالث الثانوي','Twelfth Grade',14,1,'2026-09-10 19:26:10','2026-09-10 19:26:10'),
(15,'تخرج من الثانوية','High School Graduate',15,1,'2026-09-10 19:26:10','2026-09-10 19:26:10'),
(16,'جامعي','University',16,1,'2026-09-10 19:26:10','2026-09-10 19:26:10'),
(17,'تخرج من الجامعة','University Graduate',17,1,'2026-09-10 19:26:10','2026-09-10 19:26:10');
/*!40000 ALTER TABLE `orphans_education_level` ENABLE KEYS */;
DROP TABLE IF EXISTS `partner_fields`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `partner_fields` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `label` varchar(120) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `partner_fields_label_unique` (`label`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `partner_fields` DISABLE KEYS */;
INSERT INTO `partner_fields` (`id`, `label`, `created_at`, `updated_at`) VALUES (1,'التغذية','2026-09-10 19:26:11','2026-09-10 19:26:11');
/*!40000 ALTER TABLE `partner_fields` ENABLE KEYS */;
DROP TABLE IF EXISTS `partner_subfields`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `partner_subfields` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `field_id` bigint unsigned NOT NULL,
  `label` varchar(120) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `partner_subfields_field_id_label_unique` (`field_id`,`label`),
  CONSTRAINT `partner_subfields_field_id_foreign` FOREIGN KEY (`field_id`) REFERENCES `partner_fields` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `partner_subfields` DISABLE KEYS */;
INSERT INTO `partner_subfields` (`id`, `field_id`, `label`, `created_at`, `updated_at`) VALUES (1,1,'مواد غذائية','2026-09-10 19:26:11','2026-09-10 19:26:11');
/*!40000 ALTER TABLE `partner_subfields` ENABLE KEYS */;
DROP TABLE IF EXISTS `partners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `partners` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(120) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `email` varchar(120) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `field_id` bigint unsigned DEFAULT NULL,
  `subfield_id` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `partners_name_unique` (`name`),
  KEY `partners_field_id_foreign` (`field_id`),
  KEY `partners_subfield_id_foreign` (`subfield_id`),
  CONSTRAINT `partners_field_id_foreign` FOREIGN KEY (`field_id`) REFERENCES `partner_fields` (`id`),
  CONSTRAINT `partners_subfield_id_foreign` FOREIGN KEY (`subfield_id`) REFERENCES `partner_subfields` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `partners` DISABLE KEYS */;
INSERT INTO `partners` (`id`, `name`, `phone`, `email`, `address`, `field_id`, `subfield_id`, `created_at`, `updated_at`) VALUES (1,'جمعية الإحسان','0522334455',NULL,NULL,1,1,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(2,'مؤسسة الخير','0522667788',NULL,NULL,1,1,'2026-09-10 19:26:11','2026-09-10 19:26:11');
/*!40000 ALTER TABLE `partners` ENABLE KEYS */;
DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
DROP TABLE IF EXISTS `personal_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint unsigned NOT NULL,
  `name` text NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  KEY `personal_access_tokens_expires_at_index` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `personal_access_tokens` DISABLE KEYS */;
INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES (1,'App\\Models\\User',1,'curl/8.5.0','7d23215f8bdbb9127a2520f2bb565b0a82626ebc3fbc02317f633082bf545266','[\"*\"]','2026-09-10 19:26:27',NULL,'2026-09-10 19:26:23','2026-09-10 19:26:27');
/*!40000 ALTER TABLE `personal_access_tokens` ENABLE KEYS */;
DROP TABLE IF EXISTS `schools`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `schools` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `type` varchar(20) NOT NULL DEFAULT 'school',
  `is_private` tinyint(1) NOT NULL DEFAULT 0,
  `is_amaso_linked` tinyint(1) NOT NULL DEFAULT 0,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `schools_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `schools` DISABLE KEYS */;
INSERT INTO `schools` (`id`, `name`, `type`, `is_private`, `is_amaso_linked`, `notes`, `created_at`, `updated_at`) VALUES (1,'مدرسة الأمل الابتدائية','school',0,0,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(2,'مدرسة النور الخاصة','school',1,1,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(3,'إعدادية الفتح','school',0,0,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(4,'ثانوية النهضة','school',0,0,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(5,'كلية العلوم - جامعة ابن زهر','university',0,0,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(6,'المعهد العالي للتكنولوجيا التطبيقية','university',1,0,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11');
/*!40000 ALTER TABLE `schools` ENABLE KEYS */;
DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings` (
  `key` varchar(100) NOT NULL,
  `value` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
DROP TABLE IF EXISTS `skills`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `skills` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `label` varchar(120) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `skills_label_unique` (`label`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `skills` DISABLE KEYS */;
INSERT INTO `skills` (`id`, `label`, `created_at`, `updated_at`) VALUES (1,'خياطة','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(2,'طبخ','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(3,'تنظيف','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(4,'تدريس','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(5,'أشغال يدوية','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(6,'حياكة','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(7,'تطريز','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(8,'حلاقة نسائية','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(9,'ماكياج','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(10,'حاسوب','2026-09-10 19:26:10','2026-09-10 19:26:10');
/*!40000 ALTER TABLE `skills` ENABLE KEYS */;
DROP TABLE IF EXISTS `transfers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `transfers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `fiscal_year_id` bigint unsigned NOT NULL,
  `transfer_date` date NOT NULL,
  `from_account_id` bigint unsigned NOT NULL,
  `to_account_id` bigint unsigned NOT NULL,
  `amount` decimal(16,2) NOT NULL,
  `remarks` text DEFAULT NULL,
  `status` enum('Draft','Approved') NOT NULL DEFAULT 'Draft',
  `created_by` bigint unsigned DEFAULT NULL,
  `approved_by` bigint unsigned DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `transfers_fiscal_year_id_foreign` (`fiscal_year_id`),
  KEY `transfers_from_account_id_foreign` (`from_account_id`),
  KEY `transfers_to_account_id_foreign` (`to_account_id`),
  KEY `transfers_created_by_foreign` (`created_by`),
  KEY `transfers_approved_by_foreign` (`approved_by`),
  CONSTRAINT `transfers_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`),
  CONSTRAINT `transfers_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `transfers_fiscal_year_id_foreign` FOREIGN KEY (`fiscal_year_id`) REFERENCES `fiscal_years` (`id`),
  CONSTRAINT `transfers_from_account_id_foreign` FOREIGN KEY (`from_account_id`) REFERENCES `bank_accounts` (`id`),
  CONSTRAINT `transfers_to_account_id_foreign` FOREIGN KEY (`to_account_id`) REFERENCES `bank_accounts` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `transfers` DISABLE KEYS */;
INSERT INTO `transfers` (`id`, `fiscal_year_id`, `transfer_date`, `from_account_id`, `to_account_id`, `amount`, `remarks`, `status`, `created_by`, `approved_by`, `approved_at`, `created_at`, `updated_at`) VALUES (1,1,'2026-09-06',1,2,6000.00,'تغطية مستحقات الكفالات الشهرية','Approved',1,1,'2026-09-10 19:26:12','2026-09-10 19:26:12','2026-09-10 19:26:12'),
(2,1,'2026-09-10',2,1,1500.00,'إرجاع فائض الشهر الماضي','Draft',1,NULL,NULL,'2026-09-10 19:26:12','2026-09-10 19:26:12');
/*!40000 ALTER TABLE `transfers` ENABLE KEYS */;
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `role` varchar(30) NOT NULL DEFAULT 'social_worker',
  `phone` varchar(30) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `last_login_at` timestamp NULL DEFAULT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` (`id`, `name`, `email`, `role`, `phone`, `address`, `is_active`, `last_login_at`, `email_verified_at`, `password`, `remember_token`, `created_at`, `updated_at`) VALUES (1,'بنصديق محمد','admin@amaso.org','admin',NULL,NULL,1,'2026-09-10 19:26:23','2026-09-10 19:26:10','$2y$12$zwkQKQZB5yJFGY2fASI9le8nATlBxcX2aiI89KJSDp/o9UdxnmaoK',NULL,'2026-09-10 19:26:10','2026-09-10 19:26:23'),
(2,'سارة المحاسبة','accountant@amaso.org','accountant',NULL,NULL,1,NULL,'2026-09-10 19:26:10','$2y$12$1OYsnuj2uERiX7uv0XpnM.tAsDWSF4j7Gz17LM/SGUuc.QQTaNF.i',NULL,'2026-09-10 19:26:10','2026-09-10 19:26:10'),
(3,'أحمد الأخصائي','social@amaso.org','social_worker',NULL,NULL,1,NULL,'2026-09-10 19:26:10','$2y$12$ulnSBez/oGdhGmWBh7PM3OSETTF.uJhLjW.St8ScmBoFbqBK0q3h.',NULL,'2026-09-10 19:26:10','2026-09-10 19:26:10');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
DROP TABLE IF EXISTS `v_current_cash`;
/*!50001 DROP VIEW IF EXISTS `v_current_cash`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
/*!50001 CREATE VIEW `v_current_cash` AS SELECT
 1 AS `current_cash` */;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `widow_aid`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `widow_aid` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `widow_id` bigint unsigned NOT NULL,
  `aid_type_id` bigint unsigned NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `widow_aid_widow_id_aid_type_id_unique` (`widow_id`,`aid_type_id`),
  KEY `widow_aid_aid_type_id_foreign` (`aid_type_id`),
  CONSTRAINT `widow_aid_aid_type_id_foreign` FOREIGN KEY (`aid_type_id`) REFERENCES `aid_types` (`id`),
  CONSTRAINT `widow_aid_widow_id_foreign` FOREIGN KEY (`widow_id`) REFERENCES `widows` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `widow_aid` DISABLE KEYS */;
INSERT INTO `widow_aid` (`id`, `widow_id`, `aid_type_id`, `is_active`, `created_at`, `updated_at`) VALUES (1,1,1,1,NULL,NULL),
(2,1,4,1,NULL,NULL),
(3,1,6,1,NULL,NULL),
(4,2,2,1,NULL,NULL),
(5,3,3,1,NULL,NULL),
(6,3,6,1,NULL,NULL),
(7,4,4,1,NULL,NULL),
(8,5,5,1,NULL,NULL),
(9,5,8,1,NULL,NULL),
(10,6,6,1,NULL,NULL),
(11,6,3,1,NULL,NULL),
(12,7,7,1,NULL,NULL),
(13,7,2,1,NULL,NULL),
(14,8,8,1,NULL,NULL),
(15,9,1,1,NULL,NULL),
(16,9,4,1,NULL,NULL),
(17,10,2,1,NULL,NULL),
(18,11,3,1,NULL,NULL),
(19,11,6,1,NULL,NULL),
(20,11,8,1,NULL,NULL),
(21,12,4,1,NULL,NULL),
(22,13,5,1,NULL,NULL),
(23,13,8,1,NULL,NULL),
(24,14,6,1,NULL,NULL),
(25,15,7,1,NULL,NULL),
(26,15,2,1,NULL,NULL),
(27,16,8,1,NULL,NULL),
(28,16,5,1,NULL,NULL),
(29,17,1,1,NULL,NULL),
(30,17,4,1,NULL,NULL),
(31,18,2,1,NULL,NULL),
(32,19,3,1,NULL,NULL),
(33,19,6,1,NULL,NULL),
(34,20,4,1,NULL,NULL),
(35,21,5,1,NULL,NULL),
(36,21,8,1,NULL,NULL),
(37,21,2,1,NULL,NULL),
(38,22,6,1,NULL,NULL),
(39,23,7,1,NULL,NULL),
(40,23,2,1,NULL,NULL),
(41,24,8,1,NULL,NULL),
(42,25,1,1,NULL,NULL),
(43,25,4,1,NULL,NULL),
(44,26,2,1,NULL,NULL),
(45,26,7,1,NULL,NULL);
/*!40000 ALTER TABLE `widow_aid` ENABLE KEYS */;
DROP TABLE IF EXISTS `widow_expense_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `widow_expense_categories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `widow_expense_categories` DISABLE KEYS */;
INSERT INTO `widow_expense_categories` (`id`, `name`, `created_at`, `updated_at`) VALUES (1,'إيجار','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(2,'طعام','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(3,'دواء','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(4,'تعليم','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(5,'فواتير','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(6,'مواصلات','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(7,'ملابس','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(8,'مستلزمات منزلية','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(9,'رعاية صحية','2026-09-10 19:26:10','2026-09-10 19:26:10');
/*!40000 ALTER TABLE `widow_expense_categories` ENABLE KEYS */;
DROP TABLE IF EXISTS `widow_files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `widow_files` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `widow_id` bigint unsigned NOT NULL,
  `social_situation` enum('single','widow','divorced','remarried') NOT NULL,
  `has_chronic_disease` tinyint(1) NOT NULL DEFAULT 0,
  `has_maouna` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `widow_files_widow_id_foreign` (`widow_id`),
  CONSTRAINT `widow_files_widow_id_foreign` FOREIGN KEY (`widow_id`) REFERENCES `widows` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `widow_files` DISABLE KEYS */;
INSERT INTO `widow_files` (`id`, `widow_id`, `social_situation`, `has_chronic_disease`, `has_maouna`, `created_at`, `updated_at`) VALUES (1,1,'widow',1,1,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(2,2,'widow',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(3,3,'widow',0,1,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(4,4,'widow',1,0,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(5,5,'widow',0,1,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(6,6,'widow',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(7,7,'widow',1,1,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(8,8,'widow',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(9,9,'widow',0,1,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(10,10,'widow',1,0,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(11,11,'widow',0,1,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(12,12,'widow',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(13,13,'widow',1,1,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(14,14,'widow',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(15,15,'widow',0,1,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(16,16,'widow',1,0,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(17,17,'widow',0,1,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(18,18,'widow',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(19,19,'widow',1,1,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(20,20,'widow',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(21,21,'widow',0,1,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(22,22,'widow',1,0,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(23,23,'widow',0,1,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(24,24,'widow',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(25,25,'widow',1,1,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(26,26,'widow',0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11');
/*!40000 ALTER TABLE `widow_files` ENABLE KEYS */;
DROP TABLE IF EXISTS `widow_illness`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `widow_illness` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `widow_id` bigint unsigned NOT NULL,
  `illness_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `widow_illness_widow_id_illness_id_unique` (`widow_id`,`illness_id`),
  KEY `widow_illness_illness_id_foreign` (`illness_id`),
  CONSTRAINT `widow_illness_illness_id_foreign` FOREIGN KEY (`illness_id`) REFERENCES `illnesses` (`id`),
  CONSTRAINT `widow_illness_widow_id_foreign` FOREIGN KEY (`widow_id`) REFERENCES `widows` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `widow_illness` DISABLE KEYS */;
INSERT INTO `widow_illness` (`id`, `widow_id`, `illness_id`, `created_at`, `updated_at`) VALUES (1,1,6,NULL,NULL),
(2,2,5,NULL,NULL),
(3,3,1,NULL,NULL),
(4,4,7,NULL,NULL),
(5,5,2,NULL,NULL),
(6,6,9,NULL,NULL),
(7,7,8,NULL,NULL),
(8,8,3,NULL,NULL),
(9,9,4,NULL,NULL),
(10,10,6,NULL,NULL),
(11,11,5,NULL,NULL),
(12,12,1,NULL,NULL),
(13,13,7,NULL,NULL),
(14,14,2,NULL,NULL),
(15,15,9,NULL,NULL),
(16,16,8,NULL,NULL),
(17,17,3,NULL,NULL),
(18,18,4,NULL,NULL),
(19,19,6,NULL,NULL),
(20,20,5,NULL,NULL),
(21,21,1,NULL,NULL),
(22,22,7,NULL,NULL),
(23,23,2,NULL,NULL),
(24,24,9,NULL,NULL),
(25,25,8,NULL,NULL),
(26,26,3,NULL,NULL);
/*!40000 ALTER TABLE `widow_illness` ENABLE KEYS */;
DROP TABLE IF EXISTS `widow_income_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `widow_income_categories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `widow_income_categories` DISABLE KEYS */;
INSERT INTO `widow_income_categories` (`id`, `name`, `created_at`, `updated_at`) VALUES (1,'راتب','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(2,'معاش','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(3,'مساعدة','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(4,'تجارة','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(5,'عمل حر','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(6,'تبرعات','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(7,'إيجار عقار','2026-09-10 19:26:10','2026-09-10 19:26:10'),
(8,'حرفة','2026-09-10 19:26:10','2026-09-10 19:26:10');
/*!40000 ALTER TABLE `widow_income_categories` ENABLE KEYS */;
DROP TABLE IF EXISTS `widow_maouna`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `widow_maouna` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `widow_id` bigint unsigned NOT NULL,
  `partner_id` bigint unsigned NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `widow_maouna_widow_id_foreign` (`widow_id`),
  KEY `widow_maouna_partner_id_foreign` (`partner_id`),
  CONSTRAINT `widow_maouna_partner_id_foreign` FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`),
  CONSTRAINT `widow_maouna_widow_id_foreign` FOREIGN KEY (`widow_id`) REFERENCES `widows` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `widow_maouna` DISABLE KEYS */;
INSERT INTO `widow_maouna` (`id`, `widow_id`, `partner_id`, `amount`, `is_active`, `created_at`, `updated_at`) VALUES (1,1,1,490.00,1,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(2,3,1,346.00,1,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(3,5,1,324.00,1,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(4,7,1,223.00,1,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(5,9,1,406.00,1,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(6,11,1,335.00,1,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(7,13,1,353.00,1,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(8,15,1,213.00,1,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(9,17,1,496.00,1,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(10,19,1,403.00,1,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(11,21,1,257.00,1,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(12,23,1,408.00,1,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(13,25,1,335.00,1,'2026-09-10 19:26:11','2026-09-10 19:26:11');
/*!40000 ALTER TABLE `widow_maouna` ENABLE KEYS */;
DROP TABLE IF EXISTS `widow_phones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `widow_phones` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `widow_id` bigint unsigned NOT NULL,
  `phone` varchar(30) NOT NULL,
  `label` varchar(60) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `widow_phones_widow_id_foreign` (`widow_id`),
  CONSTRAINT `widow_phones_widow_id_foreign` FOREIGN KEY (`widow_id`) REFERENCES `widows` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `widow_phones` DISABLE KEYS */;
INSERT INTO `widow_phones` (`id`, `widow_id`, `phone`, `label`, `created_at`, `updated_at`) VALUES (1,1,'0558962577','هاتف الجيران','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(2,4,'0565329914','هاتف الجيران','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(3,7,'0557170177','هاتف الجيران','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(4,10,'0576612109','هاتف الجيران','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(5,13,'0574874966','هاتف الجيران','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(6,16,'0551603904','هاتف الجيران','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(7,19,'0594761405','هاتف الجيران','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(8,22,'0540406893','هاتف الجيران','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(9,25,'0565839632','هاتف الجيران','2026-09-10 19:26:11','2026-09-10 19:26:11');
/*!40000 ALTER TABLE `widow_phones` ENABLE KEYS */;
DROP TABLE IF EXISTS `widow_skill`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `widow_skill` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `widow_id` bigint unsigned NOT NULL,
  `skill_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `widow_skill_widow_id_skill_id_unique` (`widow_id`,`skill_id`),
  KEY `widow_skill_skill_id_foreign` (`skill_id`),
  CONSTRAINT `widow_skill_skill_id_foreign` FOREIGN KEY (`skill_id`) REFERENCES `skills` (`id`),
  CONSTRAINT `widow_skill_widow_id_foreign` FOREIGN KEY (`widow_id`) REFERENCES `widows` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `widow_skill` DISABLE KEYS */;
INSERT INTO `widow_skill` (`id`, `widow_id`, `skill_id`, `created_at`, `updated_at`) VALUES (1,1,5,NULL,NULL),
(2,2,4,NULL,NULL),
(3,3,7,NULL,NULL),
(4,4,3,NULL,NULL),
(5,5,10,NULL,NULL),
(6,6,8,NULL,NULL),
(7,7,6,NULL,NULL),
(8,8,1,NULL,NULL),
(9,9,2,NULL,NULL),
(10,10,9,NULL,NULL),
(11,11,5,NULL,NULL),
(12,12,4,NULL,NULL),
(13,13,7,NULL,NULL),
(14,14,3,NULL,NULL),
(15,15,10,NULL,NULL),
(16,16,8,NULL,NULL),
(17,17,6,NULL,NULL),
(18,18,1,NULL,NULL),
(19,19,2,NULL,NULL),
(20,20,9,NULL,NULL),
(21,21,5,NULL,NULL),
(22,22,4,NULL,NULL),
(23,23,7,NULL,NULL),
(24,24,3,NULL,NULL),
(25,25,10,NULL,NULL),
(26,26,8,NULL,NULL);
/*!40000 ALTER TABLE `widow_skill` ENABLE KEYS */;
DROP TABLE IF EXISTS `widow_social`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `widow_social` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `widow_id` bigint unsigned NOT NULL,
  `housing_type_id` bigint unsigned NOT NULL,
  `housing_status` enum('owned','rented','free') NOT NULL,
  `has_water` tinyint(1) NOT NULL DEFAULT 0,
  `has_electricity` tinyint(1) NOT NULL DEFAULT 0,
  `has_furniture` int NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `widow_social_widow_id_foreign` (`widow_id`),
  KEY `widow_social_housing_type_id_foreign` (`housing_type_id`),
  CONSTRAINT `widow_social_housing_type_id_foreign` FOREIGN KEY (`housing_type_id`) REFERENCES `housing_types` (`id`),
  CONSTRAINT `widow_social_widow_id_foreign` FOREIGN KEY (`widow_id`) REFERENCES `widows` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `widow_social` DISABLE KEYS */;
INSERT INTO `widow_social` (`id`, `widow_id`, `housing_type_id`, `housing_status`, `has_water`, `has_electricity`, `has_furniture`, `created_at`, `updated_at`) VALUES (1,1,1,'rented',0,0,0,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(2,2,2,'owned',1,1,1,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(3,3,3,'free',1,1,2,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(4,4,4,'rented',1,1,3,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(5,5,5,'owned',1,1,4,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(6,6,1,'free',0,1,5,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(7,7,2,'rented',1,1,0,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(8,8,3,'owned',1,0,1,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(9,9,4,'free',1,1,2,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(10,10,5,'rented',1,1,3,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(11,11,1,'owned',0,1,4,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(12,12,2,'free',1,1,5,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(13,13,3,'rented',1,1,0,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(14,14,4,'owned',1,1,1,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(15,15,5,'free',1,0,2,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(16,16,1,'rented',0,1,3,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(17,17,2,'owned',1,1,4,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(18,18,3,'free',1,1,5,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(19,19,4,'rented',1,1,0,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(20,20,5,'owned',1,1,1,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(21,21,1,'free',0,1,2,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(22,22,2,'rented',1,0,3,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(23,23,3,'owned',1,1,4,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(24,24,4,'free',1,1,5,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(25,25,5,'rented',1,1,0,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(26,26,1,'owned',0,1,1,'2026-09-10 19:26:11','2026-09-10 19:26:11');
/*!40000 ALTER TABLE `widow_social` ENABLE KEYS */;
DROP TABLE IF EXISTS `widow_social_expense`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `widow_social_expense` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `widow_id` bigint unsigned NOT NULL,
  `expense_category_id` bigint unsigned NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `remarks` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `widow_social_expense_widow_id_foreign` (`widow_id`),
  KEY `widow_social_expense_expense_category_id_foreign` (`expense_category_id`),
  CONSTRAINT `widow_social_expense_expense_category_id_foreign` FOREIGN KEY (`expense_category_id`) REFERENCES `widow_expense_categories` (`id`),
  CONSTRAINT `widow_social_expense_widow_id_foreign` FOREIGN KEY (`widow_id`) REFERENCES `widows` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=62 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `widow_social_expense` DISABLE KEYS */;
INSERT INTO `widow_social_expense` (`id`, `widow_id`, `expense_category_id`, `amount`, `remarks`, `created_at`, `updated_at`) VALUES (1,1,2,1000.00,'مصاريف التغذية','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(2,1,1,700.00,'كراء السكن','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(3,1,3,150.00,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(4,2,2,1250.00,'مصاريف التغذية','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(5,2,4,300.00,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(6,3,2,750.00,'مصاريف التغذية','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(7,3,5,220.00,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(8,4,2,1000.00,'مصاريف التغذية','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(9,4,1,700.00,'كراء السكن','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(10,4,6,400.00,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(11,5,2,750.00,'مصاريف التغذية','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(12,5,3,150.00,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(13,6,2,1250.00,'مصاريف التغذية','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(14,6,4,300.00,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(15,7,2,1000.00,'مصاريف التغذية','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(16,7,1,700.00,'كراء السكن','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(17,7,5,220.00,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(18,8,2,750.00,'مصاريف التغذية','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(19,8,6,400.00,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(20,9,2,1000.00,'مصاريف التغذية','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(21,9,3,150.00,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(22,10,2,750.00,'مصاريف التغذية','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(23,10,1,700.00,'كراء السكن','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(24,10,4,300.00,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(25,11,2,1000.00,'مصاريف التغذية','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(26,11,5,220.00,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(27,12,2,1500.00,'مصاريف التغذية','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(28,12,6,400.00,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(29,13,2,1000.00,'مصاريف التغذية','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(30,13,1,700.00,'كراء السكن','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(31,13,3,150.00,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(32,14,2,1250.00,'مصاريف التغذية','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(33,14,4,300.00,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(34,15,2,750.00,'مصاريف التغذية','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(35,15,5,220.00,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(36,16,2,1000.00,'مصاريف التغذية','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(37,16,1,700.00,'كراء السكن','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(38,16,6,400.00,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(39,17,2,1250.00,'مصاريف التغذية','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(40,17,3,150.00,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(41,18,2,1000.00,'مصاريف التغذية','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(42,18,4,300.00,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(43,19,2,750.00,'مصاريف التغذية','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(44,19,1,700.00,'كراء السكن','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(45,19,5,220.00,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(46,20,2,1250.00,'مصاريف التغذية','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(47,20,6,400.00,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(48,21,2,1000.00,'مصاريف التغذية','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(49,21,3,150.00,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(50,22,2,1500.00,'مصاريف التغذية','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(51,22,1,700.00,'كراء السكن','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(52,22,4,300.00,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(53,23,2,750.00,'مصاريف التغذية','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(54,23,5,220.00,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(55,24,2,1000.00,'مصاريف التغذية','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(56,24,6,400.00,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(57,25,2,1250.00,'مصاريف التغذية','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(58,25,1,700.00,'كراء السكن','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(59,25,3,150.00,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(60,26,2,500.00,'مصاريف التغذية','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(61,26,4,300.00,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11');
/*!40000 ALTER TABLE `widow_social_expense` ENABLE KEYS */;
DROP TABLE IF EXISTS `widow_social_income`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `widow_social_income` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `widow_id` bigint unsigned NOT NULL,
  `income_category_id` bigint unsigned NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `remarks` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `widow_social_income_widow_id_foreign` (`widow_id`),
  KEY `widow_social_income_income_category_id_foreign` (`income_category_id`),
  CONSTRAINT `widow_social_income_income_category_id_foreign` FOREIGN KEY (`income_category_id`) REFERENCES `widow_income_categories` (`id`),
  CONSTRAINT `widow_social_income_widow_id_foreign` FOREIGN KEY (`widow_id`) REFERENCES `widows` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `widow_social_income` DISABLE KEYS */;
INSERT INTO `widow_social_income` (`id`, `widow_id`, `income_category_id`, `amount`, `remarks`, `created_at`, `updated_at`) VALUES (1,1,1,600.00,'مدخول شهري قار','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(2,1,5,200.00,'عمل موسمي','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(3,2,2,850.00,'مدخول شهري قار','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(4,3,1,400.00,'مدخول شهري قار','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(5,5,1,750.00,'مدخول شهري قار','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(6,6,2,600.00,'مدخول شهري قار','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(7,7,1,850.00,'مدخول شهري قار','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(8,7,5,200.00,'عمل موسمي','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(9,8,2,400.00,'مدخول شهري قار','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(10,9,1,1100.00,'مدخول شهري قار','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(11,10,2,750.00,'مدخول شهري قار','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(12,10,5,200.00,'عمل موسمي','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(13,11,1,600.00,'مدخول شهري قار','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(14,13,1,400.00,'مدخول شهري قار','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(15,13,5,200.00,'عمل موسمي','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(16,14,2,1100.00,'مدخول شهري قار','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(17,15,1,750.00,'مدخول شهري قار','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(18,16,2,600.00,'مدخول شهري قار','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(19,16,5,200.00,'عمل موسمي','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(20,17,1,850.00,'مدخول شهري قار','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(21,18,2,400.00,'مدخول شهري قار','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(22,19,1,1100.00,'مدخول شهري قار','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(23,19,5,200.00,'عمل موسمي','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(24,21,1,600.00,'مدخول شهري قار','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(25,22,2,850.00,'مدخول شهري قار','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(26,22,5,200.00,'عمل موسمي','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(27,23,1,400.00,'مدخول شهري قار','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(28,24,2,1100.00,'مدخول شهري قار','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(29,25,1,750.00,'مدخول شهري قار','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(30,25,5,200.00,'عمل موسمي','2026-09-10 19:26:11','2026-09-10 19:26:11'),
(31,26,2,600.00,'مدخول شهري قار','2026-09-10 19:26:11','2026-09-10 19:26:11');
/*!40000 ALTER TABLE `widow_social_income` ENABLE KEYS */;
DROP TABLE IF EXISTS `widows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `widows` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `first_name` varchar(120) DEFAULT NULL,
  `last_name` varchar(120) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `email` varchar(120) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `neighborhood` varchar(120) DEFAULT NULL,
  `admission_date` date DEFAULT NULL,
  `national_id` varchar(30) DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `marital_status` enum('Single','Widowed','Remarried','Divorced') NOT NULL DEFAULT 'Widowed',
  `family_liaison` varchar(100) DEFAULT NULL,
  `education_level` varchar(100) DEFAULT NULL,
  `disability_flag` tinyint(1) NOT NULL DEFAULT 0,
  `disability_type` varchar(120) DEFAULT NULL,
  `leaving_date` date DEFAULT NULL,
  `leaving_reason` varchar(20) DEFAULT NULL,
  `leaving_details` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `widows` DISABLE KEYS */;
INSERT INTO `widows` (`id`, `first_name`, `last_name`, `phone`, `email`, `address`, `neighborhood`, `admission_date`, `national_id`, `birth_date`, `marital_status`, `family_liaison`, `education_level`, `disability_flag`, `disability_type`, `leaving_date`, `leaving_reason`, `leaving_details`, `created_at`, `updated_at`, `deleted_at`) VALUES (1,'فاطمة','الزهراء','0633719488',NULL,'شارع 0, حي السلام','حي السلام','2024-08-10','DEMO000001','1993-09-10','Widowed','عمة الأيتام','بدون',0,NULL,NULL,NULL,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(2,'خديجة','بنعلي','0616514603',NULL,'شارع 1, حي النور','حي النور','2026-03-10','DEMO000002','1976-09-10','Widowed',NULL,'ابتدائي',0,NULL,NULL,NULL,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(3,'أمينة','الحسني','0691760009',NULL,'شارع 2, حي الأمل','حي الأمل','2026-05-10','DEMO000003','1980-09-10','Widowed',NULL,'إعدادي',0,NULL,NULL,NULL,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(4,'زينب','المرابط','0610158286',NULL,'شارع 3, حي الفتح','حي الفتح','2025-03-10','DEMO000004','1994-09-10','Widowed',NULL,'ثانوي',0,NULL,NULL,NULL,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(5,'سعاد','بوزيان','0615978477',NULL,'شارع 4, حي الرحمة','حي الرحمة','2024-03-10','DEMO000005','1994-09-10','Widowed','عمة الأيتام','جامعي',0,NULL,NULL,NULL,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(6,'نادية','العلوي','0650708333',NULL,'شارع 5, حي السلام','حي السلام','2024-08-10','DEMO000006','1983-09-10','Widowed',NULL,'بدون',0,NULL,NULL,NULL,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(7,'حياة','الإدريسي','0645191352',NULL,'شارع 6, حي النور','حي النور','2026-05-10','DEMO000007','1975-09-10','Widowed',NULL,'ابتدائي',0,NULL,NULL,NULL,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(8,'رشيدة','التازي','0633671177',NULL,'شارع 7, حي الأمل','حي الأمل','2025-09-10','DEMO000008','1992-09-10','Widowed',NULL,'إعدادي',0,NULL,NULL,NULL,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(9,'لطيفة','بنجلون','0657087530',NULL,'شارع 8, حي الفتح','حي الفتح','2025-10-10','DEMO000009','1978-09-10','Widowed','عمة الأيتام','ثانوي',0,NULL,NULL,NULL,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(10,'سميرة','الوردي','0693542454',NULL,'شارع 9, حي الرحمة','حي الرحمة','2025-03-10','DEMO000010','1995-09-10','Widowed',NULL,'جامعي',0,NULL,NULL,NULL,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(11,'كريمة','الفاسي','0656921990',NULL,'شارع 10, حي السلام','حي السلام','2026-02-10','DEMO000011','1985-09-10','Widowed',NULL,'بدون',0,NULL,NULL,NULL,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(12,'نعيمة','بركة','0618776142',NULL,'شارع 11, حي المسيرة','حي المسيرة','2025-09-10','DEMO000012','1982-09-10','Widowed',NULL,'ابتدائي',0,NULL,NULL,NULL,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(13,'حنان','الصقلي','0692829618',NULL,'شارع 12, حي النهضة','حي النهضة','2026-05-10','DEMO000013','1971-09-10','Widowed','عمة الأيتام','إعدادي',1,'إعاقة حركية جزئية',NULL,NULL,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(14,'بشرى','العمراني','0696375460',NULL,'شارع 13, حي الوفاق','حي الوفاق','2025-07-10','DEMO000014','1984-09-10','Widowed',NULL,'ثانوي',0,NULL,NULL,NULL,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(15,'مليكة','الحداد','0696297914',NULL,'شارع 14, حي السلام','حي السلام','2024-09-10','DEMO000015','1990-09-10','Widowed',NULL,'جامعي',0,NULL,NULL,NULL,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(16,'سناء','الرامي','0675550332',NULL,'شارع 15, حي النور','حي النور','2025-04-10','DEMO000016','1986-09-10','Widowed',NULL,'بدون',0,NULL,NULL,NULL,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(17,'وفاء','الشامي','0645118428',NULL,'شارع 16, حي المسيرة','حي المسيرة','2026-01-10','DEMO000017','1974-09-10','Widowed','عمة الأيتام','ابتدائي',0,NULL,NULL,NULL,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(18,'ثريا','بنعمر','0665269985',NULL,'شارع 17, حي الأمل','حي الأمل','2025-02-10','DEMO000018','1983-09-10','Widowed',NULL,'إعدادي',0,NULL,NULL,NULL,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(19,'جميلة','الكتاني','0638485709',NULL,'شارع 18, حي النهضة','حي النهضة','2024-09-10','DEMO000019','1993-09-10','Widowed',NULL,'ثانوي',0,NULL,NULL,NULL,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(20,'رجاء','السباعي','0628032445',NULL,'شارع 19, حي الفتح','حي الفتح','2025-12-10','DEMO000020','1982-09-10','Widowed',NULL,'جامعي',0,NULL,NULL,NULL,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(21,'هدى','المنصوري','0620450544',NULL,'شارع 20, حي الوفاق','حي الوفاق','2024-07-10','DEMO000021','1976-09-10','Widowed','عمة الأيتام','بدون',0,NULL,NULL,NULL,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(22,'أسماء','بلحاج','0692119738',NULL,'شارع 21, حي الرحمة','حي الرحمة','2025-05-10','DEMO000022','1972-09-10','Widowed',NULL,'ابتدائي',0,NULL,NULL,NULL,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(23,'ابتسام','الغزواني','0635148765',NULL,'شارع 22, حي المسيرة','حي المسيرة','2024-10-10','DEMO000023','1989-09-10','Widowed',NULL,'إعدادي',0,NULL,NULL,NULL,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(24,'مينة','الرگراگي','0651997971',NULL,'شارع 23, حي النهضة','حي النهضة','2025-09-10','DEMO000024','1974-09-10','Widowed',NULL,'ثانوي',0,NULL,NULL,NULL,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(25,'فتيحة','أوبيهي','0663392629',NULL,'شارع 24, حي الوفاق','حي الوفاق','2026-04-10','DEMO000025','1990-09-10','Widowed','عمة الأيتام','جامعي',0,NULL,NULL,NULL,NULL,'2026-09-10 19:26:11','2026-09-10 19:26:11',NULL),
(26,'زهور','التمسماني','0641038773',NULL,'شارع 25, حي السلام','حي السلام','2025-07-10','DEMO000026','1994-09-10','Widowed',NULL,'بدون',0,NULL,'2026-09-07','graduated','انتقلت الأسرة إلى مدينة أخرى بعد تحسن وضعها','2026-09-10 19:26:11','2026-09-10 19:26:12','2026-09-10 19:26:12');
/*!40000 ALTER TABLE `widows` ENABLE KEYS */;
/*!50001 DROP VIEW IF EXISTS `v_current_cash`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50001 VIEW `v_current_cash` AS select ifnull(sum(`bank_accounts`.`balance`),0.00) AS `current_cash` from `bank_accounts` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

SET FOREIGN_KEY_CHECKS = 1;
