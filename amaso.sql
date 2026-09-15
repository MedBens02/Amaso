-- AMASO - قاعدة بيانات تجريبية / Demo database
-- جمعية المنصور لكفالة اليتيم
--
-- Generated: 2026-09-15  (by backend/regenerate-demo-sql.sh)
-- Charset:   utf8mb4 / utf8mb4_unicode_ci
--
-- ماذا يحتوي هذا الملف / What this file contains
--   Schema for all 56 tables and the v_current_cash view, plus reference
--   data (categories, budgets, aid types, education levels, kafala chamila
--   split rules) and a full set of FICTIONAL demo records:
--   26 families, 53 orphans, 18 donors, 8 sponsors,
--   3 fiscal years of income and expenses, and
--   3 academic years covering 150 school enrollments with grades.
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

/*M!999999\- enable the sandbox mode */ 
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
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `start_year` smallint(5) unsigned NOT NULL,
  `label` varchar(9) NOT NULL,
  `is_current` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `academic_years_start_year_unique` (`start_year`),
  UNIQUE KEY `academic_years_label_unique` (`label`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `academic_years` WRITE;
/*!40000 ALTER TABLE `academic_years` DISABLE KEYS */;
INSERT INTO `academic_years` VALUES
(1,2026,'2026/2027',1,'2026-09-15 19:05:08','2026-09-15 19:05:08'),
(2,2024,'2024/2025',0,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(3,2025,'2025/2026',0,'2026-09-15 19:05:09','2026-09-15 19:05:09');
/*!40000 ALTER TABLE `academic_years` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `aid_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `aid_types` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `label` varchar(120) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `aid_types_label_unique` (`label`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `aid_types` WRITE;
/*!40000 ALTER TABLE `aid_types` DISABLE KEYS */;
INSERT INTO `aid_types` VALUES
(1,'مساعدة شهرية','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(2,'مساعدة طبية','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(3,'مساعدة تعليمية','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(4,'مساعدة طارئة','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(5,'مساعدة غذائية','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(6,'مساعدة كسوة','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(7,'مساعدة إيجار','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(8,'مساعدة فواتير','2026-09-15 19:05:08','2026-09-15 19:05:08');
/*!40000 ALTER TABLE `aid_types` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `user_name` varchar(150) DEFAULT NULL,
  `action` varchar(40) NOT NULL,
  `entity_type` varchar(60) NOT NULL,
  `entity_id` bigint(20) unsigned DEFAULT NULL,
  `entity_label` varchar(200) DEFAULT NULL,
  `changes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`changes`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `audit_logs_entity_index` (`entity_type`,`entity_id`),
  KEY `audit_logs_user_index` (`user_id`,`created_at`),
  KEY `audit_logs_created_at_index` (`created_at`),
  KEY `audit_logs_action_index` (`action`),
  CONSTRAINT `audit_logs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `bank_account_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `bank_account_transactions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `bank_account_id` bigint(20) unsigned NOT NULL,
  `source_type` varchar(30) NOT NULL,
  `source_id` bigint(20) unsigned DEFAULT NULL,
  `amount` decimal(16,2) NOT NULL,
  `balance_after` decimal(16,2) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `bank_account_transactions_created_by_foreign` (`created_by`),
  KEY `bank_account_transactions_bank_account_id_id_index` (`bank_account_id`,`id`),
  KEY `bank_account_transactions_source_type_source_id_index` (`source_type`,`source_id`),
  CONSTRAINT `bank_account_transactions_bank_account_id_foreign` FOREIGN KEY (`bank_account_id`) REFERENCES `bank_accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `bank_account_transactions_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `bank_account_transactions` WRITE;
/*!40000 ALTER TABLE `bank_account_transactions` DISABLE KEYS */;
INSERT INTO `bank_account_transactions` VALUES
(1,2,'income',24,400.00,20400.00,'اعتماد إيراد بحوالة بنكية',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(2,2,'income',25,400.00,20800.00,'اعتماد إيراد بحوالة بنكية',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(3,2,'expense',1,-750.00,20050.00,'اعتماد مصروف',NULL,'2026-09-15 19:05:10','2026-09-15 19:05:10'),
(4,1,'expense',2,-1200.00,48800.00,'اعتماد مصروف',NULL,'2026-09-15 19:05:10','2026-09-15 19:05:10'),
(5,2,'expense',3,-450.00,19600.00,'اعتماد مصروف',NULL,'2026-09-15 19:05:10','2026-09-15 19:05:10'),
(6,1,'expense',4,-600.00,48200.00,'اعتماد مصروف',NULL,'2026-09-15 19:05:10','2026-09-15 19:05:10'),
(7,2,'expense',5,-900.00,18700.00,'اعتماد مصروف',NULL,'2026-09-15 19:05:10','2026-09-15 19:05:10'),
(8,1,'expense',6,-1350.00,46850.00,'اعتماد مصروف',NULL,'2026-09-15 19:05:10','2026-09-15 19:05:10'),
(9,2,'expense',7,-520.00,18180.00,'اعتماد مصروف',NULL,'2026-09-15 19:05:10','2026-09-15 19:05:10'),
(10,1,'expense',10,-1500.00,45350.00,'اعتماد مصروف',NULL,'2026-09-15 19:05:10','2026-09-15 19:05:10'),
(11,1,'transfer_out',1,-6000.00,39350.00,'تحويل إلى حساب \"حساب الكفالات\"',NULL,'2026-09-15 19:05:10','2026-09-15 19:05:10'),
(12,2,'transfer_in',1,6000.00,24180.00,'تحويل من حساب \"الحساب الرئيسي\"',NULL,'2026-09-15 19:05:10','2026-09-15 19:05:10');
/*!40000 ALTER TABLE `bank_account_transactions` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `bank_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `bank_accounts` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `label` varchar(120) DEFAULT NULL,
  `bank_name` varchar(120) DEFAULT NULL,
  `account_number` varchar(60) DEFAULT NULL,
  `balance` decimal(16,2) NOT NULL DEFAULT 0.00,
  `opening_balance` decimal(15,2) NOT NULL DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `bank_accounts_label_unique` (`label`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `bank_accounts` WRITE;
/*!40000 ALTER TABLE `bank_accounts` DISABLE KEYS */;
INSERT INTO `bank_accounts` VALUES
(1,'الحساب الرئيسي','بنك التجارة','MA-1001',39350.00,50000.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:10'),
(2,'حساب الكفالات','بنك الوفاء','MA-1002',24180.00,20000.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:10');
/*!40000 ALTER TABLE `bank_accounts` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `beneficiaries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `beneficiaries` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `type` enum('Widow','Orphan') NOT NULL,
  `widow_id` bigint(20) unsigned DEFAULT NULL,
  `orphan_id` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_widow` (`widow_id`),
  UNIQUE KEY `uniq_orphan` (`orphan_id`),
  CONSTRAINT `fk_benef_orphan` FOREIGN KEY (`orphan_id`) REFERENCES `orphans` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_benef_widow` FOREIGN KEY (`widow_id`) REFERENCES `widows` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=80 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `beneficiaries` WRITE;
/*!40000 ALTER TABLE `beneficiaries` DISABLE KEYS */;
INSERT INTO `beneficiaries` VALUES
(1,'Widow',1,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(2,'Orphan',NULL,1,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(3,'Orphan',NULL,2,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(4,'Widow',2,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(5,'Orphan',NULL,3,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(6,'Orphan',NULL,4,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(7,'Orphan',NULL,5,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(8,'Widow',3,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(9,'Orphan',NULL,6,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(10,'Widow',4,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(11,'Orphan',NULL,7,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(12,'Orphan',NULL,8,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(13,'Widow',5,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(14,'Orphan',NULL,9,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(15,'Widow',6,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(16,'Orphan',NULL,10,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(17,'Orphan',NULL,11,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(18,'Orphan',NULL,12,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(19,'Widow',7,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(20,'Orphan',NULL,13,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(21,'Orphan',NULL,14,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(22,'Widow',8,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(23,'Orphan',NULL,15,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(24,'Widow',9,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(25,'Orphan',NULL,16,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(26,'Orphan',NULL,17,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(27,'Widow',10,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(28,'Orphan',NULL,18,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(29,'Widow',11,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(30,'Orphan',NULL,19,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(31,'Orphan',NULL,20,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(32,'Widow',12,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(33,'Orphan',NULL,21,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(34,'Orphan',NULL,22,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(35,'Orphan',NULL,23,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(36,'Orphan',NULL,24,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(37,'Widow',13,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(38,'Orphan',NULL,25,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(39,'Orphan',NULL,26,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(40,'Widow',14,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(41,'Orphan',NULL,27,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(42,'Orphan',NULL,28,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(43,'Orphan',NULL,29,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(44,'Widow',15,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(45,'Orphan',NULL,30,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(46,'Widow',16,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(47,'Orphan',NULL,31,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(48,'Orphan',NULL,32,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(49,'Widow',17,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(50,'Orphan',NULL,33,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(51,'Orphan',NULL,34,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(52,'Orphan',NULL,35,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(53,'Widow',18,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(54,'Orphan',NULL,36,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(55,'Orphan',NULL,37,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(56,'Widow',19,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(57,'Orphan',NULL,38,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(58,'Widow',20,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(59,'Orphan',NULL,39,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(60,'Orphan',NULL,40,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(61,'Orphan',NULL,41,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(62,'Widow',21,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(63,'Orphan',NULL,42,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(64,'Orphan',NULL,43,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(65,'Widow',22,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(66,'Orphan',NULL,44,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(67,'Orphan',NULL,45,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(68,'Orphan',NULL,46,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(69,'Orphan',NULL,47,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(70,'Widow',23,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(71,'Orphan',NULL,48,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(72,'Widow',24,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(73,'Orphan',NULL,49,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(74,'Orphan',NULL,50,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(75,'Widow',25,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(76,'Orphan',NULL,51,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(77,'Orphan',NULL,52,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(78,'Orphan',NULL,53,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(79,'Widow',26,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09');
/*!40000 ALTER TABLE `beneficiaries` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `beneficiary_group_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `beneficiary_group_members` (
  `group_id` bigint(20) unsigned NOT NULL,
  `beneficiary_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`group_id`,`beneficiary_id`),
  KEY `idx_bgm_beneficiary_id` (`beneficiary_id`),
  CONSTRAINT `beneficiary_group_members_group_id_foreign` FOREIGN KEY (`group_id`) REFERENCES `beneficiary_groups` (`id`),
  CONSTRAINT `fk_bgm_beneficiaries` FOREIGN KEY (`beneficiary_id`) REFERENCES `beneficiaries` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `beneficiary_group_members` WRITE;
/*!40000 ALTER TABLE `beneficiary_group_members` DISABLE KEYS */;
INSERT INTO `beneficiary_group_members` VALUES
(1,1,'2026-09-15 19:05:10','2026-09-15 19:05:10'),
(1,4,'2026-09-15 19:05:10','2026-09-15 19:05:10'),
(1,8,'2026-09-15 19:05:10','2026-09-15 19:05:10');
/*!40000 ALTER TABLE `beneficiary_group_members` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `beneficiary_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `beneficiary_groups` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `label` varchar(120) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `beneficiary_groups_label_unique` (`label`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `beneficiary_groups` WRITE;
/*!40000 ALTER TABLE `beneficiary_groups` DISABLE KEYS */;
INSERT INTO `beneficiary_groups` VALUES
(1,'مجموعة حي السلام','الأسر المستفيدة في حي السلام','2026-09-15 19:05:10','2026-09-15 19:05:10');
/*!40000 ALTER TABLE `beneficiary_groups` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `budgets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `budgets` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `label` varchar(120) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `budgets` WRITE;
/*!40000 ALTER TABLE `budgets` DISABLE KEYS */;
INSERT INTO `budgets` VALUES
(1,'الرعاية الصحية','2026-09-15 19:05:08','2026-09-15 19:05:08',0),
(2,'التعليم والتدريب','2026-09-15 19:05:08','2026-09-15 19:05:08',0),
(3,'النقل والمواصلات','2026-09-15 19:05:08','2026-09-15 19:05:08',0),
(4,'الإدارة العامة','2026-09-15 19:05:08','2026-09-15 19:05:08',0),
(5,'المساعدات الاجتماعية','2026-09-15 19:05:08','2026-09-15 19:05:08',0),
(6,'البرامج والفعاليات','2026-09-15 19:05:08','2026-09-15 19:05:08',0),
(7,'الميزانية العامة','2026-09-15 19:05:08','2026-09-15 19:05:08',1),
(8,'كفالة شاملة','2026-09-15 19:05:08','2026-09-15 19:05:08',0),
(9,'كفالة شاملة - تسيير','2026-09-15 19:05:08','2026-09-15 19:05:08',0),
(10,'كفالة شاملة - مؤونة','2026-09-15 19:05:08','2026-09-15 19:05:08',0),
(11,'كفالة شاملة - تعليم','2026-09-15 19:05:08','2026-09-15 19:05:08',0),
(12,'كفالة شاملة - صحة','2026-09-15 19:05:08','2026-09-15 19:05:08',0),
(13,'كفالة شاملة - تربية وترفيه','2026-09-15 19:05:08','2026-09-15 19:05:08',0),
(14,'كفالة شاملة - مشاريع','2026-09-15 19:05:08','2026-09-15 19:05:08',0),
(15,'كفالة شاملة - تكوين','2026-09-15 19:05:08','2026-09-15 19:05:08',0);
/*!40000 ALTER TABLE `budgets` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `cache` WRITE;
/*!40000 ALTER TABLE `cache` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `cache_locks` WRITE;
/*!40000 ALTER TABLE `cache_locks` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache_locks` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `donors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `donors` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
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

LOCK TABLES `donors` WRITE;
/*!40000 ALTER TABLE `donors` DISABLE KEYS */;
INSERT INTO `donors` VALUES
(1,'عبد الكريم','الودغيري','0644641312','عبد الكريم.الودغيري@example.com',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:10',1,1070.00),
(2,'خالد','بنموسى','0641684594','خالد.بنموسى@example.com',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:10',1,3020.00),
(3,'ياسمين','الشرقاوي','0689979428','ياسمين.الشرقاوي@example.com',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:10',1,3040.00),
(4,'محمد','الغالي','0629822262','محمد.الغالي@example.com',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:10',1,2120.00),
(5,'سارة','أمين','0679614757','سارة.أمين@example.com',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09',1,2300.00),
(6,'عثمان','الفيلالي','0653256946','عثمان.الفيلالي@example.com',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09',1,700.00),
(7,'ليلى','حمداوي','0670214376','ليلى.حمداوي@example.com',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09',1,1800.00),
(8,'طارق','بوستة','0640446024','طارق.بوستة@example.com',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09',1,900.00),
(9,'رشيد','العلمي','0621342653','رشيد.العلمي@example.com',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09',0,500.00),
(10,'نبيلة','بنكيران','0619183755','نبيلة.بنكيران@example.com',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:10',0,1400.00),
(11,'يوسف','الحلو','0683265153','يوسف.الحلو@example.com',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:10',0,1160.00),
(12,'سلمى','برادة','0614239549','سلمى.برادة@example.com',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:10',0,2750.00),
(13,'إدريس','المكاوي','0612184252','إدريس.المكاوي@example.com',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:10',0,1570.00),
(14,'غزلان','الطاهري','0633346004','غزلان.الطاهري@example.com',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:10',0,2120.00),
(15,'أنس','زروال','0632381376','أنس.زروال@example.com',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:10',0,940.00),
(16,'سميرة','القادري','0633927860','سميرة.القادري@example.com',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:10',0,2420.00),
(17,'مصطفى','العروسي','0676043080','مصطفى.العروسي@example.com',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:10',0,1360.00),
(18,'نزهة','بنشقرون','0612166127','نزهة.بنشقرون@example.com',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:10',0,2750.00);
/*!40000 ALTER TABLE `donors` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `expense_beneficiaries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `expense_beneficiaries` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `expense_id` bigint(20) unsigned NOT NULL,
  `beneficiary_id` bigint(20) unsigned DEFAULT NULL,
  `group_id` bigint(20) unsigned DEFAULT NULL,
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

LOCK TABLES `expense_beneficiaries` WRITE;
/*!40000 ALTER TABLE `expense_beneficiaries` DISABLE KEYS */;
INSERT INTO `expense_beneficiaries` VALUES
(1,1,13,NULL,750.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(2,2,24,NULL,1200.00,NULL,'2026-09-15 19:05:10','2026-09-15 19:05:10'),
(3,3,37,NULL,450.00,NULL,'2026-09-15 19:05:10','2026-09-15 19:05:10'),
(4,4,49,NULL,600.00,NULL,'2026-09-15 19:05:10','2026-09-15 19:05:10'),
(5,5,62,NULL,900.00,NULL,'2026-09-15 19:05:10','2026-09-15 19:05:10'),
(6,6,75,NULL,1350.00,NULL,'2026-09-15 19:05:10','2026-09-15 19:05:10'),
(7,7,8,NULL,520.00,NULL,'2026-09-15 19:05:10','2026-09-15 19:05:10'),
(8,8,19,NULL,680.00,NULL,'2026-09-15 19:05:10','2026-09-15 19:05:10'),
(9,9,29,NULL,1050.00,NULL,'2026-09-15 19:05:10','2026-09-15 19:05:10'),
(10,11,15,NULL,770.00,NULL,'2026-09-15 19:05:10','2026-09-15 19:05:10'),
(11,12,24,NULL,280.00,NULL,'2026-09-15 19:05:10','2026-09-15 19:05:10'),
(12,13,32,NULL,630.00,NULL,'2026-09-15 19:05:10','2026-09-15 19:05:10'),
(13,14,44,NULL,450.00,NULL,'2026-09-15 19:05:10','2026-09-15 19:05:10'),
(14,15,53,NULL,770.00,NULL,'2026-09-15 19:05:10','2026-09-15 19:05:10'),
(15,16,62,NULL,280.00,NULL,'2026-09-15 19:05:10','2026-09-15 19:05:10'),
(16,17,72,NULL,630.00,NULL,'2026-09-15 19:05:10','2026-09-15 19:05:10'),
(17,18,1,NULL,450.00,NULL,'2026-09-15 19:05:10','2026-09-15 19:05:10'),
(18,19,13,NULL,550.00,NULL,'2026-09-15 19:05:10','2026-09-15 19:05:10'),
(19,20,22,NULL,940.00,NULL,'2026-09-15 19:05:10','2026-09-15 19:05:10'),
(20,21,29,NULL,340.00,NULL,'2026-09-15 19:05:10','2026-09-15 19:05:10'),
(21,22,40,NULL,770.00,NULL,'2026-09-15 19:05:10','2026-09-15 19:05:10'),
(22,23,49,NULL,550.00,NULL,'2026-09-15 19:05:10','2026-09-15 19:05:10'),
(23,24,58,NULL,940.00,NULL,'2026-09-15 19:05:10','2026-09-15 19:05:10'),
(24,25,70,NULL,340.00,NULL,'2026-09-15 19:05:10','2026-09-15 19:05:10'),
(25,26,79,NULL,770.00,NULL,'2026-09-15 19:05:10','2026-09-15 19:05:10'),
(26,27,8,NULL,550.00,NULL,'2026-09-15 19:05:10','2026-09-15 19:05:10');
/*!40000 ALTER TABLE `expense_beneficiaries` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `expense_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `expense_categories` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `parent_id` bigint(20) unsigned DEFAULT NULL,
  `label` varchar(120) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `expense_categories_label_unique` (`label`),
  KEY `expense_categories_parent_id_foreign` (`parent_id`),
  CONSTRAINT `expense_categories_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `expense_categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=1026 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `expense_categories` WRITE;
/*!40000 ALTER TABLE `expense_categories` DISABLE KEYS */;
INSERT INTO `expense_categories` VALUES
(1,NULL,'أدوية ومستلزمات طبية','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(2,NULL,'فحوصات طبية','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(3,NULL,'عمليات جراحية','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(4,NULL,'علاج طبيعي','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(5,NULL,'مساعدات طبية طارئة','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(6,NULL,'رسوم مدرسية','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(7,NULL,'مواد تعليمية','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(8,NULL,'دورات تدريبية','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(9,NULL,'منح الطلاب','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(10,NULL,'مصاريف النقل للطلاب','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(11,NULL,'وقود','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(12,NULL,'صيانة المركبات','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(13,NULL,'تأمين المركبات','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(14,NULL,'أجرة سائقين','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(15,NULL,'تذاكر النقل العام','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(16,NULL,'رواتب الموظفين','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(17,NULL,'مصاريف المكتب','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(18,NULL,'إيجار','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(19,NULL,'كهرباء وماء','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(20,NULL,'مصاريف الاتصالات','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(21,NULL,'مصاريف قانونية ومحاسبية','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(22,NULL,'مساعدات نقدية للأرامل','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(23,NULL,'مساعدات نقدية للأيتام','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(24,NULL,'مساعدات غذائية','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(25,NULL,'مساعدات سكن','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(26,NULL,'مساعدات كسوة','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(27,NULL,'تنظيم الفعاليات','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(28,NULL,'برامج ترفيهية للأطفال','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(29,NULL,'ورش تدريبية','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(30,NULL,'مؤتمرات ولقاءات','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(31,NULL,'مواد دعائية وإعلانية','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(999,NULL,'Deleted Category (Default)','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(1000,NULL,'مصاريف إدارية','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(1001,NULL,'أدوات ومستلزمات مكتبية','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(1002,NULL,'اتصالات وإنترنت','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(1003,NULL,'سلة غذائية','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(1004,NULL,'مساعدة نقدية شهرية','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(1005,NULL,'كسوة وملابس','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(1006,NULL,'مساعدة في الإيجار','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(1007,NULL,'فواتير الماء والكهرباء','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(1008,NULL,'رسوم التمدرس','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(1009,NULL,'أدوات ولوازم مدرسية','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(1010,NULL,'دعم ومساندة دراسية','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(1011,NULL,'نقل مدرسي','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(1012,NULL,'أدوية','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(1013,NULL,'فحوصات وتحاليل','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(1014,NULL,'استشارات طبية','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(1015,NULL,'نظارات وأجهزة طبية','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(1016,NULL,'رحلات وخرجات','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(1017,NULL,'مخيمات صيفية','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(1018,NULL,'أنشطة ثقافية ورياضية','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(1019,NULL,'هدايا المناسبات','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(1020,NULL,'مشاريع مدرة للدخل','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(1021,NULL,'تجهيز مشروع أسرة','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(1022,NULL,'دعم نشاط حر','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(1023,NULL,'دورات تكوينية','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(1024,NULL,'تكوين مهني','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(1025,NULL,'ورشات تأهيلية','2026-09-15 19:05:08','2026-09-15 19:05:08');
/*!40000 ALTER TABLE `expense_categories` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `expenses` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `fiscal_year_id` bigint(20) unsigned NOT NULL,
  `budget_id` bigint(20) unsigned NOT NULL,
  `expense_category_id` bigint(20) unsigned NOT NULL,
  `partner_id` bigint(20) unsigned DEFAULT NULL,
  `details` text DEFAULT NULL,
  `expense_date` date NOT NULL,
  `amount` decimal(16,2) NOT NULL,
  `payment_method` enum('Cash','Cheque','BankWire') NOT NULL,
  `cheque_number` varchar(60) DEFAULT NULL,
  `receipt_number` varchar(60) DEFAULT NULL,
  `bank_account_id` bigint(20) unsigned DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `unrelated_to_benef` tinyint(1) NOT NULL DEFAULT 0,
  `status` enum('Draft','Approved') NOT NULL DEFAULT 'Draft',
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `approved_by` bigint(20) unsigned DEFAULT NULL,
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
  KEY `expenses_status_date_index` (`status`,`expense_date`),
  KEY `expenses_expense_date_index` (`expense_date`),
  KEY `expenses_payment_method_index` (`payment_method`),
  CONSTRAINT `expenses_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`),
  CONSTRAINT `expenses_bank_account_id_foreign` FOREIGN KEY (`bank_account_id`) REFERENCES `bank_accounts` (`id`),
  CONSTRAINT `expenses_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `expenses_expense_category_id_foreign` FOREIGN KEY (`expense_category_id`) REFERENCES `expense_categories` (`id`),
  CONSTRAINT `expenses_fiscal_year_id_foreign` FOREIGN KEY (`fiscal_year_id`) REFERENCES `fiscal_years` (`id`),
  CONSTRAINT `expenses_partner_id_foreign` FOREIGN KEY (`partner_id`) REFERENCES `partners` (`id`),
  CONSTRAINT `expenses_sub_budget_id_foreign` FOREIGN KEY (`budget_id`) REFERENCES `budgets` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `expenses` WRITE;
/*!40000 ALTER TABLE `expenses` DISABLE KEYS */;
INSERT INTO `expenses` VALUES
(1,1,7,2,NULL,NULL,'2026-01-13',750.00,'Cash',NULL,'EX-2026-01',2,NULL,0,'Approved',1,1,'2026-09-15 19:05:10','2026-09-15 19:05:09','2026-09-15 19:05:10'),
(2,1,7,3,NULL,NULL,'2026-02-18',1200.00,'Cash',NULL,'EX-2026-02',1,NULL,0,'Approved',1,1,'2026-09-15 19:05:10','2026-09-15 19:05:10','2026-09-15 19:05:10'),
(3,1,7,4,NULL,NULL,'2026-03-23',450.00,'Cash',NULL,'EX-2026-03',2,NULL,0,'Approved',1,1,'2026-09-15 19:05:10','2026-09-15 19:05:10','2026-09-15 19:05:10'),
(4,1,7,5,NULL,NULL,'2026-04-10',600.00,'Cheque',NULL,'EX-2026-04',1,NULL,0,'Approved',1,1,'2026-09-15 19:05:10','2026-09-15 19:05:10','2026-09-15 19:05:10'),
(5,1,7,6,NULL,NULL,'2026-05-15',900.00,'Cash',NULL,'EX-2026-05',2,NULL,0,'Approved',1,1,'2026-09-15 19:05:10','2026-09-15 19:05:10','2026-09-15 19:05:10'),
(6,1,7,7,NULL,NULL,'2026-06-20',1350.00,'Cash',NULL,'EX-2026-06',1,NULL,0,'Approved',1,1,'2026-09-15 19:05:10','2026-09-15 19:05:10','2026-09-15 19:05:10'),
(7,1,7,8,NULL,NULL,'2026-07-25',520.00,'Cash',NULL,'EX-2026-07',2,NULL,0,'Approved',1,1,'2026-09-15 19:05:10','2026-09-15 19:05:10','2026-09-15 19:05:10'),
(8,1,7,9,NULL,NULL,'2026-08-12',680.00,'Cheque',NULL,'EX-2026-08',NULL,NULL,0,'Draft',1,NULL,NULL,'2026-09-15 19:05:10','2026-09-15 19:05:10'),
(9,1,7,10,NULL,NULL,'2026-09-15',1050.00,'Cash',NULL,'EX-2026-09',NULL,NULL,0,'Draft',1,NULL,NULL,'2026-09-15 19:05:10','2026-09-15 19:05:10'),
(10,1,7,1,NULL,NULL,'2026-09-12',1500.00,'BankWire',NULL,NULL,1,NULL,1,'Approved',1,1,'2026-09-15 19:05:10','2026-09-15 19:05:10','2026-09-15 19:05:10'),
(11,2,7,4,NULL,NULL,'2024-08-24',770.00,'Cash',NULL,'EX-2024-01',NULL,NULL,0,'Approved',1,1,'2024-08-24 00:00:00','2026-09-15 19:05:10','2026-09-15 19:05:10'),
(12,2,7,5,NULL,NULL,'2024-01-10',280.00,'Cash',NULL,'EX-2024-02',NULL,NULL,0,'Approved',1,1,'2024-01-10 00:00:00','2026-09-15 19:05:10','2026-09-15 19:05:10'),
(13,2,7,6,NULL,NULL,'2024-06-03',630.00,'Cheque',NULL,'EX-2024-03',NULL,NULL,0,'Approved',1,1,'2024-06-03 00:00:00','2026-09-15 19:05:10','2026-09-15 19:05:10'),
(14,2,7,7,NULL,NULL,'2024-11-03',450.00,'Cash',NULL,'EX-2024-04',NULL,NULL,0,'Approved',1,1,'2024-11-03 00:00:00','2026-09-15 19:05:10','2026-09-15 19:05:10'),
(15,2,7,8,NULL,NULL,'2024-04-13',770.00,'Cash',NULL,'EX-2024-05',NULL,NULL,0,'Approved',1,1,'2024-04-13 00:00:00','2026-09-15 19:05:10','2026-09-15 19:05:10'),
(16,2,7,9,NULL,NULL,'2024-09-10',280.00,'Cheque',NULL,'EX-2024-06',NULL,NULL,0,'Approved',1,1,'2024-09-10 00:00:00','2026-09-15 19:05:10','2026-09-15 19:05:10'),
(17,2,7,10,NULL,NULL,'2024-02-06',630.00,'Cash',NULL,'EX-2024-07',NULL,NULL,0,'Approved',1,1,'2024-02-06 00:00:00','2026-09-15 19:05:10','2026-09-15 19:05:10'),
(18,2,7,11,NULL,NULL,'2024-07-09',450.00,'Cash',NULL,'EX-2024-08',NULL,NULL,0,'Approved',1,1,'2024-07-09 00:00:00','2026-09-15 19:05:10','2026-09-15 19:05:10'),
(19,3,7,3,NULL,NULL,'2025-07-08',550.00,'Cash',NULL,'EX-2025-01',NULL,NULL,0,'Approved',1,1,'2025-07-08 00:00:00','2026-09-15 19:05:10','2026-09-15 19:05:10'),
(20,3,7,4,NULL,NULL,'2025-12-15',940.00,'Cash',NULL,'EX-2025-02',NULL,NULL,0,'Approved',1,1,'2025-12-15 00:00:00','2026-09-15 19:05:10','2026-09-15 19:05:10'),
(21,3,7,5,NULL,NULL,'2025-05-12',340.00,'Cheque',NULL,'EX-2025-03',NULL,NULL,0,'Approved',1,1,'2025-05-12 00:00:00','2026-09-15 19:05:10','2026-09-15 19:05:10'),
(22,3,7,6,NULL,NULL,'2025-10-21',770.00,'Cash',NULL,'EX-2025-04',NULL,NULL,0,'Approved',1,1,'2025-10-21 00:00:00','2026-09-15 19:05:10','2026-09-15 19:05:10'),
(23,3,7,7,NULL,NULL,'2025-03-06',550.00,'Cash',NULL,'EX-2025-05',NULL,NULL,0,'Approved',1,1,'2025-03-06 00:00:00','2026-09-15 19:05:10','2026-09-15 19:05:10'),
(24,3,7,8,NULL,NULL,'2025-08-03',940.00,'Cheque',NULL,'EX-2025-06',NULL,NULL,0,'Approved',1,1,'2025-08-03 00:00:00','2026-09-15 19:05:10','2026-09-15 19:05:10'),
(25,3,7,9,NULL,NULL,'2025-01-17',340.00,'Cash',NULL,'EX-2025-07',NULL,NULL,0,'Approved',1,1,'2025-01-17 00:00:00','2026-09-15 19:05:10','2026-09-15 19:05:10'),
(26,3,7,10,NULL,NULL,'2025-06-25',770.00,'Cash',NULL,'EX-2025-08',NULL,NULL,0,'Approved',1,1,'2025-06-25 00:00:00','2026-09-15 19:05:10','2026-09-15 19:05:10'),
(27,3,7,11,NULL,NULL,'2025-11-26',550.00,'Cheque',NULL,'EX-2025-09',NULL,NULL,0,'Approved',1,1,'2025-11-26 00:00:00','2026-09-15 19:05:10','2026-09-15 19:05:10');
/*!40000 ALTER TABLE `expenses` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `failed_jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
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

LOCK TABLES `failed_jobs` WRITE;
/*!40000 ALTER TABLE `failed_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `failed_jobs` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `fiscal_years`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `fiscal_years` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
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

LOCK TABLES `fiscal_years` WRITE;
/*!40000 ALTER TABLE `fiscal_years` DISABLE KEYS */;
INSERT INTO `fiscal_years` VALUES
(1,2026,1,0.00,0.00,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(2,2024,0,0.00,0.00,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(3,2025,0,0.00,0.00,'2026-09-15 19:05:09','2026-09-15 19:05:09');
/*!40000 ALTER TABLE `fiscal_years` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `housing_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `housing_types` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `label` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `housing_types_label_unique` (`label`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `housing_types` WRITE;
/*!40000 ALTER TABLE `housing_types` DISABLE KEYS */;
INSERT INTO `housing_types` VALUES
(1,'شقة','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(2,'منزل','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(3,'غرفة','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(4,'بيت شعبي','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(5,'كوخ','2026-09-15 19:05:08','2026-09-15 19:05:08');
/*!40000 ALTER TABLE `housing_types` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `illnesses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `illnesses` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `label` varchar(120) DEFAULT NULL,
  `is_chronic` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `illnesses_label_unique` (`label`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `illnesses` WRITE;
/*!40000 ALTER TABLE `illnesses` DISABLE KEYS */;
INSERT INTO `illnesses` VALUES
(1,'سكري',0,'2026-09-15 19:05:08','2026-09-15 19:05:08'),
(2,'ضغط دم',0,'2026-09-15 19:05:08','2026-09-15 19:05:08'),
(3,'قلب',0,'2026-09-15 19:05:08','2026-09-15 19:05:08'),
(4,'كلى',0,'2026-09-15 19:05:08','2026-09-15 19:05:08'),
(5,'ربو',0,'2026-09-15 19:05:08','2026-09-15 19:05:08'),
(6,'التهاب مفاصل',0,'2026-09-15 19:05:08','2026-09-15 19:05:08'),
(7,'صداع نصفي',0,'2026-09-15 19:05:08','2026-09-15 19:05:08'),
(8,'فقر دم',0,'2026-09-15 19:05:08','2026-09-15 19:05:08'),
(9,'غدة درقية',0,'2026-09-15 19:05:08','2026-09-15 19:05:08');
/*!40000 ALTER TABLE `illnesses` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `income_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `income_categories` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `parent_id` bigint(20) unsigned DEFAULT NULL,
  `label` varchar(120) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `income_categories_label_unique` (`label`),
  KEY `income_categories_parent_id_foreign` (`parent_id`),
  CONSTRAINT `income_categories_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `income_categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=1003 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `income_categories` WRITE;
/*!40000 ALTER TABLE `income_categories` DISABLE KEYS */;
INSERT INTO `income_categories` VALUES
(1,NULL,'تبرعات للرعاية الصحية','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(3,NULL,'دعم العلاجات','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(4,NULL,'رسوم التدريب','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(5,NULL,'تبرعات تعليمية','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(6,NULL,'منح دراسية','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(7,NULL,'تبرعات للمواصلات','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(8,NULL,'دعم النقل','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(9,NULL,'رسوم إدارية','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(10,NULL,'تبرعات عامة','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(11,NULL,'تبرعات للمساعدات الاجتماعية','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(12,NULL,'زكاة','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(13,NULL,'صدقات','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(14,NULL,'رعاية الفعاليات','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(15,NULL,'تبرعات للبرامج','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(999,NULL,'Deleted Category (Default)','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(1002,NULL,'كفالة شاملة','2026-09-15 19:05:08','2026-09-15 19:05:08');
/*!40000 ALTER TABLE `income_categories` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `incomes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `incomes` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `fiscal_year_id` bigint(20) unsigned NOT NULL,
  `budget_id` bigint(20) unsigned NOT NULL,
  `income_category_id` bigint(20) unsigned NOT NULL,
  `donor_id` bigint(20) unsigned DEFAULT NULL,
  `kafil_id` bigint(20) unsigned DEFAULT NULL,
  `widow_id` bigint(20) unsigned DEFAULT NULL,
  `kafala_batch_id` char(26) DEFAULT NULL,
  `income_date` date NOT NULL,
  `amount` decimal(16,2) NOT NULL,
  `payment_method` enum('Cash','Cheque','BankWire') NOT NULL,
  `cheque_number` varchar(60) DEFAULT NULL,
  `receipt_number` varchar(60) DEFAULT NULL,
  `bank_account_id` bigint(20) unsigned DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `status` enum('Draft','Approved') NOT NULL DEFAULT 'Draft',
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `approved_by` bigint(20) unsigned DEFAULT NULL,
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
  KEY `incomes_status_date_index` (`status`,`income_date`),
  KEY `incomes_income_date_index` (`income_date`),
  KEY `incomes_payment_method_index` (`payment_method`),
  KEY `incomes_kafala_batch_id_index` (`kafala_batch_id`),
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

LOCK TABLES `incomes` WRITE;
/*!40000 ALTER TABLE `incomes` DISABLE KEYS */;
INSERT INTO `incomes` VALUES
(1,1,7,10,2,NULL,NULL,NULL,'2026-01-08',900.00,'Cash',NULL,'RC-2026-01',NULL,NULL,'Approved',1,1,'2026-09-15 19:05:09',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(2,1,7,10,3,NULL,NULL,NULL,'2026-02-11',2400.00,'Cash',NULL,'RC-2026-02',NULL,NULL,'Approved',1,1,'2026-09-15 19:05:09',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(3,1,7,10,4,NULL,NULL,NULL,'2026-03-14',1100.00,'Cheque',NULL,'RC-2026-03',NULL,NULL,'Approved',1,1,'2026-09-15 19:05:09',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(4,1,7,10,5,NULL,NULL,NULL,'2026-04-17',1800.00,'Cash',NULL,'RC-2026-04',NULL,NULL,'Approved',1,1,'2026-09-15 19:05:09',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(5,1,7,10,6,NULL,NULL,NULL,'2026-05-20',700.00,'Cash',NULL,'RC-2026-05',NULL,NULL,'Approved',1,1,'2026-09-15 19:05:09',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(6,1,7,10,7,NULL,NULL,NULL,'2026-06-23',1500.00,'Cheque',NULL,'RC-2026-06',NULL,NULL,'Approved',1,1,'2026-09-15 19:05:09',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(7,1,7,10,8,NULL,NULL,NULL,'2026-07-06',900.00,'Cash',NULL,'RC-2026-07',NULL,NULL,'Approved',1,1,'2026-09-15 19:05:09',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(8,1,7,10,9,NULL,NULL,NULL,'2026-08-09',2400.00,'Cash',NULL,'RC-2026-08',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(9,1,7,10,10,NULL,NULL,NULL,'2026-09-12',1100.00,'Cheque',NULL,'RC-2026-09',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(10,1,7,10,5,NULL,NULL,NULL,'2026-01-11',500.00,'Cash',NULL,'RC-1000',NULL,NULL,'Approved',1,1,'2026-09-15 19:05:09',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(11,1,7,10,6,NULL,NULL,NULL,'2026-02-12',1200.00,'Cash',NULL,'RC-1001',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(12,1,7,10,7,NULL,NULL,NULL,'2026-03-13',300.00,'Cash',NULL,'RC-1002',NULL,NULL,'Approved',1,1,'2026-09-15 19:05:09',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(13,1,7,10,8,NULL,NULL,NULL,'2026-04-14',2000.00,'Cash',NULL,'RC-1003',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(14,1,7,10,9,NULL,NULL,NULL,'2026-05-15',500.00,'Cash',NULL,'RC-1004',NULL,NULL,'Approved',1,1,'2026-09-15 19:05:09',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(15,1,7,10,10,NULL,NULL,NULL,'2026-06-16',1200.00,'Cash',NULL,'RC-1005',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(16,1,7,10,11,NULL,NULL,NULL,'2026-07-17',300.00,'Cash',NULL,'RC-1006',NULL,NULL,'Approved',1,1,'2026-09-15 19:05:09',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(17,1,7,10,12,NULL,NULL,NULL,'2026-08-18',2000.00,'Cash',NULL,'RC-1007',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(18,1,7,10,13,NULL,NULL,NULL,'2026-09-15',500.00,'Cash',NULL,'RC-1008',NULL,NULL,'Approved',1,1,'2026-09-15 19:05:09',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(19,1,7,10,14,NULL,NULL,NULL,'2026-01-20',1200.00,'Cash',NULL,'RC-1009',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(20,1,7,10,15,NULL,NULL,NULL,'2026-02-21',300.00,'Cash',NULL,'RC-1010',NULL,NULL,'Approved',1,1,'2026-09-15 19:05:09',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(21,1,7,10,16,NULL,NULL,NULL,'2026-03-22',2000.00,'Cash',NULL,'RC-1011',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(22,1,7,10,17,NULL,NULL,NULL,'2026-04-23',500.00,'Cash',NULL,'RC-1012',NULL,NULL,'Approved',1,1,'2026-09-15 19:05:09',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(23,1,7,10,18,NULL,NULL,NULL,'2026-05-24',1200.00,'Cash',NULL,'RC-1013',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(24,1,8,1002,NULL,3,3,NULL,'2026-09-03',400.00,'BankWire',NULL,NULL,2,NULL,'Approved',1,1,'2026-09-15 19:05:09',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(25,1,8,1002,NULL,3,4,NULL,'2026-09-03',400.00,'BankWire',NULL,NULL,2,NULL,'Approved',1,1,'2026-09-15 19:05:09',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(26,1,9,1002,NULL,1,1,'01M2K7AWJD0TNK6SYPKSZG7T0N','2026-08-14',80.00,'Cash',NULL,'RC-KC-1',NULL,NULL,'Approved',1,1,'2026-09-15 19:05:09',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(27,1,10,1002,NULL,1,1,'01M2K7AWJD0TNK6SYPKSZG7T0N','2026-08-14',400.00,'Cash',NULL,'RC-KC-1',NULL,NULL,'Approved',1,1,'2026-09-15 19:05:09',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(28,1,11,1002,NULL,1,1,'01M2K7AWJD0TNK6SYPKSZG7T0N','2026-08-14',160.00,'Cash',NULL,'RC-KC-1',NULL,NULL,'Approved',1,1,'2026-09-15 19:05:09',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(29,1,12,1002,NULL,1,1,'01M2K7AWJD0TNK6SYPKSZG7T0N','2026-08-14',32.00,'Cash',NULL,'RC-KC-1',NULL,NULL,'Approved',1,1,'2026-09-15 19:05:09',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(30,1,13,1002,NULL,1,1,'01M2K7AWJD0TNK6SYPKSZG7T0N','2026-08-14',40.00,'Cash',NULL,'RC-KC-1',NULL,NULL,'Approved',1,1,'2026-09-15 19:05:09',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(31,1,14,1002,NULL,1,1,'01M2K7AWJD0TNK6SYPKSZG7T0N','2026-08-14',48.00,'Cash',NULL,'RC-KC-1',NULL,NULL,'Approved',1,1,'2026-09-15 19:05:09',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(32,1,15,1002,NULL,1,1,'01M2K7AWJD0TNK6SYPKSZG7T0N','2026-08-14',40.00,'Cash',NULL,'RC-KC-1',NULL,NULL,'Approved',1,1,'2026-09-15 19:05:09',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(33,1,9,1002,NULL,2,NULL,'01M2K7AWK691KDXJEZ7GEDGW12','2026-09-15',80.00,'Cash',NULL,'RC-KC-2',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(34,1,10,1002,NULL,2,NULL,'01M2K7AWK691KDXJEZ7GEDGW12','2026-09-15',400.00,'Cash',NULL,'RC-KC-2',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(35,1,11,1002,NULL,2,NULL,'01M2K7AWK691KDXJEZ7GEDGW12','2026-09-15',160.00,'Cash',NULL,'RC-KC-2',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(36,1,12,1002,NULL,2,NULL,'01M2K7AWK691KDXJEZ7GEDGW12','2026-09-15',32.00,'Cash',NULL,'RC-KC-2',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(37,1,13,1002,NULL,2,NULL,'01M2K7AWK691KDXJEZ7GEDGW12','2026-09-15',40.00,'Cash',NULL,'RC-KC-2',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(38,1,14,1002,NULL,2,NULL,'01M2K7AWK691KDXJEZ7GEDGW12','2026-09-15',48.00,'Cash',NULL,'RC-KC-2',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(39,1,15,1002,NULL,2,NULL,'01M2K7AWK691KDXJEZ7GEDGW12','2026-09-15',40.00,'Cash',NULL,'RC-KC-2',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(40,2,7,10,10,NULL,NULL,NULL,'2024-01-07',1400.00,'Cash',NULL,'RC-2024-01',NULL,NULL,'Approved',1,1,'2024-01-07 00:00:00','2024-01-07 00:00:00','2026-09-15 19:05:10','2026-09-15 19:05:10'),
(41,2,7,10,11,NULL,NULL,NULL,'2024-02-14',600.00,'Cash',NULL,'RC-2024-02',NULL,NULL,'Approved',1,1,'2024-02-14 00:00:00','2024-02-14 00:00:00','2026-09-15 19:05:10','2026-09-15 19:05:10'),
(42,2,7,10,12,NULL,NULL,NULL,'2024-03-13',1050.00,'Cash',NULL,'RC-2024-03',NULL,NULL,'Approved',1,1,'2024-03-13 00:00:00','2024-03-13 00:00:00','2026-09-15 19:05:10','2026-09-15 19:05:10'),
(43,2,7,10,13,NULL,NULL,NULL,'2024-04-15',350.00,'Cheque',NULL,'RC-2024-04',NULL,NULL,'Approved',1,1,'2024-04-15 00:00:00','2024-04-15 00:00:00','2026-09-15 19:05:10','2026-09-15 19:05:10'),
(44,2,7,10,14,NULL,NULL,NULL,'2024-05-17',840.00,'Cash',NULL,'RC-2024-05',NULL,NULL,'Approved',1,1,'2024-05-17 00:00:00','2024-05-17 00:00:00','2026-09-15 19:05:10','2026-09-15 19:05:10'),
(45,2,7,10,15,NULL,NULL,NULL,'2024-06-22',210.00,'Cash',NULL,'RC-2024-06',NULL,NULL,'Approved',1,1,'2024-06-22 00:00:00','2024-06-22 00:00:00','2026-09-15 19:05:10','2026-09-15 19:05:10'),
(46,2,7,10,16,NULL,NULL,NULL,'2024-07-23',1400.00,'Cash',NULL,'RC-2024-07',NULL,NULL,'Approved',1,1,'2024-07-23 00:00:00','2024-07-23 00:00:00','2026-09-15 19:05:10','2026-09-15 19:05:10'),
(47,2,7,10,17,NULL,NULL,NULL,'2024-08-25',600.00,'Cheque',NULL,'RC-2024-08',NULL,NULL,'Approved',1,1,'2024-08-25 00:00:00','2024-08-25 00:00:00','2026-09-15 19:05:10','2026-09-15 19:05:10'),
(48,2,7,10,18,NULL,NULL,NULL,'2024-09-22',1050.00,'Cash',NULL,'RC-2024-09',NULL,NULL,'Approved',1,1,'2024-09-22 00:00:00','2024-09-22 00:00:00','2026-09-15 19:05:10','2026-09-15 19:05:10'),
(49,2,7,10,1,NULL,NULL,NULL,'2024-10-07',350.00,'Cash',NULL,'RC-2024-10',NULL,NULL,'Approved',1,1,'2024-10-07 00:00:00','2024-10-07 00:00:00','2026-09-15 19:05:10','2026-09-15 19:05:10'),
(50,2,7,10,2,NULL,NULL,NULL,'2024-11-16',840.00,'Cash',NULL,'RC-2024-11',NULL,NULL,'Approved',1,1,'2024-11-16 00:00:00','2024-11-16 00:00:00','2026-09-15 19:05:10','2026-09-15 19:05:10'),
(51,2,7,10,3,NULL,NULL,NULL,'2024-12-20',210.00,'Cheque',NULL,'RC-2024-12',NULL,NULL,'Approved',1,1,'2024-12-20 00:00:00','2024-12-20 00:00:00','2026-09-15 19:05:10','2026-09-15 19:05:10'),
(52,3,7,10,11,NULL,NULL,NULL,'2025-01-21',260.00,'Cash',NULL,'RC-2025-01',NULL,NULL,'Approved',1,1,'2025-01-21 00:00:00','2025-01-21 00:00:00','2026-09-15 19:05:10','2026-09-15 19:05:10'),
(53,3,7,10,12,NULL,NULL,NULL,'2025-02-10',1700.00,'Cash',NULL,'RC-2025-02',NULL,NULL,'Approved',1,1,'2025-02-10 00:00:00','2025-02-10 00:00:00','2026-09-15 19:05:10','2026-09-15 19:05:10'),
(54,3,7,10,13,NULL,NULL,NULL,'2025-03-15',720.00,'Cash',NULL,'RC-2025-03',NULL,NULL,'Approved',1,1,'2025-03-15 00:00:00','2025-03-15 00:00:00','2026-09-15 19:05:10','2026-09-15 19:05:10'),
(55,3,7,10,14,NULL,NULL,NULL,'2025-04-08',1280.00,'Cheque',NULL,'RC-2025-04',NULL,NULL,'Approved',1,1,'2025-04-08 00:00:00','2025-04-08 00:00:00','2026-09-15 19:05:10','2026-09-15 19:05:10'),
(56,3,7,10,15,NULL,NULL,NULL,'2025-05-08',430.00,'Cash',NULL,'RC-2025-05',NULL,NULL,'Approved',1,1,'2025-05-08 00:00:00','2025-05-08 00:00:00','2026-09-15 19:05:10','2026-09-15 19:05:10'),
(57,3,7,10,16,NULL,NULL,NULL,'2025-06-12',1020.00,'Cash',NULL,'RC-2025-06',NULL,NULL,'Approved',1,1,'2025-06-12 00:00:00','2025-06-12 00:00:00','2026-09-15 19:05:10','2026-09-15 19:05:10'),
(58,3,7,10,17,NULL,NULL,NULL,'2025-07-20',260.00,'Cash',NULL,'RC-2025-07',NULL,NULL,'Approved',1,1,'2025-07-20 00:00:00','2025-07-20 00:00:00','2026-09-15 19:05:10','2026-09-15 19:05:10'),
(59,3,7,10,18,NULL,NULL,NULL,'2025-08-05',1700.00,'Cheque',NULL,'RC-2025-08',NULL,NULL,'Approved',1,1,'2025-08-05 00:00:00','2025-08-05 00:00:00','2026-09-15 19:05:10','2026-09-15 19:05:10'),
(60,3,7,10,1,NULL,NULL,NULL,'2025-09-07',720.00,'Cash',NULL,'RC-2025-09',NULL,NULL,'Approved',1,1,'2025-09-07 00:00:00','2025-09-07 00:00:00','2026-09-15 19:05:10','2026-09-15 19:05:10'),
(61,3,7,10,2,NULL,NULL,NULL,'2025-10-09',1280.00,'Cash',NULL,'RC-2025-10',NULL,NULL,'Approved',1,1,'2025-10-09 00:00:00','2025-10-09 00:00:00','2026-09-15 19:05:10','2026-09-15 19:05:10'),
(62,3,7,10,3,NULL,NULL,NULL,'2025-11-14',430.00,'Cash',NULL,'RC-2025-11',NULL,NULL,'Approved',1,1,'2025-11-14 00:00:00','2025-11-14 00:00:00','2026-09-15 19:05:10','2026-09-15 19:05:10'),
(63,3,7,10,4,NULL,NULL,NULL,'2025-12-08',1020.00,'Cheque',NULL,'RC-2025-12',NULL,NULL,'Approved',1,1,'2025-12-08 00:00:00','2025-12-08 00:00:00','2026-09-15 19:05:10','2026-09-15 19:05:10');
/*!40000 ALTER TABLE `incomes` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `job_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `job_batches` WRITE;
/*!40000 ALTER TABLE `job_batches` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_batches` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) unsigned NOT NULL,
  `reserved_at` int(10) unsigned DEFAULT NULL,
  `available_at` int(10) unsigned NOT NULL,
  `created_at` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `kafala_chamila_splits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `kafala_chamila_splits` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `key` varchar(30) NOT NULL,
  `label` varchar(120) NOT NULL,
  `percentage` decimal(5,2) NOT NULL,
  `budget_id` bigint(20) unsigned NOT NULL,
  `income_category_id` bigint(20) unsigned NOT NULL,
  `sort_order` smallint(5) unsigned NOT NULL DEFAULT 0,
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

LOCK TABLES `kafala_chamila_splits` WRITE;
/*!40000 ALTER TABLE `kafala_chamila_splits` DISABLE KEYS */;
INSERT INTO `kafala_chamila_splits` VALUES
(1,'management','تسيير',10.00,9,1002,1,'2026-09-15 19:05:08','2026-09-15 19:05:08'),
(2,'maouna','مؤونة',50.00,10,1002,2,'2026-09-15 19:05:08','2026-09-15 19:05:08'),
(3,'education','تعليم',20.00,11,1002,3,'2026-09-15 19:05:08','2026-09-15 19:05:08'),
(4,'health','صحة',4.00,12,1002,4,'2026-09-15 19:05:08','2026-09-15 19:05:08'),
(5,'activities','تربية وترفيه',5.00,13,1002,5,'2026-09-15 19:05:08','2026-09-15 19:05:08'),
(6,'projects','مشاريع',6.00,14,1002,6,'2026-09-15 19:05:08','2026-09-15 19:05:08'),
(7,'formation','تكوين',5.00,15,1002,7,'2026-09-15 19:05:08','2026-09-15 19:05:08');
/*!40000 ALTER TABLE `kafala_chamila_splits` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `kafil_sponsorship`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `kafil_sponsorship` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `kafil_id` bigint(20) unsigned NOT NULL,
  `widow_id` bigint(20) unsigned NOT NULL,
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

LOCK TABLES `kafil_sponsorship` WRITE;
/*!40000 ALTER TABLE `kafil_sponsorship` DISABLE KEYS */;
INSERT INTO `kafil_sponsorship` VALUES
(1,1,1,400.00,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(2,2,2,800.00,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(3,3,3,400.00,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(4,3,4,400.00,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(5,4,6,400.00,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(6,5,7,400.00,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(7,5,8,400.00,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(8,5,9,400.00,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(9,6,11,400.00,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(10,7,13,400.00,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(11,7,14,400.00,'2026-09-15 19:05:09','2026-09-15 19:05:09');
/*!40000 ALTER TABLE `kafil_sponsorship` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `kafils`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `kafils` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `first_name` varchar(120) DEFAULT NULL,
  `last_name` varchar(120) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `email` varchar(120) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `donor_id` bigint(20) unsigned DEFAULT NULL,
  `monthly_pledge` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `kafils_donor_id_foreign` (`donor_id`),
  CONSTRAINT `kafils_donor_id_foreign` FOREIGN KEY (`donor_id`) REFERENCES `donors` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `kafils` WRITE;
/*!40000 ALTER TABLE `kafils` DISABLE KEYS */;
INSERT INTO `kafils` VALUES
(1,'عبد الكريم','الودغيري','0644641312','عبد الكريم.الودغيري@example.com',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09',1,800.00),
(2,'خالد','بنموسى','0641684594','خالد.بنموسى@example.com',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09',2,1600.00),
(3,'ياسمين','الشرقاوي','0689979428','ياسمين.الشرقاوي@example.com',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09',3,800.00),
(4,'محمد','الغالي','0629822262','محمد.الغالي@example.com',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09',4,400.00),
(5,'سارة','أمين','0679614757','سارة.أمين@example.com',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09',5,2400.00),
(6,'عثمان','الفيلالي','0653256946','عثمان.الفيلالي@example.com',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09',6,800.00),
(7,'ليلى','حمداوي','0670214376','ليلى.حمداوي@example.com',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09',7,1200.00),
(8,'طارق','بوستة','0640446024','طارق.بوستة@example.com',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09',8,800.00);
/*!40000 ALTER TABLE `kafils` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES
(1,'0001_01_01_000000_create_users_table',1),
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
(55,'2025_09_13_000002_create_settings_table',1),
(56,'2025_09_14_000001_add_query_indexes',1),
(57,'2025_09_15_000001_add_higher_education_and_tutoring_to_enrollments',1),
(58,'2025_09_15_000002_add_opening_balance_to_bank_accounts',1),
(59,'2025_09_16_000001_add_kafala_batch_id_to_incomes',1),
(60,'2025_09_17_000001_create_audit_logs_table',1),
(61,'2025_09_18_000001_create_transport_support_table',1),
(62,'2025_09_18_000002_create_transport_months_table',1),
(63,'2025_09_18_000003_create_transport_month_lines_table',1);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `orphan_enrollments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `orphan_enrollments` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `orphan_id` bigint(20) unsigned NOT NULL,
  `academic_year_id` bigint(20) unsigned NOT NULL,
  `education_level_id` bigint(20) unsigned DEFAULT NULL,
  `school_id` bigint(20) unsigned DEFAULT NULL,
  `specialty` varchar(150) DEFAULT NULL,
  `higher_education_phase` varchar(20) DEFAULT NULL,
  `higher_education_year` tinyint(3) unsigned DEFAULT NULL,
  `first_semester_grade` decimal(5,2) DEFAULT NULL,
  `second_semester_grade` decimal(5,2) DEFAULT NULL,
  `grade_scale` decimal(5,2) NOT NULL DEFAULT 20.00,
  `has_tutoring` tinyint(1) NOT NULL DEFAULT 0,
  `tutoring_subjects` varchar(255) DEFAULT NULL,
  `tutoring_provider` varchar(150) DEFAULT NULL,
  `status` enum('enrolled','passed','failed','left') NOT NULL DEFAULT 'enrolled',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `orphan_enrollments_orphan_id_academic_year_id_unique` (`orphan_id`,`academic_year_id`),
  KEY `orphan_enrollments_education_level_id_foreign` (`education_level_id`),
  KEY `orphan_enrollments_school_id_foreign` (`school_id`),
  KEY `enrollments_year_tutoring_index` (`academic_year_id`,`has_tutoring`),
  CONSTRAINT `orphan_enrollments_academic_year_id_foreign` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`),
  CONSTRAINT `orphan_enrollments_education_level_id_foreign` FOREIGN KEY (`education_level_id`) REFERENCES `orphans_education_level` (`id`) ON DELETE SET NULL,
  CONSTRAINT `orphan_enrollments_orphan_id_foreign` FOREIGN KEY (`orphan_id`) REFERENCES `orphans` (`id`) ON DELETE CASCADE,
  CONSTRAINT `orphan_enrollments_school_id_foreign` FOREIGN KEY (`school_id`) REFERENCES `schools` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=151 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `orphan_enrollments` WRITE;
/*!40000 ALTER TABLE `orphan_enrollments` DISABLE KEYS */;
INSERT INTO `orphan_enrollments` VALUES
(1,1,1,6,1,NULL,NULL,NULL,NULL,NULL,20.00,1,'الرياضيات','الجمعية','enrolled',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(2,2,1,6,2,NULL,NULL,NULL,18.54,18.16,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(3,3,1,6,1,NULL,NULL,NULL,15.25,12.25,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(4,4,1,6,2,NULL,NULL,NULL,9.71,NULL,20.00,1,'الرياضيات، الفيزياء','الجمعية','passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(5,5,1,6,1,NULL,NULL,NULL,12.32,15.35,20.00,0,NULL,NULL,'failed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(6,6,1,6,2,NULL,NULL,NULL,17.42,13.66,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(7,9,1,6,1,NULL,NULL,NULL,16.65,7.07,20.00,1,'اللغة الفرنسية','الجمعية','enrolled',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(8,10,1,6,2,NULL,NULL,NULL,NULL,NULL,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(9,11,1,6,1,NULL,NULL,NULL,17.48,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(10,12,1,6,2,NULL,NULL,NULL,14.44,17.57,20.00,1,'الفيزياء والكيمياء','الجمعية','failed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(11,13,1,6,1,NULL,NULL,NULL,16.72,9.55,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(12,14,1,6,2,NULL,NULL,NULL,17.09,11.47,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(13,15,1,6,1,NULL,NULL,NULL,16.33,15.65,20.00,1,'الرياضيات','الجمعية','enrolled',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(14,16,1,6,2,NULL,NULL,NULL,11.07,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(15,17,1,6,1,NULL,NULL,NULL,NULL,NULL,20.00,0,NULL,NULL,'failed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(16,19,1,6,2,NULL,NULL,NULL,12.10,7.68,20.00,1,'الرياضيات، الفيزياء','الجمعية','enrolled',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(17,20,1,6,1,NULL,NULL,NULL,14.05,16.35,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(18,21,1,6,2,NULL,NULL,NULL,9.61,18.50,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(19,22,1,6,1,NULL,NULL,NULL,12.41,NULL,20.00,1,'اللغة الفرنسية','الجمعية','passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(20,23,1,6,2,NULL,NULL,NULL,11.49,18.01,20.00,0,NULL,NULL,'failed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(21,24,1,6,1,NULL,NULL,NULL,12.11,11.91,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(22,25,1,6,2,NULL,NULL,NULL,NULL,NULL,20.00,1,'الفيزياء والكيمياء','الجمعية','enrolled',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(23,26,1,6,1,NULL,NULL,NULL,13.41,7.25,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(24,27,1,6,2,NULL,NULL,NULL,18.59,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(25,28,1,6,1,NULL,NULL,NULL,18.85,7.09,20.00,1,'الرياضيات','الجمعية','failed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(26,29,1,6,2,NULL,NULL,NULL,10.37,13.73,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(27,30,1,6,1,NULL,NULL,NULL,18.66,10.43,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(28,31,1,6,2,NULL,NULL,NULL,16.23,13.77,20.00,1,'الرياضيات، الفيزياء','الجمعية','enrolled',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(29,32,1,6,1,NULL,NULL,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(30,33,1,6,2,NULL,NULL,NULL,14.96,13.36,20.00,0,NULL,NULL,'failed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(31,34,1,6,1,NULL,NULL,NULL,7.07,10.54,20.00,1,'اللغة الفرنسية','الجمعية','enrolled',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(32,35,1,6,2,NULL,NULL,NULL,10.48,15.78,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(33,36,1,6,1,NULL,NULL,NULL,8.45,12.14,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(34,37,1,6,2,NULL,NULL,NULL,13.27,NULL,20.00,1,'الفيزياء والكيمياء','الجمعية','passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(35,38,1,6,1,NULL,NULL,NULL,10.92,15.18,20.00,0,NULL,NULL,'failed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(36,39,1,6,2,NULL,NULL,NULL,NULL,NULL,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(37,40,1,6,1,NULL,NULL,NULL,8.09,15.26,20.00,1,'الرياضيات','الجمعية','enrolled',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(38,41,1,6,2,NULL,NULL,NULL,17.63,13.85,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(39,42,1,6,1,NULL,NULL,NULL,11.18,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(40,43,1,6,2,NULL,NULL,NULL,7.20,18.42,20.00,1,'الرياضيات، الفيزياء','الجمعية','failed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(41,44,1,6,1,NULL,NULL,NULL,10.17,8.01,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(42,45,1,6,2,NULL,NULL,NULL,8.78,15.69,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(43,46,1,6,1,NULL,NULL,NULL,NULL,NULL,20.00,1,'اللغة الفرنسية','الجمعية','enrolled',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(44,47,1,6,2,NULL,NULL,NULL,13.41,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(45,48,1,6,1,NULL,NULL,NULL,13.47,15.74,20.00,0,NULL,NULL,'failed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(46,49,1,6,2,NULL,NULL,NULL,8.54,15.06,20.00,1,'الفيزياء والكيمياء','الجمعية','enrolled',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(47,50,1,6,1,NULL,NULL,NULL,8.71,16.64,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(48,51,1,6,2,NULL,NULL,NULL,10.17,10.26,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(49,52,1,6,1,NULL,NULL,NULL,8.72,NULL,20.00,1,'الرياضيات','الجمعية','passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(50,53,1,6,2,NULL,NULL,NULL,NULL,NULL,20.00,0,NULL,NULL,'failed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(51,1,2,4,1,NULL,NULL,NULL,14.42,NULL,20.00,1,'الرياضيات','الجمعية','passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(52,1,3,5,1,NULL,NULL,NULL,14.17,17.82,20.00,1,'الرياضيات','الجمعية','passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(53,2,2,4,2,NULL,NULL,NULL,15.44,12.11,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(54,2,3,5,2,NULL,NULL,NULL,12.80,18.75,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(55,3,2,4,1,NULL,NULL,NULL,15.48,10.41,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(56,3,3,5,1,NULL,NULL,NULL,17.78,9.39,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(57,4,2,4,2,NULL,NULL,NULL,9.37,15.70,20.00,1,'الرياضيات، الفيزياء','الجمعية','passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(58,4,3,5,2,NULL,NULL,NULL,8.51,17.56,20.00,1,'الرياضيات، الفيزياء','الجمعية','passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(59,5,2,4,1,NULL,NULL,NULL,18.99,18.89,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(60,5,3,5,1,NULL,NULL,NULL,8.67,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(61,6,2,4,2,NULL,NULL,NULL,10.14,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(62,6,3,5,2,NULL,NULL,NULL,16.74,12.81,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(63,9,2,4,1,NULL,NULL,NULL,10.01,18.57,20.00,1,'اللغة الفرنسية','الجمعية','passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(64,9,3,5,1,NULL,NULL,NULL,14.12,7.96,20.00,1,'اللغة الفرنسية','الجمعية','passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(65,10,2,4,2,NULL,NULL,NULL,15.27,9.65,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(66,10,3,5,2,NULL,NULL,NULL,7.54,8.67,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(67,11,2,4,1,NULL,NULL,NULL,15.47,10.03,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(68,11,3,5,1,NULL,NULL,NULL,14.96,12.86,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(69,12,2,4,2,NULL,NULL,NULL,17.41,17.73,20.00,1,'الفيزياء والكيمياء','الجمعية','passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(70,12,3,5,2,NULL,NULL,NULL,8.77,NULL,20.00,1,'الفيزياء والكيمياء','الجمعية','passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(71,13,2,4,1,NULL,NULL,NULL,15.22,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(72,13,3,5,1,NULL,NULL,NULL,12.57,17.26,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(73,14,2,4,2,NULL,NULL,NULL,8.11,17.73,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(74,14,3,5,2,NULL,NULL,NULL,14.56,9.02,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(75,15,2,4,1,NULL,NULL,NULL,14.01,18.77,20.00,1,'الرياضيات','الجمعية','passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(76,15,3,5,1,NULL,NULL,NULL,16.79,9.84,20.00,1,'الرياضيات','الجمعية','passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(77,16,2,4,2,NULL,NULL,NULL,12.58,15.22,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(78,16,3,5,2,NULL,NULL,NULL,16.05,13.37,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(79,17,2,4,1,NULL,NULL,NULL,15.51,17.15,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(80,17,3,5,1,NULL,NULL,NULL,9.24,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(81,19,2,4,2,NULL,NULL,NULL,8.08,NULL,20.00,1,'الرياضيات، الفيزياء','الجمعية','passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(82,19,3,5,2,NULL,NULL,NULL,12.08,16.58,20.00,1,'الرياضيات، الفيزياء','الجمعية','passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(83,20,2,4,1,NULL,NULL,NULL,14.56,13.06,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(84,20,3,5,1,NULL,NULL,NULL,9.04,18.74,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(85,21,2,4,2,NULL,NULL,NULL,11.39,7.91,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(86,21,3,5,2,NULL,NULL,NULL,8.55,7.21,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(87,22,2,4,1,NULL,NULL,NULL,17.55,8.76,20.00,1,'اللغة الفرنسية','الجمعية','passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(88,22,3,5,1,NULL,NULL,NULL,18.90,13.91,20.00,1,'اللغة الفرنسية','الجمعية','passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(89,23,2,4,2,NULL,NULL,NULL,9.54,8.27,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(90,23,3,5,2,NULL,NULL,NULL,17.21,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(91,24,2,4,1,NULL,NULL,NULL,18.23,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(92,24,3,5,1,NULL,NULL,NULL,16.60,14.05,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(93,25,2,4,2,NULL,NULL,NULL,7.18,14.17,20.00,1,'الفيزياء والكيمياء','الجمعية','passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(94,25,3,5,2,NULL,NULL,NULL,7.07,14.11,20.00,1,'الفيزياء والكيمياء','الجمعية','passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(95,26,2,4,1,NULL,NULL,NULL,11.90,16.44,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(96,26,3,5,1,NULL,NULL,NULL,13.96,17.16,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(97,27,2,4,2,NULL,NULL,NULL,12.45,13.66,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(98,27,3,5,2,NULL,NULL,NULL,11.62,14.43,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(99,28,2,4,1,NULL,NULL,NULL,9.14,16.15,20.00,1,'الرياضيات','الجمعية','passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(100,28,3,5,1,NULL,NULL,NULL,10.27,NULL,20.00,1,'الرياضيات','الجمعية','passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(101,29,2,4,2,NULL,NULL,NULL,14.12,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(102,29,3,5,2,NULL,NULL,NULL,18.38,16.89,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(103,30,2,4,1,NULL,NULL,NULL,14.19,11.73,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(104,30,3,5,1,NULL,NULL,NULL,7.15,12.97,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(105,31,2,4,2,NULL,NULL,NULL,15.31,10.11,20.00,1,'الرياضيات، الفيزياء','الجمعية','passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(106,31,3,5,2,NULL,NULL,NULL,10.00,9.55,20.00,1,'الرياضيات، الفيزياء','الجمعية','passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(107,32,2,4,1,NULL,NULL,NULL,17.61,7.93,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(108,32,3,5,1,NULL,NULL,NULL,9.46,10.53,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(109,33,2,4,2,NULL,NULL,NULL,18.83,7.70,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(110,33,3,5,2,NULL,NULL,NULL,12.68,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(111,34,2,4,1,NULL,NULL,NULL,12.61,NULL,20.00,1,'اللغة الفرنسية','الجمعية','passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(112,34,3,5,1,NULL,NULL,NULL,18.40,16.69,20.00,1,'اللغة الفرنسية','الجمعية','passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(113,35,2,4,2,NULL,NULL,NULL,7.64,8.00,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(114,35,3,5,2,NULL,NULL,NULL,13.05,8.02,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(115,36,2,4,1,NULL,NULL,NULL,11.52,12.04,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(116,36,3,5,1,NULL,NULL,NULL,13.33,17.70,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(117,37,2,4,2,NULL,NULL,NULL,9.75,18.06,20.00,1,'الفيزياء والكيمياء','الجمعية','passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(118,37,3,5,2,NULL,NULL,NULL,14.24,15.30,20.00,1,'الفيزياء والكيمياء','الجمعية','passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(119,38,2,4,1,NULL,NULL,NULL,7.69,17.46,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(120,38,3,5,1,NULL,NULL,NULL,12.22,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(121,39,2,4,2,NULL,NULL,NULL,12.95,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(122,39,3,5,2,NULL,NULL,NULL,12.54,17.82,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(123,40,2,4,1,NULL,NULL,NULL,15.02,15.03,20.00,1,'الرياضيات','الجمعية','passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(124,40,3,5,1,NULL,NULL,NULL,15.91,12.53,20.00,1,'الرياضيات','الجمعية','passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(125,41,2,4,2,NULL,NULL,NULL,14.60,18.29,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(126,41,3,5,2,NULL,NULL,NULL,10.32,9.96,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(127,42,2,4,1,NULL,NULL,NULL,9.29,14.89,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(128,42,3,5,1,NULL,NULL,NULL,12.66,13.83,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(129,43,2,4,2,NULL,NULL,NULL,19.00,10.90,20.00,1,'الرياضيات، الفيزياء','الجمعية','passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(130,43,3,5,2,NULL,NULL,NULL,8.63,NULL,20.00,1,'الرياضيات، الفيزياء','الجمعية','passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(131,44,2,4,1,NULL,NULL,NULL,14.69,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(132,44,3,5,1,NULL,NULL,NULL,7.03,9.87,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(133,45,2,4,2,NULL,NULL,NULL,11.72,14.07,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(134,45,3,5,2,NULL,NULL,NULL,13.74,16.89,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(135,46,2,4,1,NULL,NULL,NULL,14.12,14.12,20.00,1,'اللغة الفرنسية','الجمعية','passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(136,46,3,5,1,NULL,NULL,NULL,7.00,10.14,20.00,1,'اللغة الفرنسية','الجمعية','passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(137,47,2,4,2,NULL,NULL,NULL,9.24,7.35,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(138,47,3,5,2,NULL,NULL,NULL,14.68,7.22,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(139,48,2,4,1,NULL,NULL,NULL,15.94,16.93,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(140,48,3,5,1,NULL,NULL,NULL,15.99,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(141,49,2,4,2,NULL,NULL,NULL,11.22,NULL,20.00,1,'الفيزياء والكيمياء','الجمعية','passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(142,49,3,5,2,NULL,NULL,NULL,13.99,7.36,20.00,1,'الفيزياء والكيمياء','الجمعية','passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(143,50,2,4,1,NULL,NULL,NULL,15.64,11.61,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(144,50,3,5,1,NULL,NULL,NULL,15.13,13.84,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(145,51,2,4,2,NULL,NULL,NULL,7.55,15.81,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(146,51,3,5,2,NULL,NULL,NULL,18.83,16.99,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(147,52,2,4,1,NULL,NULL,NULL,11.49,18.99,20.00,1,'الرياضيات','الجمعية','passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(148,52,3,5,1,NULL,NULL,NULL,14.48,11.88,20.00,1,'الرياضيات','الجمعية','passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(149,53,2,4,2,NULL,NULL,NULL,7.10,7.81,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(150,53,3,5,2,NULL,NULL,NULL,14.59,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09');
/*!40000 ALTER TABLE `orphan_enrollments` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `orphans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `orphans` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `widow_id` bigint(20) unsigned NOT NULL,
  `first_name` varchar(120) DEFAULT NULL,
  `last_name` varchar(120) DEFAULT NULL,
  `gender` enum('male','female') NOT NULL,
  `birth_date` date DEFAULT NULL,
  `education_level_id` bigint(20) unsigned DEFAULT NULL,
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
  KEY `orphans_deleted_at_index` (`deleted_at`),
  KEY `orphans_birth_date_index` (`birth_date`),
  CONSTRAINT `orphans_education_level_id_foreign` FOREIGN KEY (`education_level_id`) REFERENCES `orphans_education_level` (`id`) ON DELETE SET NULL,
  CONSTRAINT `orphans_widow_id_foreign` FOREIGN KEY (`widow_id`) REFERENCES `widows` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `orphans` WRITE;
/*!40000 ALTER TABLE `orphans` DISABLE KEYS */;
INSERT INTO `orphans` VALUES
(1,1,'يوسف','الزهراء','male','2020-06-24',NULL,'ربو مزمن - متابعة شهرية',NULL,NULL,0,NULL,0,0,1,'M000000100',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(2,1,'مريم','الزهراء','female','2015-07-10',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000000101',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(3,2,'مريم','بنعلي','male','2016-11-19',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000000200',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(4,2,'أحمد','بنعلي','female','2011-12-29',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000000201',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(5,2,'سلمى','بنعلي','male','2007-02-15',NULL,NULL,'0651050949','D630746',0,NULL,0,0,1,'M000000202',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(6,3,'أحمد','الحسني','male','2014-03-10',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000000300',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(7,4,'سلمى','المرابط','male','2011-07-24',NULL,NULL,NULL,NULL,1,'خياطة منزلية',0,0,0,'M000000400',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(8,4,'إلياس','المرابط','female','2006-07-16',NULL,NULL,'0620096766','D536762',1,'خياطة منزلية',0,0,0,'M000000401',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(9,5,'إلياس','بوزيان','male','2008-06-29',NULL,NULL,'0630835519','D132138',0,NULL,0,0,1,'M000000500',1,0,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(10,6,'زكرياء','العلوي','male','2005-01-12',NULL,NULL,'0613996822','D924686',0,NULL,0,0,1,'M000000600',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(11,6,'خديجة','العلوي','female','2017-03-04',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000000601',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(12,6,'عمر','العلوي','male','2012-07-26',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000000602',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(13,7,'خديجة','الإدريسي','male','2019-07-13',NULL,'ربو مزمن - متابعة شهرية',NULL,NULL,0,NULL,0,0,1,'M000000700',0,1,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(14,7,'عمر','الإدريسي','female','2014-08-29',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000000701',0,1,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(15,8,'عمر','التازي','male','2016-07-03',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000000800',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(16,9,'هاجر','بنجلون','male','2013-06-12',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000000900',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(17,9,'أيوب','بنجلون','female','2008-03-05',NULL,NULL,'0684019399','D455543',0,NULL,0,0,1,'M000000901',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(18,10,'أيوب','الوردي','male','2010-06-06',NULL,NULL,NULL,NULL,0,NULL,0,1,0,'M000001000',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(19,11,'نور','الفاسي','male','2007-05-03',NULL,NULL,'0695366351','D808141',0,NULL,0,0,1,'M000001100',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(20,11,'حمزة','الفاسي','female','2019-01-05',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000001101',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(21,12,'حمزة','بركة','male','2004-03-23',NULL,NULL,'0630513070','D124536',0,NULL,0,0,1,'M000001200',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(22,12,'يوسف','بركة','female','2016-04-05',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000001201',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(23,12,'مريم','بركة','male','2011-04-06',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000001202',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(24,12,'أحمد','بركة','female','2005-12-12',NULL,NULL,'0634249363','D668993',0,NULL,0,0,1,'M000001203',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(25,13,'يوسف','الصقلي','male','2018-08-11',NULL,'ربو مزمن - متابعة شهرية',NULL,NULL,0,NULL,0,0,1,'M000001300',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(26,13,'مريم','الصقلي','female','2013-04-20',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000001301',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(27,14,'مريم','العمراني','male','2015-07-01',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000001400',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(28,14,'أحمد','العمراني','female','2010-04-27',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000001401',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(29,14,'سلمى','العمراني','male','2005-06-19',NULL,NULL,'0644351337','D810134',0,NULL,0,0,1,'M000001402',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(30,15,'أحمد','الحداد','male','2011-12-03',NULL,NULL,NULL,NULL,1,'تنظيف',0,0,1,'M000001500',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(31,16,'سلمى','الرامي','male','2009-06-14',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000001600',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(32,16,'إلياس','الرامي','female','2004-02-22',NULL,NULL,'0649423945','D341594',0,NULL,0,0,1,'M000001601',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(33,17,'إلياس','الشامي','male','2006-02-14',NULL,NULL,'0613350406','D411303',0,NULL,0,0,1,'M000001700',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(34,17,'زكرياء','الشامي','female','2018-03-28',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000001701',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(35,17,'خديجة','الشامي','male','2013-06-22',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000001702',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(36,18,'زكرياء','بنعمر','male','2020-04-27',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000001800',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(37,18,'خديجة','بنعمر','female','2014-12-19',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000001801',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(38,19,'خديجة','الكتاني','male','2017-04-17',NULL,'ربو مزمن - متابعة شهرية',NULL,NULL,0,NULL,0,0,1,'M000001900',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(39,20,'عمر','السباعي','male','2014-06-29',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000002000',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(40,20,'هاجر','السباعي','female','2009-06-28',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000002001',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(41,20,'أيوب','السباعي','male','2004-04-14',NULL,NULL,'0634715230','D194234',0,NULL,0,0,1,'M000002002',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(42,21,'هاجر','المنصوري','male','2011-07-21',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000002100',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(43,21,'أيوب','المنصوري','female','2006-09-02',NULL,NULL,'0653434191','D372801',0,NULL,0,0,1,'M000002101',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(44,22,'أيوب','بلحاج','male','2008-07-13',NULL,NULL,'0664030251','D260389',0,NULL,0,0,1,'M000002200',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(45,22,'نور','بلحاج','female','2020-05-05',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000002201',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(46,22,'حمزة','بلحاج','male','2015-03-03',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000002202',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(47,22,'يوسف','بلحاج','female','2010-02-16',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000002203',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(48,23,'نور','الغزواني','male','2005-07-24',NULL,NULL,'0667778459','D298729',0,NULL,0,0,1,'M000002300',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(49,24,'حمزة','الرگراگي','male','2018-11-29',NULL,NULL,NULL,NULL,1,'بيع منتجات منزلية',0,0,1,'M000002400',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(50,24,'يوسف','الرگراگي','female','2013-11-27',NULL,NULL,NULL,NULL,1,'بيع منتجات منزلية',0,0,1,'M000002401',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(51,25,'يوسف','أوبيهي','male','2016-05-05',NULL,'ربو مزمن - متابعة شهرية',NULL,NULL,0,NULL,0,0,1,'M000002500',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(52,25,'مريم','أوبيهي','female','2011-02-24',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000002501',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(53,25,'أحمد','أوبيهي','male','2006-05-06',NULL,NULL,'0640990580','D809408',0,NULL,0,0,1,'M000002502',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL);
/*!40000 ALTER TABLE `orphans` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `orphans_education_level`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `orphans_education_level` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name_ar` varchar(100) NOT NULL,
  `name_en` varchar(100) DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `orphans_education_level` WRITE;
/*!40000 ALTER TABLE `orphans_education_level` DISABLE KEYS */;
INSERT INTO `orphans_education_level` VALUES
(1,'لم يلتحق بالمدرسة','Not Enrolled',1,1,'2026-09-15 19:05:08','2026-09-15 19:05:08'),
(2,'روضة أطفال','Kindergarten',2,1,'2026-09-15 19:05:08','2026-09-15 19:05:08'),
(3,'الصف الأول الابتدائي','First Grade',3,1,'2026-09-15 19:05:08','2026-09-15 19:05:08'),
(4,'الصف الثاني الابتدائي','Second Grade',4,1,'2026-09-15 19:05:08','2026-09-15 19:05:08'),
(5,'الصف الثالث الابتدائي','Third Grade',5,1,'2026-09-15 19:05:08','2026-09-15 19:05:08'),
(6,'الصف الرابع الابتدائي','Fourth Grade',6,1,'2026-09-15 19:05:08','2026-09-15 19:05:08'),
(7,'الصف الخامس الابتدائي','Fifth Grade',7,1,'2026-09-15 19:05:08','2026-09-15 19:05:08'),
(8,'الصف السادس الابتدائي','Sixth Grade',8,1,'2026-09-15 19:05:08','2026-09-15 19:05:08'),
(9,'الصف الأول الإعدادي','Seventh Grade',9,1,'2026-09-15 19:05:08','2026-09-15 19:05:08'),
(10,'الصف الثاني الإعدادي','Eighth Grade',10,1,'2026-09-15 19:05:08','2026-09-15 19:05:08'),
(11,'الصف الثالث الإعدادي','Ninth Grade',11,1,'2026-09-15 19:05:08','2026-09-15 19:05:08'),
(12,'الصف الأول الثانوي','Tenth Grade',12,1,'2026-09-15 19:05:08','2026-09-15 19:05:08'),
(13,'الصف الثاني الثانوي','Eleventh Grade',13,1,'2026-09-15 19:05:08','2026-09-15 19:05:08'),
(14,'الصف الثالث الثانوي','Twelfth Grade',14,1,'2026-09-15 19:05:08','2026-09-15 19:05:08'),
(15,'تخرج من الثانوية','High School Graduate',15,1,'2026-09-15 19:05:08','2026-09-15 19:05:08'),
(16,'جامعي','University',16,1,'2026-09-15 19:05:08','2026-09-15 19:05:08'),
(17,'تخرج من الجامعة','University Graduate',17,1,'2026-09-15 19:05:08','2026-09-15 19:05:08');
/*!40000 ALTER TABLE `orphans_education_level` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `partner_fields`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `partner_fields` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `label` varchar(120) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `partner_fields_label_unique` (`label`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `partner_fields` WRITE;
/*!40000 ALTER TABLE `partner_fields` DISABLE KEYS */;
INSERT INTO `partner_fields` VALUES
(1,'التغذية','2026-09-15 19:05:09','2026-09-15 19:05:09');
/*!40000 ALTER TABLE `partner_fields` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `partner_subfields`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `partner_subfields` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `field_id` bigint(20) unsigned NOT NULL,
  `label` varchar(120) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `partner_subfields_field_id_label_unique` (`field_id`,`label`),
  CONSTRAINT `partner_subfields_field_id_foreign` FOREIGN KEY (`field_id`) REFERENCES `partner_fields` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `partner_subfields` WRITE;
/*!40000 ALTER TABLE `partner_subfields` DISABLE KEYS */;
INSERT INTO `partner_subfields` VALUES
(1,1,'مواد غذائية','2026-09-15 19:05:09','2026-09-15 19:05:09');
/*!40000 ALTER TABLE `partner_subfields` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `partners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `partners` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(120) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `email` varchar(120) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `field_id` bigint(20) unsigned DEFAULT NULL,
  `subfield_id` bigint(20) unsigned DEFAULT NULL,
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

LOCK TABLES `partners` WRITE;
/*!40000 ALTER TABLE `partners` DISABLE KEYS */;
INSERT INTO `partners` VALUES
(1,'جمعية الإحسان','0522334455',NULL,NULL,1,1,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(2,'مؤسسة الخير','0522667788',NULL,NULL,1,1,'2026-09-15 19:05:09','2026-09-15 19:05:09');
/*!40000 ALTER TABLE `partners` ENABLE KEYS */;
UNLOCK TABLES;
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

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `personal_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) unsigned NOT NULL,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `personal_access_tokens` WRITE;
/*!40000 ALTER TABLE `personal_access_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `personal_access_tokens` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `schools`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `schools` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
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

LOCK TABLES `schools` WRITE;
/*!40000 ALTER TABLE `schools` DISABLE KEYS */;
INSERT INTO `schools` VALUES
(1,'مدرسة الأمل الابتدائية','school',0,0,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(2,'مدرسة النور الخاصة','school',1,1,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(3,'إعدادية الفتح','school',0,0,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(4,'ثانوية النهضة','school',0,0,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(5,'كلية العلوم - جامعة ابن زهر','university',0,0,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(6,'المعهد العالي للتكنولوجيا التطبيقية','university',1,0,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09');
/*!40000 ALTER TABLE `schools` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;
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

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `skills`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `skills` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `label` varchar(120) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `skills_label_unique` (`label`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `skills` WRITE;
/*!40000 ALTER TABLE `skills` DISABLE KEYS */;
INSERT INTO `skills` VALUES
(1,'خياطة','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(2,'طبخ','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(3,'تنظيف','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(4,'تدريس','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(5,'أشغال يدوية','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(6,'حياكة','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(7,'تطريز','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(8,'حلاقة نسائية','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(9,'ماكياج','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(10,'حاسوب','2026-09-15 19:05:08','2026-09-15 19:05:08');
/*!40000 ALTER TABLE `skills` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `transfers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `transfers` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `fiscal_year_id` bigint(20) unsigned NOT NULL,
  `transfer_date` date NOT NULL,
  `from_account_id` bigint(20) unsigned NOT NULL,
  `to_account_id` bigint(20) unsigned NOT NULL,
  `amount` decimal(16,2) NOT NULL,
  `remarks` text DEFAULT NULL,
  `status` enum('Draft','Approved') NOT NULL DEFAULT 'Draft',
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `approved_by` bigint(20) unsigned DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `transfers_fiscal_year_id_foreign` (`fiscal_year_id`),
  KEY `transfers_from_account_id_foreign` (`from_account_id`),
  KEY `transfers_to_account_id_foreign` (`to_account_id`),
  KEY `transfers_created_by_foreign` (`created_by`),
  KEY `transfers_approved_by_foreign` (`approved_by`),
  KEY `transfers_status_date_index` (`status`,`transfer_date`),
  CONSTRAINT `transfers_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`),
  CONSTRAINT `transfers_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `transfers_fiscal_year_id_foreign` FOREIGN KEY (`fiscal_year_id`) REFERENCES `fiscal_years` (`id`),
  CONSTRAINT `transfers_from_account_id_foreign` FOREIGN KEY (`from_account_id`) REFERENCES `bank_accounts` (`id`),
  CONSTRAINT `transfers_to_account_id_foreign` FOREIGN KEY (`to_account_id`) REFERENCES `bank_accounts` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `transfers` WRITE;
/*!40000 ALTER TABLE `transfers` DISABLE KEYS */;
INSERT INTO `transfers` VALUES
(1,1,'2026-09-06',1,2,6000.00,'تغطية مستحقات الكفالات الشهرية','Approved',1,1,'2026-09-15 19:05:10','2026-09-15 19:05:10','2026-09-15 19:05:10'),
(2,1,'2026-09-15',2,1,1500.00,'إرجاع فائض الشهر الماضي','Draft',1,NULL,NULL,'2026-09-15 19:05:10','2026-09-15 19:05:10');
/*!40000 ALTER TABLE `transfers` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `transport_month_lines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `transport_month_lines` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `transport_month_id` bigint(20) unsigned NOT NULL,
  `support_id` bigint(20) unsigned NOT NULL,
  `mode` varchar(20) NOT NULL,
  `rode_consistently` tinyint(1) NOT NULL DEFAULT 1,
  `attendances` smallint(5) unsigned NOT NULL DEFAULT 0,
  `rate` decimal(8,2) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `transport_month_lines_unique` (`transport_month_id`,`support_id`),
  KEY `transport_month_lines_support_id_foreign` (`support_id`),
  KEY `transport_month_lines_mode_index` (`transport_month_id`,`mode`),
  CONSTRAINT `transport_month_lines_support_id_foreign` FOREIGN KEY (`support_id`) REFERENCES `transport_support` (`id`) ON DELETE CASCADE,
  CONSTRAINT `transport_month_lines_transport_month_id_foreign` FOREIGN KEY (`transport_month_id`) REFERENCES `transport_months` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=88 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `transport_month_lines` WRITE;
/*!40000 ALTER TABLE `transport_month_lines` DISABLE KEYS */;
INSERT INTO `transport_month_lines` VALUES
(1,1,2,'bus',0,0,NULL,0.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(2,1,4,'bus',1,0,NULL,175.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(3,1,6,'bus',1,0,NULL,175.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(4,1,7,'bus',1,0,NULL,175.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(5,1,9,'bus',1,0,NULL,175.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(6,1,10,'bus',1,0,NULL,175.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(7,1,11,'allowance',0,7,15.00,105.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(8,1,13,'bus',1,0,NULL,175.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(9,1,14,'bus',1,0,NULL,175.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(10,1,16,'bus',0,0,NULL,0.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(11,1,17,'bus',1,0,NULL,175.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(12,1,19,'allowance',0,7,12.00,84.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(13,1,20,'bus',1,0,NULL,175.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(14,1,21,'bus',1,0,NULL,175.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(15,1,23,'bus',1,0,NULL,175.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(16,1,24,'bus',1,0,NULL,175.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(17,1,26,'bus',1,0,NULL,175.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(18,1,28,'bus',1,0,NULL,175.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(19,1,1,'bus',0,0,NULL,0.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(20,1,3,'allowance',0,10,10.00,100.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(21,1,5,'bus',1,0,NULL,175.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(22,1,8,'bus',1,0,NULL,175.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(23,1,12,'bus',1,0,NULL,175.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(24,1,15,'bus',1,0,NULL,175.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(25,1,18,'bus',1,0,NULL,175.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(26,1,22,'bus',1,0,NULL,175.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(27,1,25,'bus',1,0,NULL,175.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(28,1,27,'allowance',0,8,10.00,80.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(29,1,29,'bus',1,0,NULL,175.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(30,2,2,'bus',1,0,NULL,193.64,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(31,2,4,'bus',1,0,NULL,193.64,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(32,2,6,'bus',1,0,NULL,193.64,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(33,2,7,'bus',1,0,NULL,193.64,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(34,2,9,'bus',1,0,NULL,193.64,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(35,2,10,'bus',1,0,NULL,193.64,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(36,2,11,'allowance',0,8,15.00,120.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(37,2,13,'bus',1,0,NULL,193.64,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(38,2,14,'bus',0,0,NULL,0.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(39,2,16,'bus',1,0,NULL,193.64,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(40,2,17,'bus',1,0,NULL,193.64,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(41,2,19,'allowance',0,8,12.00,96.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(42,2,20,'bus',1,0,NULL,193.64,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(43,2,21,'bus',1,0,NULL,193.64,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(44,2,23,'bus',1,0,NULL,193.64,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(45,2,24,'bus',1,0,NULL,193.64,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(46,2,26,'bus',1,0,NULL,193.64,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(47,2,28,'bus',0,0,NULL,0.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(48,2,1,'bus',1,0,NULL,193.63,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(49,2,3,'allowance',0,6,10.00,60.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(50,2,5,'bus',1,0,NULL,193.63,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(51,2,8,'bus',1,0,NULL,193.63,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(52,2,12,'bus',1,0,NULL,193.63,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(53,2,15,'bus',1,0,NULL,193.63,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(54,2,18,'bus',1,0,NULL,193.63,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(55,2,22,'bus',1,0,NULL,193.63,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(56,2,25,'bus',0,0,NULL,0.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(57,2,27,'allowance',0,9,10.00,90.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(58,2,29,'bus',1,0,NULL,193.63,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(59,3,2,'bus',1,0,NULL,171.82,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(60,3,4,'bus',1,0,NULL,171.82,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(61,3,6,'bus',1,0,NULL,171.82,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(62,3,7,'bus',1,0,NULL,171.82,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(63,3,9,'bus',1,0,NULL,171.82,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(64,3,10,'bus',1,0,NULL,171.82,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(65,3,11,'allowance',0,9,15.00,135.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(66,3,13,'bus',0,0,NULL,0.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(67,3,14,'bus',1,0,NULL,171.82,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(68,3,16,'bus',1,0,NULL,171.82,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(69,3,17,'bus',1,0,NULL,171.82,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(70,3,19,'allowance',0,9,12.00,108.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(71,3,20,'bus',1,0,NULL,171.82,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(72,3,21,'bus',1,0,NULL,171.82,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(73,3,23,'bus',1,0,NULL,171.82,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(74,3,24,'bus',1,0,NULL,171.82,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(75,3,26,'bus',0,0,NULL,0.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(76,3,28,'bus',1,0,NULL,171.82,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(77,3,1,'bus',1,0,NULL,171.82,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(78,3,3,'allowance',0,7,10.00,70.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(79,3,5,'bus',1,0,NULL,171.82,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(80,3,8,'bus',1,0,NULL,171.82,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(81,3,12,'bus',1,0,NULL,171.82,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(82,3,15,'bus',1,0,NULL,171.81,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(83,3,18,'bus',1,0,NULL,171.81,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(84,3,22,'bus',0,0,NULL,0.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(85,3,25,'bus',1,0,NULL,171.81,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(86,3,27,'allowance',0,10,10.00,100.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(87,3,29,'bus',1,0,NULL,171.81,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09');
/*!40000 ALTER TABLE `transport_month_lines` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `transport_months`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `transport_months` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `academic_year_id` bigint(20) unsigned NOT NULL,
  `period_month` date NOT NULL,
  `fuel_cost` decimal(10,2) NOT NULL DEFAULT 0.00,
  `driver_cost` decimal(10,2) NOT NULL DEFAULT 0.00,
  `other_cost` decimal(10,2) NOT NULL DEFAULT 0.00,
  `bus_expense_id` bigint(20) unsigned DEFAULT NULL,
  `bus_settled_at` timestamp NULL DEFAULT NULL,
  `allowance_expense_id` bigint(20) unsigned DEFAULT NULL,
  `allowance_settled_at` timestamp NULL DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `transport_months_year_month_unique` (`academic_year_id`,`period_month`),
  KEY `transport_months_bus_expense_id_foreign` (`bus_expense_id`),
  KEY `transport_months_allowance_expense_id_foreign` (`allowance_expense_id`),
  CONSTRAINT `transport_months_academic_year_id_foreign` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE CASCADE,
  CONSTRAINT `transport_months_allowance_expense_id_foreign` FOREIGN KEY (`allowance_expense_id`) REFERENCES `expenses` (`id`) ON DELETE SET NULL,
  CONSTRAINT `transport_months_bus_expense_id_foreign` FOREIGN KEY (`bus_expense_id`) REFERENCES `expenses` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `transport_months` WRITE;
/*!40000 ALTER TABLE `transport_months` DISABLE KEYS */;
INSERT INTO `transport_months` VALUES
(1,1,'2026-10-01',1850.00,2000.00,0.00,NULL,'2026-10-31 23:59:59',NULL,'2026-10-31 23:59:59',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(2,1,'2026-11-01',1920.00,2000.00,340.00,NULL,'2026-11-30 23:59:59',NULL,NULL,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(3,1,'2026-12-01',1780.00,2000.00,0.00,NULL,NULL,NULL,NULL,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09');
/*!40000 ALTER TABLE `transport_months` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `transport_support`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `transport_support` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `enrollment_id` bigint(20) unsigned NOT NULL,
  `mode` varchar(20) NOT NULL DEFAULT 'bus',
  `pickup_point` varchar(150) DEFAULT NULL,
  `allowance_rate` decimal(8,2) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `transport_support_enrollment_status_index` (`enrollment_id`,`status`),
  KEY `transport_support_mode_status_index` (`mode`,`status`),
  CONSTRAINT `transport_support_enrollment_id_foreign` FOREIGN KEY (`enrollment_id`) REFERENCES `orphan_enrollments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `transport_support` WRITE;
/*!40000 ALTER TABLE `transport_support` DISABLE KEYS */;
INSERT INTO `transport_support` VALUES
(1,1,'bus','أمام المسجد',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(2,3,'bus','أمام الفرن',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(3,4,'allowance',NULL,10.00,'2026-09-15',NULL,'active','يسكن خارج مسار الحافلة','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(4,5,'bus','أمام المسجد',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(5,7,'bus','أمام الفرن',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(6,9,'bus','أمام المسجد',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(7,11,'bus','أمام الفرن',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(8,13,'bus','أمام المسجد',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(9,15,'bus','أمام الفرن',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(10,17,'bus','أمام المسجد',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(11,18,'allowance',NULL,15.00,'2026-09-15',NULL,'active','يسكن خارج مسار الحافلة','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(12,19,'bus','أمام الفرن',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(13,21,'bus','أمام المسجد',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(14,23,'bus','أمام الفرن',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(15,25,'bus','أمام المسجد',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(16,27,'bus','أمام الفرن',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(17,29,'bus','أمام المسجد',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(18,31,'bus','أمام الفرن',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(19,32,'allowance',NULL,12.00,'2026-09-15',NULL,'active','يسكن خارج مسار الحافلة','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(20,33,'bus','أمام المسجد',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(21,35,'bus','أمام الفرن',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(22,37,'bus','أمام المسجد',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(23,39,'bus','أمام الفرن',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(24,41,'bus','أمام المسجد',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(25,43,'bus','أمام الفرن',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(26,45,'bus','أمام المسجد',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(27,46,'allowance',NULL,10.00,'2026-09-15',NULL,'active','يسكن خارج مسار الحافلة','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(28,47,'bus','أمام الفرن',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(29,49,'bus','أمام المسجد',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09');
/*!40000 ALTER TABLE `transport_support` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
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

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
(1,'بنصديق محمد','admin@amaso.org','admin',NULL,NULL,1,NULL,'2026-09-15 19:05:08','$2y$12$uBv9dbZUyHWRZT9.NgkOPOHai8Osr4iDeuZmOkYXJ3zqWaELph2SK',NULL,'2026-09-15 19:05:08','2026-09-15 19:05:08'),
(2,'سارة المحاسبة','accountant@amaso.org','accountant',NULL,NULL,1,NULL,'2026-09-15 19:05:08','$2y$12$gqXpsKwKlMAyElNl9qX3K.YZ42ybLAd46Z3JgoF9/SA3BViL.t.wq',NULL,'2026-09-15 19:05:08','2026-09-15 19:05:08'),
(3,'أحمد الأخصائي','social@amaso.org','social_worker',NULL,NULL,1,NULL,'2026-09-15 19:05:08','$2y$12$KmFqBJUhckvlPxClwHh6l.bAAJq/1K/JbQCVA9G.8EDYAGSn903YO',NULL,'2026-09-15 19:05:08','2026-09-15 19:05:08');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
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
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `widow_id` bigint(20) unsigned NOT NULL,
  `aid_type_id` bigint(20) unsigned NOT NULL,
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

LOCK TABLES `widow_aid` WRITE;
/*!40000 ALTER TABLE `widow_aid` DISABLE KEYS */;
INSERT INTO `widow_aid` VALUES
(1,1,1,1,NULL,NULL),
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
UNLOCK TABLES;
DROP TABLE IF EXISTS `widow_expense_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `widow_expense_categories` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `widow_expense_categories` WRITE;
/*!40000 ALTER TABLE `widow_expense_categories` DISABLE KEYS */;
INSERT INTO `widow_expense_categories` VALUES
(1,'إيجار','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(2,'طعام','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(3,'دواء','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(4,'تعليم','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(5,'فواتير','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(6,'مواصلات','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(7,'ملابس','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(8,'مستلزمات منزلية','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(9,'رعاية صحية','2026-09-15 19:05:08','2026-09-15 19:05:08');
/*!40000 ALTER TABLE `widow_expense_categories` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `widow_files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `widow_files` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `widow_id` bigint(20) unsigned NOT NULL,
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

LOCK TABLES `widow_files` WRITE;
/*!40000 ALTER TABLE `widow_files` DISABLE KEYS */;
INSERT INTO `widow_files` VALUES
(1,1,'widow',1,1,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(2,2,'widow',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(3,3,'widow',0,1,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(4,4,'widow',1,0,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(5,5,'widow',0,1,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(6,6,'widow',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(7,7,'widow',1,1,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(8,8,'widow',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(9,9,'widow',0,1,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(10,10,'widow',1,0,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(11,11,'widow',0,1,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(12,12,'widow',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(13,13,'widow',1,1,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(14,14,'widow',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(15,15,'widow',0,1,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(16,16,'widow',1,0,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(17,17,'widow',0,1,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(18,18,'widow',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(19,19,'widow',1,1,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(20,20,'widow',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(21,21,'widow',0,1,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(22,22,'widow',1,0,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(23,23,'widow',0,1,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(24,24,'widow',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(25,25,'widow',1,1,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(26,26,'widow',0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09');
/*!40000 ALTER TABLE `widow_files` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `widow_illness`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `widow_illness` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `widow_id` bigint(20) unsigned NOT NULL,
  `illness_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `widow_illness_widow_id_illness_id_unique` (`widow_id`,`illness_id`),
  KEY `widow_illness_illness_id_foreign` (`illness_id`),
  CONSTRAINT `widow_illness_illness_id_foreign` FOREIGN KEY (`illness_id`) REFERENCES `illnesses` (`id`),
  CONSTRAINT `widow_illness_widow_id_foreign` FOREIGN KEY (`widow_id`) REFERENCES `widows` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `widow_illness` WRITE;
/*!40000 ALTER TABLE `widow_illness` DISABLE KEYS */;
INSERT INTO `widow_illness` VALUES
(1,1,6,NULL,NULL),
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
UNLOCK TABLES;
DROP TABLE IF EXISTS `widow_income_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `widow_income_categories` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `widow_income_categories` WRITE;
/*!40000 ALTER TABLE `widow_income_categories` DISABLE KEYS */;
INSERT INTO `widow_income_categories` VALUES
(1,'راتب','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(2,'معاش','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(3,'مساعدة','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(4,'تجارة','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(5,'عمل حر','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(6,'تبرعات','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(7,'إيجار عقار','2026-09-15 19:05:08','2026-09-15 19:05:08'),
(8,'حرفة','2026-09-15 19:05:08','2026-09-15 19:05:08');
/*!40000 ALTER TABLE `widow_income_categories` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `widow_maouna`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `widow_maouna` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `widow_id` bigint(20) unsigned NOT NULL,
  `partner_id` bigint(20) unsigned NOT NULL,
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

LOCK TABLES `widow_maouna` WRITE;
/*!40000 ALTER TABLE `widow_maouna` DISABLE KEYS */;
INSERT INTO `widow_maouna` VALUES
(1,1,1,376.00,1,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(2,3,1,410.00,1,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(3,5,1,316.00,1,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(4,7,1,284.00,1,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(5,9,1,400.00,1,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(6,11,1,223.00,1,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(7,13,1,229.00,1,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(8,15,1,354.00,1,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(9,17,1,333.00,1,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(10,19,1,242.00,1,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(11,21,1,387.00,1,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(12,23,1,255.00,1,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(13,25,1,351.00,1,'2026-09-15 19:05:09','2026-09-15 19:05:09');
/*!40000 ALTER TABLE `widow_maouna` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `widow_phones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `widow_phones` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `widow_id` bigint(20) unsigned NOT NULL,
  `phone` varchar(30) NOT NULL,
  `label` varchar(60) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `widow_phones_widow_id_foreign` (`widow_id`),
  CONSTRAINT `widow_phones_widow_id_foreign` FOREIGN KEY (`widow_id`) REFERENCES `widows` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `widow_phones` WRITE;
/*!40000 ALTER TABLE `widow_phones` DISABLE KEYS */;
INSERT INTO `widow_phones` VALUES
(1,1,'0572520387','هاتف الجيران','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(2,4,'0542429547','هاتف الجيران','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(3,7,'0581350729','هاتف الجيران','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(4,10,'0587232454','هاتف الجيران','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(5,13,'0564667591','هاتف الجيران','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(6,16,'0567986163','هاتف الجيران','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(7,19,'0536920912','هاتف الجيران','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(8,22,'0523813080','هاتف الجيران','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(9,25,'0592555986','هاتف الجيران','2026-09-15 19:05:09','2026-09-15 19:05:09');
/*!40000 ALTER TABLE `widow_phones` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `widow_skill`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `widow_skill` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `widow_id` bigint(20) unsigned NOT NULL,
  `skill_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `widow_skill_widow_id_skill_id_unique` (`widow_id`,`skill_id`),
  KEY `widow_skill_skill_id_foreign` (`skill_id`),
  CONSTRAINT `widow_skill_skill_id_foreign` FOREIGN KEY (`skill_id`) REFERENCES `skills` (`id`),
  CONSTRAINT `widow_skill_widow_id_foreign` FOREIGN KEY (`widow_id`) REFERENCES `widows` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `widow_skill` WRITE;
/*!40000 ALTER TABLE `widow_skill` DISABLE KEYS */;
INSERT INTO `widow_skill` VALUES
(1,1,5,NULL,NULL),
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
UNLOCK TABLES;
DROP TABLE IF EXISTS `widow_social`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `widow_social` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `widow_id` bigint(20) unsigned NOT NULL,
  `housing_type_id` bigint(20) unsigned NOT NULL,
  `housing_status` enum('owned','rented','free') NOT NULL,
  `has_water` tinyint(1) NOT NULL DEFAULT 0,
  `has_electricity` tinyint(1) NOT NULL DEFAULT 0,
  `has_furniture` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `widow_social_widow_id_foreign` (`widow_id`),
  KEY `widow_social_housing_type_id_foreign` (`housing_type_id`),
  CONSTRAINT `widow_social_housing_type_id_foreign` FOREIGN KEY (`housing_type_id`) REFERENCES `housing_types` (`id`),
  CONSTRAINT `widow_social_widow_id_foreign` FOREIGN KEY (`widow_id`) REFERENCES `widows` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `widow_social` WRITE;
/*!40000 ALTER TABLE `widow_social` DISABLE KEYS */;
INSERT INTO `widow_social` VALUES
(1,1,1,'rented',0,0,0,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(2,2,2,'owned',1,1,1,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(3,3,3,'free',1,1,2,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(4,4,4,'rented',1,1,3,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(5,5,5,'owned',1,1,4,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(6,6,1,'free',0,1,5,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(7,7,2,'rented',1,1,0,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(8,8,3,'owned',1,0,1,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(9,9,4,'free',1,1,2,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(10,10,5,'rented',1,1,3,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(11,11,1,'owned',0,1,4,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(12,12,2,'free',1,1,5,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(13,13,3,'rented',1,1,0,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(14,14,4,'owned',1,1,1,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(15,15,5,'free',1,0,2,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(16,16,1,'rented',0,1,3,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(17,17,2,'owned',1,1,4,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(18,18,3,'free',1,1,5,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(19,19,4,'rented',1,1,0,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(20,20,5,'owned',1,1,1,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(21,21,1,'free',0,1,2,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(22,22,2,'rented',1,0,3,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(23,23,3,'owned',1,1,4,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(24,24,4,'free',1,1,5,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(25,25,5,'rented',1,1,0,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(26,26,1,'owned',0,1,1,'2026-09-15 19:05:09','2026-09-15 19:05:09');
/*!40000 ALTER TABLE `widow_social` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `widow_social_expense`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `widow_social_expense` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `widow_id` bigint(20) unsigned NOT NULL,
  `expense_category_id` bigint(20) unsigned NOT NULL,
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

LOCK TABLES `widow_social_expense` WRITE;
/*!40000 ALTER TABLE `widow_social_expense` DISABLE KEYS */;
INSERT INTO `widow_social_expense` VALUES
(1,1,2,1000.00,'مصاريف التغذية','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(2,1,1,700.00,'كراء السكن','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(3,1,3,150.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(4,2,2,1250.00,'مصاريف التغذية','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(5,2,4,300.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(6,3,2,750.00,'مصاريف التغذية','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(7,3,5,220.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(8,4,2,1000.00,'مصاريف التغذية','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(9,4,1,700.00,'كراء السكن','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(10,4,6,400.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(11,5,2,750.00,'مصاريف التغذية','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(12,5,3,150.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(13,6,2,1250.00,'مصاريف التغذية','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(14,6,4,300.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(15,7,2,1000.00,'مصاريف التغذية','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(16,7,1,700.00,'كراء السكن','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(17,7,5,220.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(18,8,2,750.00,'مصاريف التغذية','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(19,8,6,400.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(20,9,2,1000.00,'مصاريف التغذية','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(21,9,3,150.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(22,10,2,750.00,'مصاريف التغذية','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(23,10,1,700.00,'كراء السكن','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(24,10,4,300.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(25,11,2,1000.00,'مصاريف التغذية','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(26,11,5,220.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(27,12,2,1500.00,'مصاريف التغذية','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(28,12,6,400.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(29,13,2,1000.00,'مصاريف التغذية','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(30,13,1,700.00,'كراء السكن','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(31,13,3,150.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(32,14,2,1250.00,'مصاريف التغذية','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(33,14,4,300.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(34,15,2,750.00,'مصاريف التغذية','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(35,15,5,220.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(36,16,2,1000.00,'مصاريف التغذية','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(37,16,1,700.00,'كراء السكن','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(38,16,6,400.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(39,17,2,1250.00,'مصاريف التغذية','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(40,17,3,150.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(41,18,2,1000.00,'مصاريف التغذية','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(42,18,4,300.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(43,19,2,750.00,'مصاريف التغذية','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(44,19,1,700.00,'كراء السكن','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(45,19,5,220.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(46,20,2,1250.00,'مصاريف التغذية','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(47,20,6,400.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(48,21,2,1000.00,'مصاريف التغذية','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(49,21,3,150.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(50,22,2,1500.00,'مصاريف التغذية','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(51,22,1,700.00,'كراء السكن','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(52,22,4,300.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(53,23,2,750.00,'مصاريف التغذية','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(54,23,5,220.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(55,24,2,1000.00,'مصاريف التغذية','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(56,24,6,400.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(57,25,2,1250.00,'مصاريف التغذية','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(58,25,1,700.00,'كراء السكن','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(59,25,3,150.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09'),
(60,26,2,500.00,'مصاريف التغذية','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(61,26,4,300.00,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09');
/*!40000 ALTER TABLE `widow_social_expense` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `widow_social_income`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `widow_social_income` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `widow_id` bigint(20) unsigned NOT NULL,
  `income_category_id` bigint(20) unsigned NOT NULL,
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

LOCK TABLES `widow_social_income` WRITE;
/*!40000 ALTER TABLE `widow_social_income` DISABLE KEYS */;
INSERT INTO `widow_social_income` VALUES
(1,1,1,600.00,'مدخول شهري قار','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(2,1,5,200.00,'عمل موسمي','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(3,2,2,850.00,'مدخول شهري قار','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(4,3,1,400.00,'مدخول شهري قار','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(5,5,1,750.00,'مدخول شهري قار','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(6,6,2,600.00,'مدخول شهري قار','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(7,7,1,850.00,'مدخول شهري قار','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(8,7,5,200.00,'عمل موسمي','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(9,8,2,400.00,'مدخول شهري قار','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(10,9,1,1100.00,'مدخول شهري قار','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(11,10,2,750.00,'مدخول شهري قار','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(12,10,5,200.00,'عمل موسمي','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(13,11,1,600.00,'مدخول شهري قار','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(14,13,1,400.00,'مدخول شهري قار','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(15,13,5,200.00,'عمل موسمي','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(16,14,2,1100.00,'مدخول شهري قار','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(17,15,1,750.00,'مدخول شهري قار','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(18,16,2,600.00,'مدخول شهري قار','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(19,16,5,200.00,'عمل موسمي','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(20,17,1,850.00,'مدخول شهري قار','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(21,18,2,400.00,'مدخول شهري قار','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(22,19,1,1100.00,'مدخول شهري قار','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(23,19,5,200.00,'عمل موسمي','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(24,21,1,600.00,'مدخول شهري قار','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(25,22,2,850.00,'مدخول شهري قار','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(26,22,5,200.00,'عمل موسمي','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(27,23,1,400.00,'مدخول شهري قار','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(28,24,2,1100.00,'مدخول شهري قار','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(29,25,1,750.00,'مدخول شهري قار','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(30,25,5,200.00,'عمل موسمي','2026-09-15 19:05:09','2026-09-15 19:05:09'),
(31,26,2,600.00,'مدخول شهري قار','2026-09-15 19:05:09','2026-09-15 19:05:09');
/*!40000 ALTER TABLE `widow_social_income` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `widows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `widows` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
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
  PRIMARY KEY (`id`),
  KEY `widows_deleted_at_index` (`deleted_at`),
  KEY `widows_neighborhood_index` (`neighborhood`),
  KEY `widows_admission_date_index` (`admission_date`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `widows` WRITE;
/*!40000 ALTER TABLE `widows` DISABLE KEYS */;
INSERT INTO `widows` VALUES
(1,'فاطمة','الزهراء','0672431422',NULL,'شارع 0, حي السلام','حي السلام','2026-04-15','DEMO000001','1982-09-15','Widowed','عمة الأيتام','بدون',0,NULL,NULL,NULL,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(2,'خديجة','بنعلي','0657658678',NULL,'شارع 1, حي النور','حي النور','2026-06-15','DEMO000002','1975-09-15','Widowed',NULL,'ابتدائي',0,NULL,NULL,NULL,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(3,'أمينة','الحسني','0647281030',NULL,'شارع 2, حي الأمل','حي الأمل','2025-06-15','DEMO000003','1992-09-15','Widowed',NULL,'إعدادي',0,NULL,NULL,NULL,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(4,'زينب','المرابط','0614951401',NULL,'شارع 3, حي الفتح','حي الفتح','2024-06-15','DEMO000004','1974-09-15','Widowed',NULL,'ثانوي',0,NULL,NULL,NULL,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(5,'سعاد','بوزيان','0658363621',NULL,'شارع 4, حي الرحمة','حي الرحمة','2024-06-15','DEMO000005','1990-09-15','Widowed','عمة الأيتام','جامعي',0,NULL,NULL,NULL,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(6,'نادية','العلوي','0674282055',NULL,'شارع 5, حي السلام','حي السلام','2024-05-15','DEMO000006','1993-09-15','Widowed',NULL,'بدون',0,NULL,NULL,NULL,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(7,'حياة','الإدريسي','0682408106',NULL,'شارع 6, حي النور','حي النور','2026-06-15','DEMO000007','1988-09-15','Widowed',NULL,'ابتدائي',0,NULL,NULL,NULL,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(8,'رشيدة','التازي','0660101141',NULL,'شارع 7, حي الأمل','حي الأمل','2024-10-15','DEMO000008','1988-09-15','Widowed',NULL,'إعدادي',0,NULL,NULL,NULL,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(9,'لطيفة','بنجلون','0662551928',NULL,'شارع 8, حي الفتح','حي الفتح','2025-04-15','DEMO000009','1996-09-15','Widowed','عمة الأيتام','ثانوي',0,NULL,NULL,NULL,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(10,'سميرة','الوردي','0610303359',NULL,'شارع 9, حي الرحمة','حي الرحمة','2026-02-15','DEMO000010','1983-09-15','Widowed',NULL,'جامعي',0,NULL,NULL,NULL,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(11,'كريمة','الفاسي','0657197331',NULL,'شارع 10, حي السلام','حي السلام','2024-12-15','DEMO000011','1987-09-15','Widowed',NULL,'بدون',0,NULL,NULL,NULL,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(12,'نعيمة','بركة','0662158246',NULL,'شارع 11, حي المسيرة','حي المسيرة','2026-01-15','DEMO000012','1980-09-15','Widowed',NULL,'ابتدائي',0,NULL,NULL,NULL,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(13,'حنان','الصقلي','0652657107',NULL,'شارع 12, حي النهضة','حي النهضة','2025-04-15','DEMO000013','1979-09-15','Widowed','عمة الأيتام','إعدادي',1,'إعاقة حركية جزئية',NULL,NULL,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(14,'بشرى','العمراني','0690153411',NULL,'شارع 13, حي الوفاق','حي الوفاق','2025-10-15','DEMO000014','1996-09-15','Widowed',NULL,'ثانوي',0,NULL,NULL,NULL,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(15,'مليكة','الحداد','0636516107',NULL,'شارع 14, حي السلام','حي السلام','2025-04-15','DEMO000015','1971-09-15','Widowed',NULL,'جامعي',0,NULL,NULL,NULL,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(16,'سناء','الرامي','0689209486',NULL,'شارع 15, حي النور','حي النور','2024-11-15','DEMO000016','1981-09-15','Widowed',NULL,'بدون',0,NULL,NULL,NULL,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(17,'وفاء','الشامي','0612999385',NULL,'شارع 16, حي المسيرة','حي المسيرة','2024-05-15','DEMO000017','1993-09-15','Widowed','عمة الأيتام','ابتدائي',0,NULL,NULL,NULL,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(18,'ثريا','بنعمر','0672192244',NULL,'شارع 17, حي الأمل','حي الأمل','2026-03-15','DEMO000018','1978-09-15','Widowed',NULL,'إعدادي',0,NULL,NULL,NULL,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(19,'جميلة','الكتاني','0695570981',NULL,'شارع 18, حي النهضة','حي النهضة','2025-12-15','DEMO000019','1973-09-15','Widowed',NULL,'ثانوي',0,NULL,NULL,NULL,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(20,'رجاء','السباعي','0672599480',NULL,'شارع 19, حي الفتح','حي الفتح','2025-12-15','DEMO000020','1975-09-15','Widowed',NULL,'جامعي',0,NULL,NULL,NULL,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(21,'هدى','المنصوري','0676448432',NULL,'شارع 20, حي الوفاق','حي الوفاق','2026-01-15','DEMO000021','1992-09-15','Widowed','عمة الأيتام','بدون',0,NULL,NULL,NULL,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(22,'أسماء','بلحاج','0617010906',NULL,'شارع 21, حي الرحمة','حي الرحمة','2025-04-15','DEMO000022','1981-09-15','Widowed',NULL,'ابتدائي',0,NULL,NULL,NULL,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(23,'ابتسام','الغزواني','0688980017',NULL,'شارع 22, حي المسيرة','حي المسيرة','2025-07-15','DEMO000023','1992-09-15','Widowed',NULL,'إعدادي',0,NULL,NULL,NULL,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(24,'مينة','الرگراگي','0637529569',NULL,'شارع 23, حي النهضة','حي النهضة','2025-02-15','DEMO000024','1976-09-15','Widowed',NULL,'ثانوي',0,NULL,NULL,NULL,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(25,'فتيحة','أوبيهي','0623654592',NULL,'شارع 24, حي الوفاق','حي الوفاق','2024-07-15','DEMO000025','1973-09-15','Widowed','عمة الأيتام','جامعي',0,NULL,NULL,NULL,NULL,'2026-09-15 19:05:09','2026-09-15 19:05:09',NULL),
(26,'زهور','التمسماني','0621015133',NULL,'شارع 25, حي السلام','حي السلام','2024-04-15','DEMO000026','1995-09-15','Widowed',NULL,'بدون',0,NULL,'2026-09-12','graduated','انتقلت الأسرة إلى مدينة أخرى بعد تحسن وضعها','2026-09-15 19:05:09','2026-09-15 19:05:10','2026-09-15 19:05:10');
/*!40000 ALTER TABLE `widows` ENABLE KEYS */;
UNLOCK TABLES;
/*!50001 DROP VIEW IF EXISTS `v_current_cash`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED SQL SECURITY INVOKER */
/*!50013 */
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
