-- AMASO - قاعدة بيانات تجريبية / Demo database
-- جمعية المنصور لكفالة اليتيم
--
-- Generated: 2026-09-22  (by backend/regenerate-demo-sql.sh)
-- Charset:   utf8mb4 / utf8mb4_unicode_ci
--
-- ماذا يحتوي هذا الملف / What this file contains
--   Schema for all 62 tables and the v_current_cash view, plus reference
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
-- حسابات الدخول / Login accounts
--   mohamed@amaso.site    مستخدم أعلى     superuser
--   bouchra@amaso.site    مستخدم أعلى     superuser
--
--   Both sign in with the password "demo-only-password". That is true of
--   THIS FILE ONLY: a real install invents a different password per account
--   while seeding and prints it once. Never import this dump into one.
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
(1,2026,'2026/2027',1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(2,2024,'2024/2025',0,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(3,2025,'2025/2026',0,'2026-09-22 14:23:20','2026-09-22 14:23:20');
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
(1,'مساعدة شهرية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(2,'مساعدة طبية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(3,'مساعدة تعليمية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(4,'مساعدة طارئة','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(5,'مساعدة غذائية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(6,'مساعدة كسوة','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(7,'مساعدة إيجار','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(8,'مساعدة فواتير','2026-09-22 14:23:20','2026-09-22 14:23:20');
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
(1,2,'income',24,400.00,20400.00,'اعتماد إيراد بحوالة بنكية',NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(2,2,'income',25,400.00,20800.00,'اعتماد إيراد بحوالة بنكية',NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(3,2,'expense',1,-750.00,20050.00,'اعتماد مصروف',NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(4,1,'expense',2,-1200.00,48800.00,'اعتماد مصروف',NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(5,2,'expense',3,-450.00,19600.00,'اعتماد مصروف',NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(6,1,'expense',4,-600.00,48200.00,'اعتماد مصروف',NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(7,2,'expense',5,-900.00,18700.00,'اعتماد مصروف',NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(8,1,'expense',6,-1350.00,46850.00,'اعتماد مصروف',NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(9,2,'expense',7,-520.00,18180.00,'اعتماد مصروف',NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(10,1,'expense',10,-1500.00,45350.00,'اعتماد مصروف',NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(11,1,'transfer_out',1,-6000.00,39350.00,'تحويل إلى حساب \"حساب الكفالات\"',NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(12,2,'transfer_in',1,6000.00,24180.00,'تحويل من حساب \"الحساب الرئيسي\"',NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22');
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
(1,'الحساب الرئيسي','بنك التجارة','MA-1001',39350.00,50000.00,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:22'),
(2,'حساب الكفالات','بنك الوفاء','MA-1002',24180.00,20000.00,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:22');
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
(1,'Widow',1,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(2,'Orphan',NULL,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(3,'Orphan',NULL,2,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(4,'Widow',2,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(5,'Orphan',NULL,3,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(6,'Orphan',NULL,4,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(7,'Orphan',NULL,5,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(8,'Widow',3,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(9,'Orphan',NULL,6,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(10,'Widow',4,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(11,'Orphan',NULL,7,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(12,'Orphan',NULL,8,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(13,'Widow',5,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(14,'Orphan',NULL,9,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(15,'Widow',6,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(16,'Orphan',NULL,10,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(17,'Orphan',NULL,11,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(18,'Orphan',NULL,12,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(19,'Widow',7,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(20,'Orphan',NULL,13,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(21,'Orphan',NULL,14,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(22,'Widow',8,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(23,'Orphan',NULL,15,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(24,'Widow',9,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(25,'Orphan',NULL,16,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(26,'Orphan',NULL,17,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(27,'Widow',10,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(28,'Orphan',NULL,18,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(29,'Widow',11,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(30,'Orphan',NULL,19,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(31,'Orphan',NULL,20,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(32,'Widow',12,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(33,'Orphan',NULL,21,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(34,'Orphan',NULL,22,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(35,'Orphan',NULL,23,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(36,'Orphan',NULL,24,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(37,'Widow',13,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(38,'Orphan',NULL,25,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(39,'Orphan',NULL,26,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(40,'Widow',14,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(41,'Orphan',NULL,27,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(42,'Orphan',NULL,28,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(43,'Orphan',NULL,29,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(44,'Widow',15,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(45,'Orphan',NULL,30,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(46,'Widow',16,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(47,'Orphan',NULL,31,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(48,'Orphan',NULL,32,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(49,'Widow',17,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(50,'Orphan',NULL,33,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(51,'Orphan',NULL,34,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(52,'Orphan',NULL,35,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(53,'Widow',18,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(54,'Orphan',NULL,36,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(55,'Orphan',NULL,37,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(56,'Widow',19,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(57,'Orphan',NULL,38,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(58,'Widow',20,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(59,'Orphan',NULL,39,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(60,'Orphan',NULL,40,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(61,'Orphan',NULL,41,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(62,'Widow',21,NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(63,'Orphan',NULL,42,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(64,'Orphan',NULL,43,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(65,'Widow',22,NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(66,'Orphan',NULL,44,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(67,'Orphan',NULL,45,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(68,'Orphan',NULL,46,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(69,'Orphan',NULL,47,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(70,'Widow',23,NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(71,'Orphan',NULL,48,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(72,'Widow',24,NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(73,'Orphan',NULL,49,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(74,'Orphan',NULL,50,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(75,'Widow',25,NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(76,'Orphan',NULL,51,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(77,'Orphan',NULL,52,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(78,'Orphan',NULL,53,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(79,'Widow',26,NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21');
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
(1,1,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(1,4,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(1,8,'2026-09-22 14:23:22','2026-09-22 14:23:22');
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
(1,'مجموعة حي السلام','الأسر المستفيدة في حي السلام','2026-09-22 14:23:22','2026-09-22 14:23:22');
/*!40000 ALTER TABLE `beneficiary_groups` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `budget_expense_category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `budget_expense_category` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `budget_id` bigint(20) unsigned NOT NULL,
  `category_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `budget_expense_category_unique` (`budget_id`,`category_id`),
  KEY `budget_expense_category_category_id_foreign` (`category_id`),
  KEY `budget_expense_category_budget_index` (`budget_id`),
  CONSTRAINT `budget_expense_category_budget_id_foreign` FOREIGN KEY (`budget_id`) REFERENCES `budgets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `budget_expense_category_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `expense_categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `budget_expense_category` WRITE;
/*!40000 ALTER TABLE `budget_expense_category` DISABLE KEYS */;
INSERT INTO `budget_expense_category` VALUES
(1,1,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(2,1,2,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(3,1,3,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(4,1,4,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(5,1,5,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(6,2,6,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(7,2,7,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(8,2,8,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(9,2,9,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(10,2,10,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(11,3,11,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(12,3,12,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(13,3,13,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(14,3,14,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(15,3,15,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(16,4,16,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(17,4,17,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(18,4,18,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(19,4,19,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(20,4,20,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(21,4,21,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(22,5,22,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(23,5,23,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(24,5,24,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(25,5,25,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(26,5,26,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(27,6,27,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(28,6,28,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(29,6,29,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(30,6,30,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(31,6,31,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(32,1,999,'2026-09-22 14:23:20','2026-09-22 14:23:20');
/*!40000 ALTER TABLE `budget_expense_category` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `budget_income_category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `budget_income_category` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `budget_id` bigint(20) unsigned NOT NULL,
  `category_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `budget_income_category_unique` (`budget_id`,`category_id`),
  KEY `budget_income_category_category_id_foreign` (`category_id`),
  KEY `budget_income_category_budget_index` (`budget_id`),
  CONSTRAINT `budget_income_category_budget_id_foreign` FOREIGN KEY (`budget_id`) REFERENCES `budgets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `budget_income_category_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `income_categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `budget_income_category` WRITE;
/*!40000 ALTER TABLE `budget_income_category` DISABLE KEYS */;
INSERT INTO `budget_income_category` VALUES
(1,1,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(2,1,3,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(3,2,4,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(4,2,5,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(5,2,6,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(6,3,7,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(7,3,8,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(8,4,9,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(9,4,10,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(10,5,11,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(11,5,12,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(12,5,13,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(13,6,14,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(14,6,15,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(15,1,999,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(16,8,1002,'2026-09-22 14:23:20','2026-09-22 14:23:20');
/*!40000 ALTER TABLE `budget_income_category` ENABLE KEYS */;
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
  `is_idda` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `budgets` WRITE;
/*!40000 ALTER TABLE `budgets` DISABLE KEYS */;
INSERT INTO `budgets` VALUES
(1,'الرعاية الصحية','2026-09-22 14:23:20','2026-09-22 14:23:20',0,0),
(2,'التعليم والتدريب','2026-09-22 14:23:20','2026-09-22 14:23:20',0,0),
(3,'النقل والمواصلات','2026-09-22 14:23:20','2026-09-22 14:23:20',0,0),
(4,'الإدارة العامة','2026-09-22 14:23:20','2026-09-22 14:23:20',0,0),
(5,'المساعدات الاجتماعية','2026-09-22 14:23:20','2026-09-22 14:23:20',0,0),
(6,'البرامج والفعاليات','2026-09-22 14:23:20','2026-09-22 14:23:20',0,0),
(7,'الميزانية العامة','2026-09-22 14:23:20','2026-09-22 14:23:20',1,0),
(8,'كفالة شاملة','2026-09-22 14:23:20','2026-09-22 14:23:20',0,0),
(9,'عدّة','2026-09-22 14:23:20','2026-09-22 14:23:20',0,1),
(10,'كفالة شاملة - تسيير','2026-09-22 14:23:20','2026-09-22 14:23:20',0,0),
(11,'كفالة شاملة - مؤونة','2026-09-22 14:23:20','2026-09-22 14:23:20',0,0),
(12,'كفالة شاملة - تعليم','2026-09-22 14:23:20','2026-09-22 14:23:20',0,0),
(13,'كفالة شاملة - صحة','2026-09-22 14:23:20','2026-09-22 14:23:20',0,0),
(14,'كفالة شاملة - تربية وترفيه','2026-09-22 14:23:20','2026-09-22 14:23:20',0,0),
(15,'كفالة شاملة - مشاريع','2026-09-22 14:23:20','2026-09-22 14:23:20',0,0),
(16,'كفالة شاملة - تكوين','2026-09-22 14:23:20','2026-09-22 14:23:20',0,0);
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
  `national_id` varchar(30) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `email` varchar(120) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `is_kafil` tinyint(1) NOT NULL DEFAULT 0,
  `total_given` decimal(16,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `donors_national_id_index` (`national_id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `donors` WRITE;
/*!40000 ALTER TABLE `donors` DISABLE KEYS */;
INSERT INTO `donors` VALUES
(1,'عبد الكريم','الودغيري','D861525','0646149087','عبد الكريم.الودغيري@example.com',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:22',1,1070.00),
(2,'خالد','بنموسى','D666118','0661821969','خالد.بنموسى@example.com',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:22',1,3020.00),
(3,'ياسمين','الشرقاوي','D440037','0634556093','ياسمين.الشرقاوي@example.com',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:22',1,3040.00),
(4,'محمد','الغالي','D802253','0668142804','محمد.الغالي@example.com',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:22',1,2120.00),
(5,'سارة','أمين','D503658','0624258890','سارة.أمين@example.com',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:22',1,2300.00),
(6,'عثمان','الفيلالي','D392295','0668135536','عثمان.الفيلالي@example.com',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:22',1,700.00),
(7,'ليلى','حمداوي','D997367','0613654031','ليلى.حمداوي@example.com',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:22',1,1800.00),
(8,'طارق','بوستة','D848836','0686122173','طارق.بوستة@example.com',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:22',1,900.00),
(9,'رشيد','العلمي','D719879','0660073889','رشيد.العلمي@example.com',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:22',0,500.00),
(10,'نبيلة','بنكيران','D206314','0695048108','نبيلة.بنكيران@example.com',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:22',0,1400.00),
(11,'يوسف','الحلو','D450749','0688208697','يوسف.الحلو@example.com',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:22',0,1160.00),
(12,'سلمى','برادة','D611233','0644514534','سلمى.برادة@example.com',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:22',0,2750.00),
(13,'إدريس','المكاوي','D586917','0677366781','إدريس.المكاوي@example.com',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:22',0,1570.00),
(14,'غزلان','الطاهري','D117277','0632543551','غزلان.الطاهري@example.com',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:22',0,2120.00),
(15,'أنس','زروال','D516187','0678156389','أنس.زروال@example.com',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:22',0,940.00),
(16,'سميرة','القادري','D291235','0670935665','سميرة.القادري@example.com',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:22',0,2420.00),
(17,'مصطفى','العروسي','D355451','0665615144','مصطفى.العروسي@example.com',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:22',0,1360.00),
(18,'نزهة','بنشقرون','D832975','0620604078','نزهة.بنشقرون@example.com',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:22',0,2750.00);
/*!40000 ALTER TABLE `donors` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `education_level_grade_components`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `education_level_grade_components` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `education_level_id` bigint(20) unsigned NOT NULL,
  `label` varchar(120) NOT NULL,
  `weight` decimal(5,2) NOT NULL DEFAULT 0.00,
  `sort_order` smallint(5) unsigned NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `level_grade_components_unique` (`education_level_id`,`label`),
  KEY `level_grade_components_order` (`education_level_id`,`sort_order`),
  CONSTRAINT `education_level_grade_components_education_level_id_foreign` FOREIGN KEY (`education_level_id`) REFERENCES `orphans_education_level` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `education_level_grade_components` WRITE;
/*!40000 ALTER TABLE `education_level_grade_components` DISABLE KEYS */;
INSERT INTO `education_level_grade_components` VALUES
(1,1,'الأسدس الأول',50.00,0,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(2,1,'الأسدس الثاني',50.00,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(3,2,'الأسدس الأول',50.00,0,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(4,2,'الأسدس الثاني',50.00,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(5,3,'الأسدس الأول',50.00,0,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(6,3,'الأسدس الثاني',50.00,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(7,4,'الأسدس الأول',50.00,0,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(8,4,'الأسدس الثاني',50.00,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(9,5,'الأسدس الأول',50.00,0,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(10,5,'الأسدس الثاني',50.00,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(11,6,'الأسدس الأول',50.00,0,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(12,6,'الأسدس الثاني',50.00,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(13,7,'الأسدس الأول',50.00,0,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(14,7,'الأسدس الثاني',50.00,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(15,8,'الأسدس الأول',50.00,0,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(16,8,'الأسدس الثاني',50.00,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(17,9,'الأسدس الأول',50.00,0,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(18,9,'الأسدس الثاني',50.00,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(19,10,'الأسدس الأول',50.00,0,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(20,10,'الأسدس الثاني',50.00,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(21,11,'الأسدس الأول',50.00,0,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(22,11,'الأسدس الثاني',50.00,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(23,12,'الأسدس الأول',50.00,0,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(24,12,'الأسدس الثاني',50.00,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(25,13,'الأسدس الأول',50.00,0,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(26,13,'الأسدس الثاني',50.00,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(27,14,'الأسدس الأول',50.00,0,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(28,14,'الأسدس الثاني',50.00,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(29,15,'الأسدس الأول',50.00,0,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(30,15,'الأسدس الثاني',50.00,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(31,16,'الأسدس الأول',50.00,0,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(32,16,'الأسدس الثاني',50.00,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(33,17,'الأسدس الأول',50.00,0,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(34,17,'الأسدس الثاني',50.00,1,'2026-09-22 14:23:20','2026-09-22 14:23:20');
/*!40000 ALTER TABLE `education_level_grade_components` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `enrollment_grades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `enrollment_grades` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `enrollment_id` bigint(20) unsigned NOT NULL,
  `label` varchar(120) NOT NULL,
  `mark` decimal(6,2) NOT NULL,
  `scale` decimal(6,2) NOT NULL DEFAULT 20.00,
  `weight` decimal(5,2) NOT NULL DEFAULT 0.00,
  `sort_order` smallint(5) unsigned NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `enrollment_grades_enrollment_id_sort_order_index` (`enrollment_id`,`sort_order`),
  CONSTRAINT `enrollment_grades_enrollment_id_foreign` FOREIGN KEY (`enrollment_id`) REFERENCES `orphan_enrollments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=256 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `enrollment_grades` WRITE;
/*!40000 ALTER TABLE `enrollment_grades` DISABLE KEYS */;
INSERT INTO `enrollment_grades` VALUES
(1,51,'الأسدس الأول',17.40,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(2,52,'الأسدس الأول',10.16,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(3,52,'الأسدس الثاني',10.42,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(4,53,'الأسدس الأول',11.48,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(5,53,'الأسدس الثاني',7.45,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(6,54,'الأسدس الأول',17.79,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(7,54,'الأسدس الثاني',12.54,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(8,2,'الأسدس الأول',16.86,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(9,2,'الأسدس الثاني',9.42,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(10,55,'الأسدس الأول',17.68,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(11,55,'الأسدس الثاني',12.77,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(12,56,'الأسدس الأول',7.04,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(13,56,'الأسدس الثاني',12.98,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(14,3,'الأسدس الأول',9.45,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(15,3,'الأسدس الثاني',8.25,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(16,57,'الأسدس الأول',18.25,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(17,57,'الأسدس الثاني',17.11,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(18,58,'الأسدس الأول',12.97,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(19,58,'الأسدس الثاني',13.01,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(20,4,'الأسدس الأول',14.55,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(21,59,'الأسدس الأول',13.18,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(22,59,'الأسدس الثاني',13.87,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(23,60,'الأسدس الأول',13.19,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(24,5,'الأسدس الأول',12.83,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(25,5,'الأسدس الثاني',17.25,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(26,61,'الأسدس الأول',15.80,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(27,62,'الأسدس الأول',10.68,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(28,62,'الأسدس الثاني',10.46,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(29,6,'الأسدس الأول',18.15,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(30,6,'الأسدس الثاني',12.74,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(31,63,'الأسدس الأول',11.12,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(32,63,'الأسدس الثاني',17.16,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(33,64,'الأسدس الأول',18.42,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(34,64,'الأسدس الثاني',10.56,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(35,7,'الأسدس الأول',15.56,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(36,7,'الأسدس الثاني',7.27,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(37,65,'الأسدس الأول',13.51,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(38,65,'الأسدس الثاني',8.61,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(39,66,'الأسدس الأول',10.71,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(40,66,'الأسدس الثاني',7.77,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(41,67,'الأسدس الأول',12.88,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(42,67,'الأسدس الثاني',7.09,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(43,68,'الأسدس الأول',16.96,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(44,68,'الأسدس الثاني',12.15,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(45,9,'الأسدس الأول',16.03,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(46,69,'الأسدس الأول',9.69,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(47,69,'الأسدس الثاني',13.40,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(48,70,'الأسدس الأول',13.73,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(49,10,'الأسدس الأول',9.53,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(50,10,'الأسدس الثاني',13.13,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(51,71,'الأسدس الأول',10.16,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(52,72,'الأسدس الأول',13.88,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(53,72,'الأسدس الثاني',9.51,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(54,11,'الأسدس الأول',17.22,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(55,11,'الأسدس الثاني',16.60,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(56,73,'الأسدس الأول',9.86,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(57,73,'الأسدس الثاني',13.14,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(58,74,'الأسدس الأول',7.90,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(59,74,'الأسدس الثاني',14.31,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(60,12,'الأسدس الأول',11.24,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(61,12,'الأسدس الثاني',9.11,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(62,75,'الأسدس الأول',11.60,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(63,75,'الأسدس الثاني',9.90,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(64,76,'الأسدس الأول',18.29,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(65,76,'الأسدس الثاني',9.23,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(66,13,'الأسدس الأول',16.55,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(67,13,'الأسدس الثاني',10.59,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(68,77,'الأسدس الأول',14.44,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(69,77,'الأسدس الثاني',8.37,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(70,78,'الأسدس الأول',13.58,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(71,78,'الأسدس الثاني',13.38,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(72,14,'الأسدس الأول',15.70,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(73,79,'الأسدس الأول',12.40,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(74,79,'الأسدس الثاني',12.80,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(75,80,'الأسدس الأول',7.22,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(76,81,'الأسدس الأول',9.51,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(77,82,'الأسدس الأول',11.68,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(78,82,'الأسدس الثاني',12.75,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(79,16,'الأسدس الأول',13.29,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(80,16,'الأسدس الثاني',18.51,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(81,83,'الأسدس الأول',7.71,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(82,83,'الأسدس الثاني',10.63,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(83,84,'الأسدس الأول',10.62,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(84,84,'الأسدس الثاني',12.10,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(85,17,'الأسدس الأول',15.59,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(86,17,'الأسدس الثاني',16.48,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(87,85,'الأسدس الأول',10.97,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(88,85,'الأسدس الثاني',9.35,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(89,86,'الأسدس الأول',17.94,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(90,86,'الأسدس الثاني',15.43,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(91,18,'الأسدس الأول',7.96,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(92,18,'الأسدس الثاني',8.79,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(93,87,'الأسدس الأول',16.05,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(94,87,'الأسدس الثاني',9.24,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(95,88,'الأسدس الأول',7.74,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(96,88,'الأسدس الثاني',14.18,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(97,19,'الأسدس الأول',13.72,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(98,89,'الأسدس الأول',14.51,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(99,89,'الأسدس الثاني',8.27,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(100,90,'الأسدس الأول',18.31,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(101,20,'الأسدس الأول',12.35,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(102,20,'الأسدس الثاني',16.62,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(103,91,'الأسدس الأول',9.16,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(104,92,'الأسدس الأول',17.64,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(105,92,'الأسدس الثاني',16.02,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(106,21,'الأسدس الأول',15.70,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(107,21,'الأسدس الثاني',9.89,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(108,93,'الأسدس الأول',11.79,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(109,93,'الأسدس الثاني',13.93,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(110,94,'الأسدس الأول',8.36,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(111,94,'الأسدس الثاني',18.27,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(112,95,'الأسدس الأول',9.82,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(113,95,'الأسدس الثاني',7.27,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(114,96,'الأسدس الأول',10.16,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(115,96,'الأسدس الثاني',18.18,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(116,23,'الأسدس الأول',16.76,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(117,23,'الأسدس الثاني',14.32,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(118,97,'الأسدس الأول',15.48,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(119,97,'الأسدس الثاني',10.15,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(120,98,'الأسدس الأول',15.89,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(121,98,'الأسدس الثاني',11.05,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(122,24,'الأسدس الأول',7.53,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(123,99,'الأسدس الأول',11.06,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(124,99,'الأسدس الثاني',18.77,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(125,100,'الأسدس الأول',16.54,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(126,25,'الأسدس الأول',15.10,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(127,25,'الأسدس الثاني',17.75,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(128,101,'الأسدس الأول',12.29,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(129,102,'الأسدس الأول',18.75,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(130,102,'الأسدس الثاني',10.12,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(131,26,'الأسدس الأول',15.03,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(132,26,'الأسدس الثاني',8.75,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(133,103,'الأسدس الأول',17.75,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(134,103,'الأسدس الثاني',12.61,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(135,104,'الأسدس الأول',12.92,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(136,104,'الأسدس الثاني',15.65,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(137,27,'الأسدس الأول',10.21,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(138,27,'الأسدس الثاني',10.35,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(139,105,'الأسدس الأول',10.01,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(140,105,'الأسدس الثاني',14.53,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(141,106,'الأسدس الأول',16.75,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(142,106,'الأسدس الثاني',17.56,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(143,28,'الأسدس الأول',17.24,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(144,28,'الأسدس الثاني',7.11,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(145,107,'الأسدس الأول',15.05,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(146,107,'الأسدس الثاني',7.65,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(147,108,'الأسدس الأول',14.10,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(148,108,'الأسدس الثاني',9.36,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(149,109,'الأسدس الأول',10.16,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(150,109,'الأسدس الثاني',7.66,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(151,110,'الأسدس الأول',7.28,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(152,30,'الأسدس الأول',10.66,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(153,30,'الأسدس الثاني',18.38,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(154,111,'الأسدس الأول',11.41,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(155,112,'الأسدس الأول',15.26,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(156,112,'الأسدس الثاني',18.41,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(157,31,'الأسدس الأول',17.23,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(158,31,'الأسدس الثاني',16.00,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(159,113,'الأسدس الأول',7.36,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(160,113,'الأسدس الثاني',16.41,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(161,114,'الأسدس الأول',7.97,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(162,114,'الأسدس الثاني',15.29,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(163,32,'الأسدس الأول',13.73,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(164,32,'الأسدس الثاني',12.59,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(165,115,'الأسدس الأول',11.24,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(166,115,'الأسدس الثاني',11.99,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(167,116,'الأسدس الأول',11.65,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(168,116,'الأسدس الثاني',8.34,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(169,33,'الأسدس الأول',15.62,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(170,33,'الأسدس الثاني',18.03,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(171,117,'الأسدس الأول',15.51,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(172,117,'الأسدس الثاني',10.64,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(173,118,'الأسدس الأول',8.78,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(174,118,'الأسدس الثاني',12.71,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(175,34,'الأسدس الأول',10.28,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(176,119,'الأسدس الأول',18.48,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(177,119,'الأسدس الثاني',15.85,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(178,120,'الأسدس الأول',16.21,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(179,35,'الأسدس الأول',13.87,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(180,35,'الأسدس الثاني',12.99,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(181,121,'الأسدس الأول',14.60,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(182,122,'الأسدس الأول',8.57,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(183,122,'الأسدس الثاني',13.47,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(184,123,'الأسدس الأول',12.45,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(185,123,'الأسدس الثاني',17.02,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(186,124,'الأسدس الأول',7.22,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(187,124,'الأسدس الثاني',11.89,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(188,37,'الأسدس الأول',12.92,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(189,37,'الأسدس الثاني',8.17,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(190,125,'الأسدس الأول',17.36,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(191,125,'الأسدس الثاني',11.33,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(192,126,'الأسدس الأول',7.66,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(193,126,'الأسدس الثاني',9.45,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(194,38,'الأسدس الأول',16.60,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(195,38,'الأسدس الثاني',18.07,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(196,127,'الأسدس الأول',15.46,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(197,127,'الأسدس الثاني',13.48,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(198,128,'الأسدس الأول',15.13,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(199,128,'الأسدس الثاني',15.70,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(200,39,'الأسدس الأول',7.26,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(201,129,'الأسدس الأول',8.68,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(202,129,'الأسدس الثاني',7.22,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(203,130,'الأسدس الأول',11.59,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(204,40,'الأسدس الأول',8.34,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(205,40,'الأسدس الثاني',13.74,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(206,131,'الأسدس الأول',9.28,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(207,132,'الأسدس الأول',12.88,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(208,132,'الأسدس الثاني',16.55,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(209,41,'الأسدس الأول',10.86,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(210,41,'الأسدس الثاني',16.76,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(211,133,'الأسدس الأول',18.89,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(212,133,'الأسدس الثاني',16.34,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(213,134,'الأسدس الأول',12.49,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(214,134,'الأسدس الثاني',16.24,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(215,42,'الأسدس الأول',16.72,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(216,42,'الأسدس الثاني',13.58,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(217,135,'الأسدس الأول',17.91,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(218,135,'الأسدس الثاني',15.69,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(219,136,'الأسدس الأول',10.63,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(220,136,'الأسدس الثاني',17.52,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(221,137,'الأسدس الأول',10.16,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(222,137,'الأسدس الثاني',18.06,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(223,138,'الأسدس الأول',7.39,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(224,138,'الأسدس الثاني',17.87,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(225,44,'الأسدس الأول',18.18,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(226,139,'الأسدس الأول',14.45,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(227,139,'الأسدس الثاني',18.49,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(228,140,'الأسدس الأول',13.57,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(229,45,'الأسدس الأول',12.72,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(230,45,'الأسدس الثاني',13.48,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(231,141,'الأسدس الأول',10.07,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(232,142,'الأسدس الأول',9.77,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(233,142,'الأسدس الثاني',7.31,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(234,46,'الأسدس الأول',12.86,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(235,46,'الأسدس الثاني',15.24,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(236,143,'الأسدس الأول',13.92,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(237,143,'الأسدس الثاني',12.79,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(238,144,'الأسدس الأول',13.28,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(239,144,'الأسدس الثاني',9.29,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(240,47,'الأسدس الأول',10.90,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(241,47,'الأسدس الثاني',7.89,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(242,145,'الأسدس الأول',8.28,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(243,145,'الأسدس الثاني',11.70,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(244,146,'الأسدس الأول',12.24,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(245,146,'الأسدس الثاني',16.64,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(246,48,'الأسدس الأول',8.27,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(247,48,'الأسدس الثاني',9.31,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(248,147,'الأسدس الأول',8.60,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(249,147,'الأسدس الثاني',11.98,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(250,148,'الأسدس الأول',11.02,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(251,148,'الأسدس الثاني',11.72,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(252,49,'الأسدس الأول',10.87,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(253,149,'الأسدس الأول',8.86,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(254,149,'الأسدس الثاني',14.66,20.00,50.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(255,150,'الأسدس الأول',10.09,20.00,50.00,0,'2026-09-22 14:23:21','2026-09-22 14:23:21');
/*!40000 ALTER TABLE `enrollment_grades` ENABLE KEYS */;
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
(1,1,13,NULL,750.00,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(2,2,24,NULL,1200.00,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(3,3,37,NULL,450.00,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(4,4,49,NULL,600.00,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(5,5,62,NULL,900.00,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(6,6,75,NULL,1350.00,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(7,7,8,NULL,520.00,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(8,8,19,NULL,680.00,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(9,9,29,NULL,1050.00,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(10,11,15,NULL,770.00,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(11,12,24,NULL,280.00,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(12,13,32,NULL,630.00,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(13,14,44,NULL,450.00,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(14,15,53,NULL,770.00,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(15,16,62,NULL,280.00,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(16,17,72,NULL,630.00,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(17,18,1,NULL,450.00,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(18,19,13,NULL,550.00,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(19,20,22,NULL,940.00,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(20,21,29,NULL,340.00,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(21,22,40,NULL,770.00,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(22,23,49,NULL,550.00,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(23,24,58,NULL,940.00,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(24,25,70,NULL,340.00,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(25,26,79,NULL,770.00,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(26,27,8,NULL,550.00,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22');
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
(1,NULL,'أدوية ومستلزمات طبية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(2,NULL,'فحوصات طبية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(3,NULL,'عمليات جراحية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(4,NULL,'علاج طبيعي','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(5,NULL,'مساعدات طبية طارئة','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(6,NULL,'رسوم مدرسية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(7,NULL,'مواد تعليمية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(8,NULL,'دورات تدريبية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(9,NULL,'منح الطلاب','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(10,NULL,'مصاريف النقل للطلاب','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(11,NULL,'وقود','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(12,NULL,'صيانة المركبات','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(13,NULL,'تأمين المركبات','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(14,NULL,'أجرة سائقين','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(15,NULL,'تذاكر النقل العام','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(16,NULL,'رواتب الموظفين','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(17,NULL,'مصاريف المكتب','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(18,NULL,'إيجار','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(19,NULL,'كهرباء وماء','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(20,NULL,'مصاريف الاتصالات','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(21,NULL,'مصاريف قانونية ومحاسبية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(22,NULL,'مساعدات نقدية للأرامل','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(23,NULL,'مساعدات نقدية للأيتام','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(24,NULL,'مساعدات غذائية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(25,NULL,'مساعدات سكن','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(26,NULL,'مساعدات كسوة','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(27,NULL,'تنظيم الفعاليات','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(28,NULL,'برامج ترفيهية للأطفال','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(29,NULL,'ورش تدريبية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(30,NULL,'مؤتمرات ولقاءات','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(31,NULL,'مواد دعائية وإعلانية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(999,NULL,'Deleted Category (Default)','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(1000,NULL,'مصاريف إدارية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(1001,NULL,'أدوات ومستلزمات مكتبية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(1002,NULL,'اتصالات وإنترنت','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(1003,NULL,'سلة غذائية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(1004,NULL,'مساعدة نقدية شهرية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(1005,NULL,'كسوة وملابس','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(1006,NULL,'مساعدة في الإيجار','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(1007,NULL,'فواتير الماء والكهرباء','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(1008,NULL,'رسوم التمدرس','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(1009,NULL,'أدوات ولوازم مدرسية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(1010,NULL,'دعم ومساندة دراسية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(1011,NULL,'نقل مدرسي','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(1012,NULL,'أدوية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(1013,NULL,'فحوصات وتحاليل','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(1014,NULL,'استشارات طبية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(1015,NULL,'نظارات وأجهزة طبية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(1016,NULL,'رحلات وخرجات','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(1017,NULL,'مخيمات صيفية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(1018,NULL,'أنشطة ثقافية ورياضية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(1019,NULL,'هدايا المناسبات','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(1020,NULL,'مشاريع مدرة للدخل','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(1021,NULL,'تجهيز مشروع أسرة','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(1022,NULL,'دعم نشاط حر','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(1023,NULL,'دورات تكوينية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(1024,NULL,'تكوين مهني','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(1025,NULL,'ورشات تأهيلية','2026-09-22 14:23:20','2026-09-22 14:23:20');
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
(1,1,7,2,NULL,NULL,'2026-01-13',750.00,'Cash',NULL,'EX-2026-01',2,NULL,0,'Approved',1,1,'2026-09-22 14:23:22','2026-09-22 14:23:22','2026-09-22 14:23:22'),
(2,1,7,3,NULL,NULL,'2026-02-18',1200.00,'Cash',NULL,'EX-2026-02',1,NULL,0,'Approved',1,1,'2026-09-22 14:23:22','2026-09-22 14:23:22','2026-09-22 14:23:22'),
(3,1,7,4,NULL,NULL,'2026-03-23',450.00,'Cash',NULL,'EX-2026-03',2,NULL,0,'Approved',1,1,'2026-09-22 14:23:22','2026-09-22 14:23:22','2026-09-22 14:23:22'),
(4,1,7,5,NULL,NULL,'2026-04-10',600.00,'Cheque',NULL,'EX-2026-04',1,NULL,0,'Approved',1,1,'2026-09-22 14:23:22','2026-09-22 14:23:22','2026-09-22 14:23:22'),
(5,1,7,6,NULL,NULL,'2026-05-15',900.00,'Cash',NULL,'EX-2026-05',2,NULL,0,'Approved',1,1,'2026-09-22 14:23:22','2026-09-22 14:23:22','2026-09-22 14:23:22'),
(6,1,7,7,NULL,NULL,'2026-06-20',1350.00,'Cash',NULL,'EX-2026-06',1,NULL,0,'Approved',1,1,'2026-09-22 14:23:22','2026-09-22 14:23:22','2026-09-22 14:23:22'),
(7,1,7,8,NULL,NULL,'2026-07-25',520.00,'Cash',NULL,'EX-2026-07',2,NULL,0,'Approved',1,1,'2026-09-22 14:23:22','2026-09-22 14:23:22','2026-09-22 14:23:22'),
(8,1,7,9,NULL,NULL,'2026-08-12',680.00,'Cheque',NULL,'EX-2026-08',NULL,NULL,0,'Draft',1,NULL,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(9,1,7,10,NULL,NULL,'2026-09-17',1050.00,'Cash',NULL,'EX-2026-09',NULL,NULL,0,'Draft',1,NULL,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(10,1,7,1,NULL,NULL,'2026-09-12',1500.00,'BankWire',NULL,NULL,1,NULL,1,'Approved',1,1,'2026-09-22 14:23:22','2026-09-22 14:23:22','2026-09-22 14:23:22'),
(11,2,7,4,NULL,NULL,'2024-08-19',770.00,'Cash',NULL,'EX-2024-01',NULL,NULL,0,'Approved',1,1,'2024-08-19 00:00:00','2026-09-22 14:23:22','2026-09-22 14:23:22'),
(12,2,7,5,NULL,NULL,'2024-01-19',280.00,'Cash',NULL,'EX-2024-02',NULL,NULL,0,'Approved',1,1,'2024-01-19 00:00:00','2026-09-22 14:23:22','2026-09-22 14:23:22'),
(13,2,7,6,NULL,NULL,'2024-06-11',630.00,'Cheque',NULL,'EX-2024-03',NULL,NULL,0,'Approved',1,1,'2024-06-11 00:00:00','2026-09-22 14:23:22','2026-09-22 14:23:22'),
(14,2,7,7,NULL,NULL,'2024-11-16',450.00,'Cash',NULL,'EX-2024-04',NULL,NULL,0,'Approved',1,1,'2024-11-16 00:00:00','2026-09-22 14:23:22','2026-09-22 14:23:22'),
(15,2,7,8,NULL,NULL,'2024-04-12',770.00,'Cash',NULL,'EX-2024-05',NULL,NULL,0,'Approved',1,1,'2024-04-12 00:00:00','2026-09-22 14:23:22','2026-09-22 14:23:22'),
(16,2,7,9,NULL,NULL,'2024-09-17',280.00,'Cheque',NULL,'EX-2024-06',NULL,NULL,0,'Approved',1,1,'2024-09-17 00:00:00','2026-09-22 14:23:22','2026-09-22 14:23:22'),
(17,2,7,10,NULL,NULL,'2024-02-14',630.00,'Cash',NULL,'EX-2024-07',NULL,NULL,0,'Approved',1,1,'2024-02-14 00:00:00','2026-09-22 14:23:22','2026-09-22 14:23:22'),
(18,2,7,11,NULL,NULL,'2024-07-14',450.00,'Cash',NULL,'EX-2024-08',NULL,NULL,0,'Approved',1,1,'2024-07-14 00:00:00','2026-09-22 14:23:22','2026-09-22 14:23:22'),
(19,3,7,3,NULL,NULL,'2025-07-07',550.00,'Cash',NULL,'EX-2025-01',NULL,NULL,0,'Approved',1,1,'2025-07-07 00:00:00','2026-09-22 14:23:22','2026-09-22 14:23:22'),
(20,3,7,4,NULL,NULL,'2025-12-24',940.00,'Cash',NULL,'EX-2025-02',NULL,NULL,0,'Approved',1,1,'2025-12-24 00:00:00','2026-09-22 14:23:22','2026-09-22 14:23:22'),
(21,3,7,5,NULL,NULL,'2025-05-10',340.00,'Cheque',NULL,'EX-2025-03',NULL,NULL,0,'Approved',1,1,'2025-05-10 00:00:00','2026-09-22 14:23:22','2026-09-22 14:23:22'),
(22,3,7,6,NULL,NULL,'2025-10-09',770.00,'Cash',NULL,'EX-2025-04',NULL,NULL,0,'Approved',1,1,'2025-10-09 00:00:00','2026-09-22 14:23:22','2026-09-22 14:23:22'),
(23,3,7,7,NULL,NULL,'2025-03-06',550.00,'Cash',NULL,'EX-2025-05',NULL,NULL,0,'Approved',1,1,'2025-03-06 00:00:00','2026-09-22 14:23:22','2026-09-22 14:23:22'),
(24,3,7,8,NULL,NULL,'2025-08-03',940.00,'Cheque',NULL,'EX-2025-06',NULL,NULL,0,'Approved',1,1,'2025-08-03 00:00:00','2026-09-22 14:23:22','2026-09-22 14:23:22'),
(25,3,7,9,NULL,NULL,'2025-01-18',340.00,'Cash',NULL,'EX-2025-07',NULL,NULL,0,'Approved',1,1,'2025-01-18 00:00:00','2026-09-22 14:23:22','2026-09-22 14:23:22'),
(26,3,7,10,NULL,NULL,'2025-06-12',770.00,'Cash',NULL,'EX-2025-08',NULL,NULL,0,'Approved',1,1,'2025-06-12 00:00:00','2026-09-22 14:23:22','2026-09-22 14:23:22'),
(27,3,7,11,NULL,NULL,'2025-11-09',550.00,'Cheque',NULL,'EX-2025-09',NULL,NULL,0,'Approved',1,1,'2025-11-09 00:00:00','2026-09-22 14:23:22','2026-09-22 14:23:22');
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
(1,2026,1,0.00,0.00,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(2,2024,0,0.00,0.00,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(3,2025,0,0.00,0.00,'2026-09-22 14:23:20','2026-09-22 14:23:20');
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `housing_types` WRITE;
/*!40000 ALTER TABLE `housing_types` DISABLE KEYS */;
INSERT INTO `housing_types` VALUES
(1,'شقة','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(2,'منزل','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(3,'غرفة','2026-09-22 14:23:20','2026-09-22 14:23:20');
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
(1,'سكري',0,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(2,'ضغط دم',0,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(3,'قلب',0,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(4,'كلى',0,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(5,'ربو',0,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(6,'التهاب مفاصل',0,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(7,'صداع نصفي',0,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(8,'فقر دم',0,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(9,'غدة درقية',0,'2026-09-22 14:23:20','2026-09-22 14:23:20');
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
(1,NULL,'تبرعات للرعاية الصحية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(3,NULL,'دعم العلاجات','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(4,NULL,'رسوم التدريب','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(5,NULL,'تبرعات تعليمية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(6,NULL,'منح دراسية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(7,NULL,'تبرعات للمواصلات','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(8,NULL,'دعم النقل','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(9,NULL,'رسوم إدارية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(10,NULL,'تبرعات عامة','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(11,NULL,'تبرعات للمساعدات الاجتماعية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(12,NULL,'زكاة','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(13,NULL,'صدقات','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(14,NULL,'رعاية الفعاليات','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(15,NULL,'تبرعات للبرامج','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(999,NULL,'Deleted Category (Default)','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(1002,NULL,'كفالة شاملة','2026-09-22 14:23:20','2026-09-22 14:23:20');
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
(1,1,7,10,2,NULL,NULL,NULL,'2026-01-08',900.00,'Cash',NULL,'RC-2026-01',NULL,NULL,'Approved',1,1,'2026-09-22 14:23:22',NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(2,1,7,10,3,NULL,NULL,NULL,'2026-02-11',2400.00,'Cash',NULL,'RC-2026-02',NULL,NULL,'Approved',1,1,'2026-09-22 14:23:22',NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(3,1,7,10,4,NULL,NULL,NULL,'2026-03-14',1100.00,'Cheque',NULL,'RC-2026-03',NULL,NULL,'Approved',1,1,'2026-09-22 14:23:22',NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(4,1,7,10,5,NULL,NULL,NULL,'2026-04-17',1800.00,'Cash',NULL,'RC-2026-04',NULL,NULL,'Approved',1,1,'2026-09-22 14:23:22',NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(5,1,7,10,6,NULL,NULL,NULL,'2026-05-20',700.00,'Cash',NULL,'RC-2026-05',NULL,NULL,'Approved',1,1,'2026-09-22 14:23:22',NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(6,1,7,10,7,NULL,NULL,NULL,'2026-06-23',1500.00,'Cheque',NULL,'RC-2026-06',NULL,NULL,'Approved',1,1,'2026-09-22 14:23:22',NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(7,1,7,10,8,NULL,NULL,NULL,'2026-07-06',900.00,'Cash',NULL,'RC-2026-07',NULL,NULL,'Approved',1,1,'2026-09-22 14:23:22',NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(8,1,7,10,9,NULL,NULL,NULL,'2026-08-09',2400.00,'Cash',NULL,'RC-2026-08',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(9,1,7,10,10,NULL,NULL,NULL,'2026-09-12',1100.00,'Cheque',NULL,'RC-2026-09',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(10,1,7,10,5,NULL,NULL,NULL,'2026-01-11',500.00,'Cash',NULL,'RC-1000',NULL,NULL,'Approved',1,1,'2026-09-22 14:23:22',NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(11,1,7,10,6,NULL,NULL,NULL,'2026-02-12',1200.00,'Cash',NULL,'RC-1001',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(12,1,7,10,7,NULL,NULL,NULL,'2026-03-13',300.00,'Cash',NULL,'RC-1002',NULL,NULL,'Approved',1,1,'2026-09-22 14:23:22',NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(13,1,7,10,8,NULL,NULL,NULL,'2026-04-14',2000.00,'Cash',NULL,'RC-1003',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(14,1,7,10,9,NULL,NULL,NULL,'2026-05-15',500.00,'Cash',NULL,'RC-1004',NULL,NULL,'Approved',1,1,'2026-09-22 14:23:22',NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(15,1,7,10,10,NULL,NULL,NULL,'2026-06-16',1200.00,'Cash',NULL,'RC-1005',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(16,1,7,10,11,NULL,NULL,NULL,'2026-07-17',300.00,'Cash',NULL,'RC-1006',NULL,NULL,'Approved',1,1,'2026-09-22 14:23:22',NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(17,1,7,10,12,NULL,NULL,NULL,'2026-08-18',2000.00,'Cash',NULL,'RC-1007',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(18,1,7,10,13,NULL,NULL,NULL,'2026-09-19',500.00,'Cash',NULL,'RC-1008',NULL,NULL,'Approved',1,1,'2026-09-22 14:23:22',NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(19,1,7,10,14,NULL,NULL,NULL,'2026-01-20',1200.00,'Cash',NULL,'RC-1009',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(20,1,7,10,15,NULL,NULL,NULL,'2026-02-21',300.00,'Cash',NULL,'RC-1010',NULL,NULL,'Approved',1,1,'2026-09-22 14:23:22',NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(21,1,7,10,16,NULL,NULL,NULL,'2026-03-22',2000.00,'Cash',NULL,'RC-1011',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(22,1,7,10,17,NULL,NULL,NULL,'2026-04-23',500.00,'Cash',NULL,'RC-1012',NULL,NULL,'Approved',1,1,'2026-09-22 14:23:22',NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(23,1,7,10,18,NULL,NULL,NULL,'2026-05-24',1200.00,'Cash',NULL,'RC-1013',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(24,1,8,1002,NULL,3,3,NULL,'2026-09-03',400.00,'BankWire',NULL,NULL,2,NULL,'Approved',1,1,'2026-09-22 14:23:22',NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(25,1,8,1002,NULL,3,4,NULL,'2026-09-03',400.00,'BankWire',NULL,NULL,2,NULL,'Approved',1,1,'2026-09-22 14:23:22',NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(26,1,10,1002,NULL,1,1,'01M34QZY88QM2H3PMX4CCXY14Q','2026-08-14',80.00,'Cash',NULL,'RC-KC-1',NULL,NULL,'Approved',1,1,'2026-09-22 14:23:22',NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(27,1,11,1002,NULL,1,1,'01M34QZY88QM2H3PMX4CCXY14Q','2026-08-14',400.00,'Cash',NULL,'RC-KC-1',NULL,NULL,'Approved',1,1,'2026-09-22 14:23:22',NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(28,1,12,1002,NULL,1,1,'01M34QZY88QM2H3PMX4CCXY14Q','2026-08-14',160.00,'Cash',NULL,'RC-KC-1',NULL,NULL,'Approved',1,1,'2026-09-22 14:23:22',NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(29,1,13,1002,NULL,1,1,'01M34QZY88QM2H3PMX4CCXY14Q','2026-08-14',32.00,'Cash',NULL,'RC-KC-1',NULL,NULL,'Approved',1,1,'2026-09-22 14:23:22',NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(30,1,14,1002,NULL,1,1,'01M34QZY88QM2H3PMX4CCXY14Q','2026-08-14',40.00,'Cash',NULL,'RC-KC-1',NULL,NULL,'Approved',1,1,'2026-09-22 14:23:22',NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(31,1,15,1002,NULL,1,1,'01M34QZY88QM2H3PMX4CCXY14Q','2026-08-14',48.00,'Cash',NULL,'RC-KC-1',NULL,NULL,'Approved',1,1,'2026-09-22 14:23:22',NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(32,1,16,1002,NULL,1,1,'01M34QZY88QM2H3PMX4CCXY14Q','2026-08-14',40.00,'Cash',NULL,'RC-KC-1',NULL,NULL,'Approved',1,1,'2026-09-22 14:23:22',NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(33,1,10,1002,NULL,2,NULL,'01M34QZY98B8XFVK67ZFYG88T6','2026-09-22',80.00,'Cash',NULL,'RC-KC-2',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(34,1,11,1002,NULL,2,NULL,'01M34QZY98B8XFVK67ZFYG88T6','2026-09-22',400.00,'Cash',NULL,'RC-KC-2',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(35,1,12,1002,NULL,2,NULL,'01M34QZY98B8XFVK67ZFYG88T6','2026-09-22',160.00,'Cash',NULL,'RC-KC-2',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(36,1,13,1002,NULL,2,NULL,'01M34QZY98B8XFVK67ZFYG88T6','2026-09-22',32.00,'Cash',NULL,'RC-KC-2',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(37,1,14,1002,NULL,2,NULL,'01M34QZY98B8XFVK67ZFYG88T6','2026-09-22',40.00,'Cash',NULL,'RC-KC-2',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(38,1,15,1002,NULL,2,NULL,'01M34QZY98B8XFVK67ZFYG88T6','2026-09-22',48.00,'Cash',NULL,'RC-KC-2',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(39,1,16,1002,NULL,2,NULL,'01M34QZY98B8XFVK67ZFYG88T6','2026-09-22',40.00,'Cash',NULL,'RC-KC-2',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(40,2,7,10,10,NULL,NULL,NULL,'2024-01-26',1400.00,'Cash',NULL,'RC-2024-01',NULL,NULL,'Approved',1,1,'2024-01-26 00:00:00','2024-01-26 00:00:00','2026-09-22 14:23:22','2026-09-22 14:23:22'),
(41,2,7,10,11,NULL,NULL,NULL,'2024-02-26',600.00,'Cash',NULL,'RC-2024-02',NULL,NULL,'Approved',1,1,'2024-02-26 00:00:00','2024-02-26 00:00:00','2026-09-22 14:23:22','2026-09-22 14:23:22'),
(42,2,7,10,12,NULL,NULL,NULL,'2024-03-12',1050.00,'Cash',NULL,'RC-2024-03',NULL,NULL,'Approved',1,1,'2024-03-12 00:00:00','2024-03-12 00:00:00','2026-09-22 14:23:22','2026-09-22 14:23:22'),
(43,2,7,10,13,NULL,NULL,NULL,'2024-04-14',350.00,'Cheque',NULL,'RC-2024-04',NULL,NULL,'Approved',1,1,'2024-04-14 00:00:00','2024-04-14 00:00:00','2026-09-22 14:23:22','2026-09-22 14:23:22'),
(44,2,7,10,14,NULL,NULL,NULL,'2024-05-18',840.00,'Cash',NULL,'RC-2024-05',NULL,NULL,'Approved',1,1,'2024-05-18 00:00:00','2024-05-18 00:00:00','2026-09-22 14:23:22','2026-09-22 14:23:22'),
(45,2,7,10,15,NULL,NULL,NULL,'2024-06-09',210.00,'Cash',NULL,'RC-2024-06',NULL,NULL,'Approved',1,1,'2024-06-09 00:00:00','2024-06-09 00:00:00','2026-09-22 14:23:22','2026-09-22 14:23:22'),
(46,2,7,10,16,NULL,NULL,NULL,'2024-07-23',1400.00,'Cash',NULL,'RC-2024-07',NULL,NULL,'Approved',1,1,'2024-07-23 00:00:00','2024-07-23 00:00:00','2026-09-22 14:23:22','2026-09-22 14:23:22'),
(47,2,7,10,17,NULL,NULL,NULL,'2024-08-26',600.00,'Cheque',NULL,'RC-2024-08',NULL,NULL,'Approved',1,1,'2024-08-26 00:00:00','2024-08-26 00:00:00','2026-09-22 14:23:22','2026-09-22 14:23:22'),
(48,2,7,10,18,NULL,NULL,NULL,'2024-09-16',1050.00,'Cash',NULL,'RC-2024-09',NULL,NULL,'Approved',1,1,'2024-09-16 00:00:00','2024-09-16 00:00:00','2026-09-22 14:23:22','2026-09-22 14:23:22'),
(49,2,7,10,1,NULL,NULL,NULL,'2024-10-10',350.00,'Cash',NULL,'RC-2024-10',NULL,NULL,'Approved',1,1,'2024-10-10 00:00:00','2024-10-10 00:00:00','2026-09-22 14:23:22','2026-09-22 14:23:22'),
(50,2,7,10,2,NULL,NULL,NULL,'2024-11-08',840.00,'Cash',NULL,'RC-2024-11',NULL,NULL,'Approved',1,1,'2024-11-08 00:00:00','2024-11-08 00:00:00','2026-09-22 14:23:22','2026-09-22 14:23:22'),
(51,2,7,10,3,NULL,NULL,NULL,'2024-12-11',210.00,'Cheque',NULL,'RC-2024-12',NULL,NULL,'Approved',1,1,'2024-12-11 00:00:00','2024-12-11 00:00:00','2026-09-22 14:23:22','2026-09-22 14:23:22'),
(52,3,7,10,11,NULL,NULL,NULL,'2025-01-26',260.00,'Cash',NULL,'RC-2025-01',NULL,NULL,'Approved',1,1,'2025-01-26 00:00:00','2025-01-26 00:00:00','2026-09-22 14:23:22','2026-09-22 14:23:22'),
(53,3,7,10,12,NULL,NULL,NULL,'2025-02-09',1700.00,'Cash',NULL,'RC-2025-02',NULL,NULL,'Approved',1,1,'2025-02-09 00:00:00','2025-02-09 00:00:00','2026-09-22 14:23:22','2026-09-22 14:23:22'),
(54,3,7,10,13,NULL,NULL,NULL,'2025-03-24',720.00,'Cash',NULL,'RC-2025-03',NULL,NULL,'Approved',1,1,'2025-03-24 00:00:00','2025-03-24 00:00:00','2026-09-22 14:23:22','2026-09-22 14:23:22'),
(55,3,7,10,14,NULL,NULL,NULL,'2025-04-07',1280.00,'Cheque',NULL,'RC-2025-04',NULL,NULL,'Approved',1,1,'2025-04-07 00:00:00','2025-04-07 00:00:00','2026-09-22 14:23:22','2026-09-22 14:23:22'),
(56,3,7,10,15,NULL,NULL,NULL,'2025-05-11',430.00,'Cash',NULL,'RC-2025-05',NULL,NULL,'Approved',1,1,'2025-05-11 00:00:00','2025-05-11 00:00:00','2026-09-22 14:23:22','2026-09-22 14:23:22'),
(57,3,7,10,16,NULL,NULL,NULL,'2025-06-10',1020.00,'Cash',NULL,'RC-2025-06',NULL,NULL,'Approved',1,1,'2025-06-10 00:00:00','2025-06-10 00:00:00','2026-09-22 14:23:22','2026-09-22 14:23:22'),
(58,3,7,10,17,NULL,NULL,NULL,'2025-07-12',260.00,'Cash',NULL,'RC-2025-07',NULL,NULL,'Approved',1,1,'2025-07-12 00:00:00','2025-07-12 00:00:00','2026-09-22 14:23:22','2026-09-22 14:23:22'),
(59,3,7,10,18,NULL,NULL,NULL,'2025-08-19',1700.00,'Cheque',NULL,'RC-2025-08',NULL,NULL,'Approved',1,1,'2025-08-19 00:00:00','2025-08-19 00:00:00','2026-09-22 14:23:22','2026-09-22 14:23:22'),
(60,3,7,10,1,NULL,NULL,NULL,'2025-09-13',720.00,'Cash',NULL,'RC-2025-09',NULL,NULL,'Approved',1,1,'2025-09-13 00:00:00','2025-09-13 00:00:00','2026-09-22 14:23:22','2026-09-22 14:23:22'),
(61,3,7,10,2,NULL,NULL,NULL,'2025-10-14',1280.00,'Cash',NULL,'RC-2025-10',NULL,NULL,'Approved',1,1,'2025-10-14 00:00:00','2025-10-14 00:00:00','2026-09-22 14:23:22','2026-09-22 14:23:22'),
(62,3,7,10,3,NULL,NULL,NULL,'2025-11-11',430.00,'Cash',NULL,'RC-2025-11',NULL,NULL,'Approved',1,1,'2025-11-11 00:00:00','2025-11-11 00:00:00','2026-09-22 14:23:22','2026-09-22 14:23:22'),
(63,3,7,10,4,NULL,NULL,NULL,'2025-12-05',1020.00,'Cheque',NULL,'RC-2025-12',NULL,NULL,'Approved',1,1,'2025-12-05 00:00:00','2025-12-05 00:00:00','2026-09-22 14:23:22','2026-09-22 14:23:22');
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
(1,'management','تسيير',10.00,10,1002,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(2,'maouna','مؤونة',50.00,11,1002,2,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(3,'education','تعليم',20.00,12,1002,3,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(4,'health','صحة',4.00,13,1002,4,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(5,'activities','تربية وترفيه',5.00,14,1002,5,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(6,'projects','مشاريع',6.00,15,1002,6,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(7,'formation','تكوين',5.00,16,1002,7,'2026-09-22 14:23:20','2026-09-22 14:23:20');
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
(1,1,1,400.00,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(2,2,2,800.00,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(3,3,3,400.00,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(4,3,4,400.00,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(5,4,6,400.00,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(6,5,7,400.00,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(7,5,8,400.00,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(8,5,9,400.00,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(9,6,11,400.00,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(10,7,13,400.00,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(11,7,14,400.00,'2026-09-22 14:23:21','2026-09-22 14:23:21');
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
(1,'عبد الكريم','الودغيري','0646149087','عبد الكريم.الودغيري@example.com',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21',1,800.00),
(2,'خالد','بنموسى','0661821969','خالد.بنموسى@example.com',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21',2,1600.00),
(3,'ياسمين','الشرقاوي','0634556093','ياسمين.الشرقاوي@example.com',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21',3,800.00),
(4,'محمد','الغالي','0668142804','محمد.الغالي@example.com',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21',4,400.00),
(5,'سارة','أمين','0624258890','سارة.أمين@example.com',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21',5,2400.00),
(6,'عثمان','الفيلالي','0668135536','عثمان.الفيلالي@example.com',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21',6,800.00),
(7,'ليلى','حمداوي','0613654031','ليلى.حمداوي@example.com',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21',7,1200.00),
(8,'طارق','بوستة','0686122173','طارق.بوستة@example.com',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21',8,800.00);
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
) ENGINE=InnoDB AUTO_INCREMENT=75 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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
(63,'2025_09_18_000003_create_transport_month_lines_table',1),
(64,'2025_09_19_000001_promote_existing_admins_to_superuser',1),
(65,'2025_09_19_000002_remove_hut_housing_type',1),
(66,'2025_09_21_000001_retire_two_housing_types',1),
(67,'2025_09_21_000002_add_national_id_to_donors',1),
(68,'2025_09_21_000003_create_sectors_and_neighborhoods',1),
(69,'2025_09_22_000001_create_enrollment_grades_table',1),
(70,'2025_09_22_000002_count_bus_trips_per_rider',1),
(71,'2025_09_23_000001_create_education_level_grade_components_table',1),
(72,'2025_09_23_000002_weight_enrollment_grades_and_absorb_semesters',1),
(73,'2025_09_24_000001_add_idda_support_to_widows',1),
(74,'2025_09_24_000002_attach_categories_to_budgets',1);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `neighborhoods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `neighborhoods` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `label` varchar(120) NOT NULL,
  `sector_id` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `neighborhoods_label_unique` (`label`),
  KEY `neighborhoods_sector_id_foreign` (`sector_id`),
  CONSTRAINT `neighborhoods_sector_id_foreign` FOREIGN KEY (`sector_id`) REFERENCES `sectors` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `neighborhoods` WRITE;
/*!40000 ALTER TABLE `neighborhoods` DISABLE KEYS */;
/*!40000 ALTER TABLE `neighborhoods` ENABLE KEYS */;
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
(1,1,1,3,1,NULL,NULL,NULL,20.00,1,'الرياضيات','الجمعية','enrolled',NULL,'2026-09-22 14:23:20','2026-09-22 14:23:21'),
(2,2,1,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-22 14:23:20','2026-09-22 14:23:21'),
(3,3,1,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-22 14:23:20','2026-09-22 14:23:21'),
(4,4,1,3,2,NULL,NULL,NULL,20.00,1,'الرياضيات، الفيزياء','الجمعية','passed',NULL,'2026-09-22 14:23:20','2026-09-22 14:23:21'),
(5,5,1,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'failed',NULL,'2026-09-22 14:23:20','2026-09-22 14:23:21'),
(6,6,1,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-22 14:23:20','2026-09-22 14:23:21'),
(7,9,1,3,1,NULL,NULL,NULL,20.00,1,'اللغة الفرنسية','الجمعية','enrolled',NULL,'2026-09-22 14:23:20','2026-09-22 14:23:21'),
(8,10,1,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-22 14:23:20','2026-09-22 14:23:21'),
(9,11,1,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:20','2026-09-22 14:23:21'),
(10,12,1,3,2,NULL,NULL,NULL,20.00,1,'الفيزياء والكيمياء','الجمعية','failed',NULL,'2026-09-22 14:23:20','2026-09-22 14:23:21'),
(11,13,1,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-22 14:23:20','2026-09-22 14:23:21'),
(12,14,1,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-22 14:23:20','2026-09-22 14:23:21'),
(13,15,1,3,1,NULL,NULL,NULL,20.00,1,'الرياضيات','الجمعية','enrolled',NULL,'2026-09-22 14:23:20','2026-09-22 14:23:21'),
(14,16,1,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:20','2026-09-22 14:23:21'),
(15,17,1,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'failed',NULL,'2026-09-22 14:23:20','2026-09-22 14:23:21'),
(16,19,1,3,2,NULL,NULL,NULL,20.00,1,'الرياضيات، الفيزياء','الجمعية','enrolled',NULL,'2026-09-22 14:23:20','2026-09-22 14:23:21'),
(17,20,1,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-22 14:23:20','2026-09-22 14:23:21'),
(18,21,1,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-22 14:23:20','2026-09-22 14:23:21'),
(19,22,1,3,1,NULL,NULL,NULL,20.00,1,'اللغة الفرنسية','الجمعية','passed',NULL,'2026-09-22 14:23:20','2026-09-22 14:23:21'),
(20,23,1,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'failed',NULL,'2026-09-22 14:23:20','2026-09-22 14:23:21'),
(21,24,1,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-22 14:23:20','2026-09-22 14:23:21'),
(22,25,1,3,2,NULL,NULL,NULL,20.00,1,'الفيزياء والكيمياء','الجمعية','enrolled',NULL,'2026-09-22 14:23:20','2026-09-22 14:23:21'),
(23,26,1,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-22 14:23:20','2026-09-22 14:23:21'),
(24,27,1,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:20','2026-09-22 14:23:21'),
(25,28,1,3,1,NULL,NULL,NULL,20.00,1,'الرياضيات','الجمعية','failed',NULL,'2026-09-22 14:23:20','2026-09-22 14:23:21'),
(26,29,1,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-22 14:23:20','2026-09-22 14:23:21'),
(27,30,1,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-22 14:23:20','2026-09-22 14:23:21'),
(28,31,1,3,2,NULL,NULL,NULL,20.00,1,'الرياضيات، الفيزياء','الجمعية','enrolled',NULL,'2026-09-22 14:23:20','2026-09-22 14:23:21'),
(29,32,1,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:20','2026-09-22 14:23:21'),
(30,33,1,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'failed',NULL,'2026-09-22 14:23:20','2026-09-22 14:23:21'),
(31,34,1,3,1,NULL,NULL,NULL,20.00,1,'اللغة الفرنسية','الجمعية','enrolled',NULL,'2026-09-22 14:23:20','2026-09-22 14:23:21'),
(32,35,1,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-22 14:23:20','2026-09-22 14:23:21'),
(33,36,1,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-22 14:23:20','2026-09-22 14:23:21'),
(34,37,1,3,2,NULL,NULL,NULL,20.00,1,'الفيزياء والكيمياء','الجمعية','passed',NULL,'2026-09-22 14:23:20','2026-09-22 14:23:21'),
(35,38,1,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'failed',NULL,'2026-09-22 14:23:20','2026-09-22 14:23:21'),
(36,39,1,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-22 14:23:20','2026-09-22 14:23:21'),
(37,40,1,3,1,NULL,NULL,NULL,20.00,1,'الرياضيات','الجمعية','enrolled',NULL,'2026-09-22 14:23:20','2026-09-22 14:23:21'),
(38,41,1,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-22 14:23:20','2026-09-22 14:23:21'),
(39,42,1,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(40,43,1,3,2,NULL,NULL,NULL,20.00,1,'الرياضيات، الفيزياء','الجمعية','failed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(41,44,1,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(42,45,1,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(43,46,1,3,1,NULL,NULL,NULL,20.00,1,'اللغة الفرنسية','الجمعية','enrolled',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(44,47,1,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(45,48,1,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'failed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(46,49,1,3,2,NULL,NULL,NULL,20.00,1,'الفيزياء والكيمياء','الجمعية','enrolled',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(47,50,1,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(48,51,1,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(49,52,1,3,1,NULL,NULL,NULL,20.00,1,'الرياضيات','الجمعية','passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(50,53,1,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'failed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(51,1,2,4,1,NULL,NULL,NULL,20.00,1,'الرياضيات','الجمعية','passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(52,1,3,3,1,NULL,NULL,NULL,20.00,1,'الرياضيات','الجمعية','passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(53,2,2,4,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(54,2,3,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(55,3,2,4,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(56,3,3,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(57,4,2,4,2,NULL,NULL,NULL,20.00,1,'الرياضيات، الفيزياء','الجمعية','passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(58,4,3,3,2,NULL,NULL,NULL,20.00,1,'الرياضيات، الفيزياء','الجمعية','passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(59,5,2,4,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(60,5,3,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(61,6,2,4,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(62,6,3,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(63,9,2,4,1,NULL,NULL,NULL,20.00,1,'اللغة الفرنسية','الجمعية','passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(64,9,3,3,1,NULL,NULL,NULL,20.00,1,'اللغة الفرنسية','الجمعية','passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(65,10,2,4,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(66,10,3,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(67,11,2,4,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(68,11,3,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(69,12,2,4,2,NULL,NULL,NULL,20.00,1,'الفيزياء والكيمياء','الجمعية','passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(70,12,3,3,2,NULL,NULL,NULL,20.00,1,'الفيزياء والكيمياء','الجمعية','passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(71,13,2,4,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(72,13,3,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(73,14,2,4,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(74,14,3,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(75,15,2,4,1,NULL,NULL,NULL,20.00,1,'الرياضيات','الجمعية','passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(76,15,3,3,1,NULL,NULL,NULL,20.00,1,'الرياضيات','الجمعية','passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(77,16,2,4,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(78,16,3,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(79,17,2,4,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(80,17,3,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(81,19,2,4,2,NULL,NULL,NULL,20.00,1,'الرياضيات، الفيزياء','الجمعية','passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(82,19,3,3,2,NULL,NULL,NULL,20.00,1,'الرياضيات، الفيزياء','الجمعية','passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(83,20,2,4,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(84,20,3,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(85,21,2,4,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(86,21,3,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(87,22,2,4,1,NULL,NULL,NULL,20.00,1,'اللغة الفرنسية','الجمعية','passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(88,22,3,3,1,NULL,NULL,NULL,20.00,1,'اللغة الفرنسية','الجمعية','passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(89,23,2,4,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(90,23,3,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(91,24,2,4,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(92,24,3,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(93,25,2,4,2,NULL,NULL,NULL,20.00,1,'الفيزياء والكيمياء','الجمعية','passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(94,25,3,3,2,NULL,NULL,NULL,20.00,1,'الفيزياء والكيمياء','الجمعية','passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(95,26,2,4,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(96,26,3,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(97,27,2,4,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(98,27,3,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(99,28,2,4,1,NULL,NULL,NULL,20.00,1,'الرياضيات','الجمعية','passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(100,28,3,3,1,NULL,NULL,NULL,20.00,1,'الرياضيات','الجمعية','passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(101,29,2,4,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(102,29,3,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(103,30,2,4,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(104,30,3,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(105,31,2,4,2,NULL,NULL,NULL,20.00,1,'الرياضيات، الفيزياء','الجمعية','passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(106,31,3,3,2,NULL,NULL,NULL,20.00,1,'الرياضيات، الفيزياء','الجمعية','passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(107,32,2,4,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(108,32,3,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(109,33,2,4,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(110,33,3,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(111,34,2,4,1,NULL,NULL,NULL,20.00,1,'اللغة الفرنسية','الجمعية','passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(112,34,3,3,1,NULL,NULL,NULL,20.00,1,'اللغة الفرنسية','الجمعية','passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(113,35,2,4,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(114,35,3,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(115,36,2,4,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(116,36,3,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(117,37,2,4,2,NULL,NULL,NULL,20.00,1,'الفيزياء والكيمياء','الجمعية','passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(118,37,3,3,2,NULL,NULL,NULL,20.00,1,'الفيزياء والكيمياء','الجمعية','passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(119,38,2,4,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(120,38,3,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(121,39,2,4,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(122,39,3,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(123,40,2,4,1,NULL,NULL,NULL,20.00,1,'الرياضيات','الجمعية','passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(124,40,3,3,1,NULL,NULL,NULL,20.00,1,'الرياضيات','الجمعية','passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(125,41,2,4,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(126,41,3,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(127,42,2,4,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(128,42,3,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(129,43,2,4,2,NULL,NULL,NULL,20.00,1,'الرياضيات، الفيزياء','الجمعية','passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(130,43,3,3,2,NULL,NULL,NULL,20.00,1,'الرياضيات، الفيزياء','الجمعية','passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(131,44,2,4,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(132,44,3,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(133,45,2,4,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(134,45,3,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(135,46,2,4,1,NULL,NULL,NULL,20.00,1,'اللغة الفرنسية','الجمعية','passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(136,46,3,3,1,NULL,NULL,NULL,20.00,1,'اللغة الفرنسية','الجمعية','passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(137,47,2,4,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(138,47,3,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(139,48,2,4,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(140,48,3,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(141,49,2,4,2,NULL,NULL,NULL,20.00,1,'الفيزياء والكيمياء','الجمعية','passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(142,49,3,3,2,NULL,NULL,NULL,20.00,1,'الفيزياء والكيمياء','الجمعية','passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(143,50,2,4,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(144,50,3,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(145,51,2,4,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(146,51,3,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(147,52,2,4,1,NULL,NULL,NULL,20.00,1,'الرياضيات','الجمعية','passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(148,52,3,3,1,NULL,NULL,NULL,20.00,1,'الرياضيات','الجمعية','passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(149,53,2,4,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(150,53,3,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21');
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
(1,1,'يوسف','الزهراء','male','2020-05-25',NULL,'ربو مزمن - متابعة شهرية',NULL,NULL,0,NULL,0,0,1,'M000000100',0,0,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(2,1,'مريم','الزهراء','female','2015-06-30',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000000101',0,0,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(3,2,'مريم','بنعلي','male','2017-02-12',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000000200',0,0,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(4,2,'أحمد','بنعلي','female','2012-04-18',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000000201',0,0,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(5,2,'سلمى','بنعلي','male','2007-04-18',NULL,NULL,'0667672491','D859722',0,NULL,0,0,1,'M000000202',0,0,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(6,3,'أحمد','الحسني','male','2014-01-25',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000000300',0,0,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(7,4,'سلمى','المرابط','male','2011-06-28',NULL,NULL,NULL,NULL,1,'خياطة منزلية',0,0,0,'M000000400',0,0,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(8,4,'إلياس','المرابط','female','2006-09-16',NULL,NULL,'0681614971','D338626',1,'خياطة منزلية',0,0,0,'M000000401',0,0,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(9,5,'إلياس','بوزيان','male','2008-08-17',NULL,NULL,'0681207878','D320689',0,NULL,0,0,1,'M000000500',1,0,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(10,6,'زكرياء','العلوي','male','2005-05-01',NULL,NULL,'0616902647','D490585',0,NULL,0,0,1,'M000000600',0,0,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(11,6,'خديجة','العلوي','female','2016-12-31',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000000601',0,0,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(12,6,'عمر','العلوي','male','2012-09-15',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000000602',0,0,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(13,7,'خديجة','الإدريسي','male','2018-12-09',NULL,'ربو مزمن - متابعة شهرية',NULL,NULL,0,NULL,0,0,1,'M000000700',0,1,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(14,7,'عمر','الإدريسي','female','2013-12-15',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000000701',0,1,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(15,8,'عمر','التازي','male','2016-08-23',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000000800',0,0,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(16,9,'هاجر','بنجلون','male','2013-06-14',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000000900',0,0,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(17,9,'أيوب','بنجلون','female','2008-06-27',NULL,NULL,'0693097773','D710285',0,NULL,0,0,1,'M000000901',0,0,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(18,10,'أيوب','الوردي','male','2010-01-30',NULL,NULL,NULL,NULL,0,NULL,0,1,0,'M000001000',0,0,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(19,11,'نور','الفاسي','male','2007-05-07',NULL,NULL,'0613103513','D452146',0,NULL,0,0,1,'M000001100',0,0,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(20,11,'حمزة','الفاسي','female','2019-07-11',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000001101',0,0,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(21,12,'حمزة','بركة','male','2004-09-21',NULL,NULL,'0650846182','D701154',0,NULL,0,0,1,'M000001200',0,0,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(22,12,'يوسف','بركة','female','2015-12-14',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000001201',0,0,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(23,12,'مريم','بركة','male','2011-05-16',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000001202',0,0,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(24,12,'أحمد','بركة','female','2006-08-15',NULL,NULL,'0691122672','D156866',0,NULL,0,0,1,'M000001203',0,0,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(25,13,'يوسف','الصقلي','male','2018-04-03',NULL,'ربو مزمن - متابعة شهرية',NULL,NULL,0,NULL,0,0,1,'M000001300',0,0,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(26,13,'مريم','الصقلي','female','2013-02-15',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000001301',0,0,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(27,14,'مريم','العمراني','male','2015-01-07',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000001400',0,0,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(28,14,'أحمد','العمراني','female','2010-04-26',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000001401',0,0,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(29,14,'سلمى','العمراني','male','2005-03-03',NULL,NULL,'0693827592','D623619',0,NULL,0,0,1,'M000001402',0,0,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(30,15,'أحمد','الحداد','male','2011-12-31',NULL,NULL,NULL,NULL,1,'تنظيف',0,0,1,'M000001500',0,0,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(31,16,'سلمى','الرامي','male','2009-05-11',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000001600',0,0,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(32,16,'إلياس','الرامي','female','2003-12-19',NULL,NULL,'0685310495','D384352',0,NULL,0,0,1,'M000001601',0,0,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(33,17,'إلياس','الشامي','male','2006-07-23',NULL,NULL,'0651331164','D202317',0,NULL,0,0,1,'M000001700',0,0,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(34,17,'زكرياء','الشامي','female','2018-04-04',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000001701',0,0,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(35,17,'خديجة','الشامي','male','2012-11-30',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000001702',0,0,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(36,18,'زكرياء','بنعمر','male','2020-09-16',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000001800',0,0,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(37,18,'خديجة','بنعمر','female','2015-08-16',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000001801',0,0,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(38,19,'خديجة','الكتاني','male','2017-02-13',NULL,'ربو مزمن - متابعة شهرية',NULL,NULL,0,NULL,0,0,1,'M000001900',0,0,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(39,20,'عمر','السباعي','male','2014-09-05',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000002000',0,0,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(40,20,'هاجر','السباعي','female','2009-03-31',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000002001',0,0,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(41,20,'أيوب','السباعي','male','2003-12-08',NULL,NULL,'0617297769','D331559',0,NULL,0,0,1,'M000002002',0,0,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(42,21,'هاجر','المنصوري','male','2011-08-22',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000002100',0,0,'2026-09-22 14:23:21','2026-09-22 14:23:21',NULL),
(43,21,'أيوب','المنصوري','female','2006-08-06',NULL,NULL,'0679125122','D697915',0,NULL,0,0,1,'M000002101',0,0,'2026-09-22 14:23:21','2026-09-22 14:23:21',NULL),
(44,22,'أيوب','بلحاج','male','2008-09-13',NULL,NULL,'0631979797','D437544',0,NULL,0,0,1,'M000002200',0,0,'2026-09-22 14:23:21','2026-09-22 14:23:21',NULL),
(45,22,'نور','بلحاج','female','2020-07-07',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000002201',0,0,'2026-09-22 14:23:21','2026-09-22 14:23:21',NULL),
(46,22,'حمزة','بلحاج','male','2015-05-02',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000002202',0,0,'2026-09-22 14:23:21','2026-09-22 14:23:21',NULL),
(47,22,'يوسف','بلحاج','female','2010-04-02',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000002203',0,0,'2026-09-22 14:23:21','2026-09-22 14:23:21',NULL),
(48,23,'نور','الغزواني','male','2005-03-22',NULL,NULL,'0659698013','D850889',0,NULL,0,0,1,'M000002300',0,0,'2026-09-22 14:23:21','2026-09-22 14:23:21',NULL),
(49,24,'حمزة','الرگراگي','male','2018-12-15',NULL,NULL,NULL,NULL,1,'بيع منتجات منزلية',0,0,1,'M000002400',0,0,'2026-09-22 14:23:21','2026-09-22 14:23:21',NULL),
(50,24,'يوسف','الرگراگي','female','2014-09-12',NULL,NULL,NULL,NULL,1,'بيع منتجات منزلية',0,0,1,'M000002401',0,0,'2026-09-22 14:23:21','2026-09-22 14:23:21',NULL),
(51,25,'يوسف','أوبيهي','male','2016-09-14',NULL,'ربو مزمن - متابعة شهرية',NULL,NULL,0,NULL,0,0,1,'M000002500',0,0,'2026-09-22 14:23:21','2026-09-22 14:23:21',NULL),
(52,25,'مريم','أوبيهي','female','2011-03-03',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000002501',0,0,'2026-09-22 14:23:21','2026-09-22 14:23:21',NULL),
(53,25,'أحمد','أوبيهي','male','2005-12-16',NULL,NULL,'0610253619','D566819',0,NULL,0,0,1,'M000002502',0,0,'2026-09-22 14:23:21','2026-09-22 14:23:21',NULL);
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
(1,'لم يلتحق بالمدرسة','Not Enrolled',1,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(2,'روضة أطفال','Kindergarten',2,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(3,'الصف الأول الابتدائي','First Grade',3,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(4,'الصف الثاني الابتدائي','Second Grade',4,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(5,'الصف الثالث الابتدائي','Third Grade',5,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(6,'الصف الرابع الابتدائي','Fourth Grade',6,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(7,'الصف الخامس الابتدائي','Fifth Grade',7,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(8,'الصف السادس الابتدائي','Sixth Grade',8,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(9,'الصف الأول الإعدادي','Seventh Grade',9,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(10,'الصف الثاني الإعدادي','Eighth Grade',10,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(11,'الصف الثالث الإعدادي','Ninth Grade',11,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(12,'الصف الأول الثانوي','Tenth Grade',12,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(13,'الصف الثاني الثانوي','Eleventh Grade',13,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(14,'الصف الثالث الثانوي','Twelfth Grade',14,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(15,'تخرج من الثانوية','High School Graduate',15,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(16,'جامعي','University',16,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(17,'تخرج من الجامعة','University Graduate',17,1,'2026-09-22 14:23:20','2026-09-22 14:23:20');
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
(1,'التغذية','2026-09-22 14:23:20','2026-09-22 14:23:20');
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
(1,1,'مواد غذائية','2026-09-22 14:23:20','2026-09-22 14:23:20');
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
(1,'جمعية الإحسان','0522334455',NULL,NULL,1,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(2,'مؤسسة الخير','0522667788',NULL,NULL,1,1,'2026-09-22 14:23:20','2026-09-22 14:23:20');
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
(1,'مدرسة الأمل الابتدائية','school',0,0,NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(2,'مدرسة النور الخاصة','school',1,1,NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(3,'إعدادية الفتح','school',0,0,NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(4,'ثانوية النهضة','school',0,0,NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(5,'كلية العلوم - جامعة ابن زهر','university',0,0,NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(6,'المعهد العالي للتكنولوجيا التطبيقية','university',1,0,NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21');
/*!40000 ALTER TABLE `schools` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `sectors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sectors` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `label` varchar(120) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sectors_label_unique` (`label`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `sectors` WRITE;
/*!40000 ALTER TABLE `sectors` DISABLE KEYS */;
/*!40000 ALTER TABLE `sectors` ENABLE KEYS */;
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
INSERT INTO `settings` VALUES
('idda_monthly_allowance','400','2026-09-22 14:23:19','2026-09-22 14:23:19');
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
(1,'خياطة','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(2,'طبخ','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(3,'تنظيف','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(4,'تدريس','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(5,'أشغال يدوية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(6,'حياكة','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(7,'تطريز','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(8,'حلاقة نسائية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(9,'ماكياج','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(10,'حاسوب','2026-09-22 14:23:20','2026-09-22 14:23:20');
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
(1,1,'2026-09-06',1,2,6000.00,'تغطية مستحقات الكفالات الشهرية','Approved',1,1,'2026-09-22 14:23:22','2026-09-22 14:23:22','2026-09-22 14:23:22'),
(2,1,'2026-09-22',2,1,1500.00,'إرجاع فائض الشهر الماضي','Draft',1,NULL,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22');
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
(1,1,2,'bus',1,0,NULL,0.00,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(2,1,4,'bus',1,17,NULL,171.79,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(3,1,6,'bus',1,14,NULL,141.47,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(4,1,7,'bus',1,18,NULL,181.89,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(5,1,9,'bus',1,15,NULL,151.58,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(6,1,10,'bus',1,19,NULL,191.99,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(7,1,11,'allowance',0,7,15.00,105.00,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(8,1,13,'bus',1,20,NULL,202.10,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(9,1,14,'bus',1,17,NULL,171.79,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(10,1,16,'bus',1,0,NULL,0.00,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(11,1,17,'bus',1,18,NULL,181.89,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(12,1,19,'allowance',0,7,12.00,84.00,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(13,1,20,'bus',1,19,NULL,191.99,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(14,1,21,'bus',1,16,NULL,161.68,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(15,1,23,'bus',1,20,NULL,202.10,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(16,1,24,'bus',1,17,NULL,171.78,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(17,1,26,'bus',1,14,NULL,141.47,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(18,1,28,'bus',1,18,NULL,181.89,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(19,1,1,'bus',1,0,NULL,0.00,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(20,1,3,'allowance',0,10,10.00,100.00,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(21,1,5,'bus',1,16,NULL,161.68,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(22,1,8,'bus',1,20,NULL,202.10,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(23,1,12,'bus',1,17,NULL,171.78,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(24,1,15,'bus',1,14,NULL,141.47,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(25,1,18,'bus',1,18,NULL,181.89,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(26,1,22,'bus',1,15,NULL,151.58,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(27,1,25,'bus',1,19,NULL,191.99,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(28,1,27,'allowance',0,8,10.00,80.00,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(29,1,29,'bus',1,20,NULL,202.10,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(30,2,2,'bus',1,19,NULL,211.88,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(31,2,4,'bus',1,16,NULL,178.43,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(32,2,6,'bus',1,20,NULL,223.04,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(33,2,7,'bus',1,17,NULL,189.58,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(34,2,9,'bus',1,14,NULL,156.13,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(35,2,10,'bus',1,18,NULL,200.73,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(36,2,11,'allowance',0,8,15.00,120.00,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(37,2,13,'bus',1,19,NULL,211.88,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(38,2,14,'bus',1,0,NULL,0.00,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(39,2,16,'bus',1,20,NULL,223.04,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(40,2,17,'bus',1,17,NULL,189.58,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(41,2,19,'allowance',0,8,12.00,96.00,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(42,2,20,'bus',1,18,NULL,200.73,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(43,2,21,'bus',1,15,NULL,167.28,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(44,2,23,'bus',1,19,NULL,211.88,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(45,2,24,'bus',1,16,NULL,178.43,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(46,2,26,'bus',1,20,NULL,223.04,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(47,2,28,'bus',1,0,NULL,0.00,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(48,2,1,'bus',1,14,NULL,156.13,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(49,2,3,'allowance',0,6,10.00,60.00,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(50,2,5,'bus',1,15,NULL,167.28,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(51,2,8,'bus',1,19,NULL,211.88,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(52,2,12,'bus',1,16,NULL,178.43,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(53,2,15,'bus',1,20,NULL,223.04,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(54,2,18,'bus',1,17,NULL,189.58,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(55,2,22,'bus',1,14,NULL,156.13,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(56,2,25,'bus',1,0,NULL,0.00,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(57,2,27,'allowance',0,9,10.00,90.00,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(58,2,29,'bus',1,19,NULL,211.88,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(59,3,2,'bus',1,18,NULL,182.90,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(60,3,4,'bus',1,15,NULL,152.42,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(61,3,6,'bus',1,19,NULL,193.07,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(62,3,7,'bus',1,16,NULL,162.58,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(63,3,9,'bus',1,20,NULL,203.23,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(64,3,10,'bus',1,17,NULL,172.74,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(65,3,11,'allowance',0,9,15.00,135.00,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(66,3,13,'bus',1,0,NULL,0.00,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(67,3,14,'bus',1,15,NULL,152.42,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(68,3,16,'bus',1,19,NULL,193.07,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(69,3,17,'bus',1,16,NULL,162.58,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(70,3,19,'allowance',0,9,12.00,108.00,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(71,3,20,'bus',1,17,NULL,172.74,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(72,3,21,'bus',1,14,NULL,142.26,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(73,3,23,'bus',1,18,NULL,182.90,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(74,3,24,'bus',1,15,NULL,152.42,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(75,3,26,'bus',1,0,NULL,0.00,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(76,3,28,'bus',1,16,NULL,162.58,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(77,3,1,'bus',1,20,NULL,203.23,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(78,3,3,'allowance',0,7,10.00,70.00,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(79,3,5,'bus',1,14,NULL,142.26,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(80,3,8,'bus',1,18,NULL,182.90,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(81,3,12,'bus',1,15,NULL,152.42,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(82,3,15,'bus',1,19,NULL,193.06,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(83,3,18,'bus',1,16,NULL,162.58,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(84,3,22,'bus',1,0,NULL,0.00,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(85,3,25,'bus',1,17,NULL,172.74,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(86,3,27,'allowance',0,10,10.00,100.00,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(87,3,29,'bus',1,18,NULL,182.90,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22');
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
(1,1,'2026-10-01',1850.00,2000.00,0.00,NULL,'2026-10-31 23:59:59',NULL,'2026-10-31 23:59:59',NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(2,1,'2026-11-01',1920.00,2000.00,340.00,NULL,'2026-11-30 23:59:59',NULL,NULL,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(3,1,'2026-12-01',1780.00,2000.00,0.00,NULL,NULL,NULL,NULL,NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22');
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
(1,1,'bus','أمام المسجد',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(2,3,'bus','أمام الفرن',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(3,4,'allowance',NULL,10.00,'2026-09-15',NULL,'active','يسكن خارج مسار الحافلة','2026-09-22 14:23:21','2026-09-22 14:23:21'),
(4,5,'bus','أمام المسجد',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(5,7,'bus','أمام الفرن',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(6,9,'bus','أمام المسجد',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(7,11,'bus','أمام الفرن',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(8,13,'bus','أمام المسجد',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(9,15,'bus','أمام الفرن',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(10,17,'bus','أمام المسجد',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(11,18,'allowance',NULL,15.00,'2026-09-15',NULL,'active','يسكن خارج مسار الحافلة','2026-09-22 14:23:21','2026-09-22 14:23:21'),
(12,19,'bus','أمام الفرن',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(13,21,'bus','أمام المسجد',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(14,23,'bus','أمام الفرن',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(15,25,'bus','أمام المسجد',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(16,27,'bus','أمام الفرن',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(17,29,'bus','أمام المسجد',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(18,31,'bus','أمام الفرن',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(19,32,'allowance',NULL,12.00,'2026-09-15',NULL,'active','يسكن خارج مسار الحافلة','2026-09-22 14:23:22','2026-09-22 14:23:22'),
(20,33,'bus','أمام المسجد',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(21,35,'bus','أمام الفرن',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(22,37,'bus','أمام المسجد',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(23,39,'bus','أمام الفرن',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(24,41,'bus','أمام المسجد',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(25,43,'bus','أمام الفرن',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(26,45,'bus','أمام المسجد',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(27,46,'allowance',NULL,10.00,'2026-09-15',NULL,'active','يسكن خارج مسار الحافلة','2026-09-22 14:23:22','2026-09-22 14:23:22'),
(28,47,'bus','أمام الفرن',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22'),
(29,49,'bus','أمام المسجد',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-22 14:23:22','2026-09-22 14:23:22');
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
(1,'محمد بنصديق','mohamed@amaso.site','superuser',NULL,NULL,1,NULL,'2026-09-22 14:23:19','$2y$12$67DMlimF9SRxST0X6uZhMOaDfDiTkd//TWzvY7E.jI1jRPXgXntg6',NULL,'2026-09-22 14:23:19','2026-09-22 14:23:19'),
(2,'بشرى','bouchra@amaso.site','superuser',NULL,NULL,1,NULL,'2026-09-22 14:23:20','$2y$12$cCxWqXYhf2sukMqPoDeg/OgqkwAKZLcnr7MXsYhjDbmOM1MoGVltm',NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20');
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
(1,'إيجار','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(2,'طعام','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(3,'دواء','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(4,'تعليم','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(5,'فواتير','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(6,'مواصلات','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(7,'ملابس','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(8,'مستلزمات منزلية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(9,'رعاية صحية','2026-09-22 14:23:20','2026-09-22 14:23:20');
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
(1,1,'widow',1,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(2,2,'widow',0,0,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(3,3,'widow',0,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(4,4,'widow',1,0,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(5,5,'widow',0,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(6,6,'widow',0,0,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(7,7,'widow',1,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(8,8,'widow',0,0,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(9,9,'widow',0,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(10,10,'widow',1,0,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(11,11,'widow',0,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(12,12,'widow',0,0,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(13,13,'widow',1,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(14,14,'widow',0,0,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(15,15,'widow',0,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(16,16,'widow',1,0,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(17,17,'widow',0,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(18,18,'widow',0,0,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(19,19,'widow',1,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(20,20,'widow',0,0,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(21,21,'widow',0,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(22,22,'widow',1,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(23,23,'widow',0,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(24,24,'widow',0,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(25,25,'widow',1,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(26,26,'widow',0,0,'2026-09-22 14:23:21','2026-09-22 14:23:21');
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
(1,'راتب','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(2,'معاش','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(3,'مساعدة','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(4,'تجارة','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(5,'عمل حر','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(6,'تبرعات','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(7,'إيجار عقار','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(8,'حرفة','2026-09-22 14:23:20','2026-09-22 14:23:20');
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
(1,1,1,495.00,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(2,3,1,203.00,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(3,5,1,329.00,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(4,7,1,499.00,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(5,9,1,301.00,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(6,11,1,433.00,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(7,13,1,258.00,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(8,15,1,434.00,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(9,17,1,352.00,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(10,19,1,367.00,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(11,21,1,383.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(12,23,1,383.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(13,25,1,282.00,1,'2026-09-22 14:23:21','2026-09-22 14:23:21');
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
(1,1,'0574709136','هاتف الجيران','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(2,4,'0548339938','هاتف الجيران','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(3,7,'0579070032','هاتف الجيران','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(4,10,'0516518525','هاتف الجيران','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(5,13,'0523581933','هاتف الجيران','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(6,16,'0583121616','هاتف الجيران','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(7,19,'0554807941','هاتف الجيران','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(8,22,'0532171032','هاتف الجيران','2026-09-22 14:23:21','2026-09-22 14:23:21'),
(9,25,'0566583127','هاتف الجيران','2026-09-22 14:23:21','2026-09-22 14:23:21');
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
(1,1,1,'rented',0,0,0,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(2,2,2,'owned',1,1,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(3,3,3,'free',1,1,2,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(4,4,1,'rented',1,1,3,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(5,5,2,'owned',1,1,4,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(6,6,3,'free',0,1,5,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(7,7,1,'rented',1,1,0,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(8,8,2,'owned',1,0,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(9,9,3,'free',1,1,2,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(10,10,1,'rented',1,1,3,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(11,11,2,'owned',0,1,4,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(12,12,3,'free',1,1,5,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(13,13,1,'rented',1,1,0,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(14,14,2,'owned',1,1,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(15,15,3,'free',1,0,2,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(16,16,1,'rented',0,1,3,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(17,17,2,'owned',1,1,4,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(18,18,3,'free',1,1,5,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(19,19,1,'rented',1,1,0,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(20,20,2,'owned',1,1,1,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(21,21,3,'free',0,1,2,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(22,22,1,'rented',1,0,3,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(23,23,2,'owned',1,1,4,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(24,24,3,'free',1,1,5,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(25,25,1,'rented',1,1,0,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(26,26,2,'owned',0,1,1,'2026-09-22 14:23:21','2026-09-22 14:23:21');
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
(1,1,2,1000.00,'مصاريف التغذية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(2,1,1,700.00,'كراء السكن','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(3,1,3,150.00,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(4,2,2,1250.00,'مصاريف التغذية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(5,2,4,300.00,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(6,3,2,750.00,'مصاريف التغذية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(7,3,5,220.00,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(8,4,2,1000.00,'مصاريف التغذية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(9,4,1,700.00,'كراء السكن','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(10,4,6,400.00,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(11,5,2,750.00,'مصاريف التغذية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(12,5,3,150.00,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(13,6,2,1250.00,'مصاريف التغذية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(14,6,4,300.00,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(15,7,2,1000.00,'مصاريف التغذية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(16,7,1,700.00,'كراء السكن','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(17,7,5,220.00,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(18,8,2,750.00,'مصاريف التغذية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(19,8,6,400.00,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(20,9,2,1000.00,'مصاريف التغذية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(21,9,3,150.00,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(22,10,2,750.00,'مصاريف التغذية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(23,10,1,700.00,'كراء السكن','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(24,10,4,300.00,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(25,11,2,1000.00,'مصاريف التغذية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(26,11,5,220.00,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(27,12,2,1500.00,'مصاريف التغذية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(28,12,6,400.00,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(29,13,2,1000.00,'مصاريف التغذية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(30,13,1,700.00,'كراء السكن','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(31,13,3,150.00,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(32,14,2,1250.00,'مصاريف التغذية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(33,14,4,300.00,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(34,15,2,750.00,'مصاريف التغذية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(35,15,5,220.00,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(36,16,2,1000.00,'مصاريف التغذية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(37,16,1,700.00,'كراء السكن','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(38,16,6,400.00,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(39,17,2,1250.00,'مصاريف التغذية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(40,17,3,150.00,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(41,18,2,1000.00,'مصاريف التغذية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(42,18,4,300.00,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(43,19,2,750.00,'مصاريف التغذية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(44,19,1,700.00,'كراء السكن','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(45,19,5,220.00,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(46,20,2,1250.00,'مصاريف التغذية','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(47,20,6,400.00,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20'),
(48,21,2,1000.00,'مصاريف التغذية','2026-09-22 14:23:21','2026-09-22 14:23:21'),
(49,21,3,150.00,NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(50,22,2,1500.00,'مصاريف التغذية','2026-09-22 14:23:21','2026-09-22 14:23:21'),
(51,22,1,700.00,'كراء السكن','2026-09-22 14:23:21','2026-09-22 14:23:21'),
(52,22,4,300.00,NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(53,23,2,750.00,'مصاريف التغذية','2026-09-22 14:23:21','2026-09-22 14:23:21'),
(54,23,5,220.00,NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(55,24,2,1000.00,'مصاريف التغذية','2026-09-22 14:23:21','2026-09-22 14:23:21'),
(56,24,6,400.00,NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(57,25,2,1250.00,'مصاريف التغذية','2026-09-22 14:23:21','2026-09-22 14:23:21'),
(58,25,1,700.00,'كراء السكن','2026-09-22 14:23:21','2026-09-22 14:23:21'),
(59,25,3,150.00,NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21'),
(60,26,2,500.00,'مصاريف التغذية','2026-09-22 14:23:21','2026-09-22 14:23:21'),
(61,26,4,300.00,NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21');
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
(1,1,1,600.00,'مدخول شهري قار','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(2,1,5,200.00,'عمل موسمي','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(3,2,2,850.00,'مدخول شهري قار','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(4,3,1,400.00,'مدخول شهري قار','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(5,5,1,750.00,'مدخول شهري قار','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(6,6,2,600.00,'مدخول شهري قار','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(7,7,1,850.00,'مدخول شهري قار','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(8,7,5,200.00,'عمل موسمي','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(9,8,2,400.00,'مدخول شهري قار','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(10,9,1,1100.00,'مدخول شهري قار','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(11,10,2,750.00,'مدخول شهري قار','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(12,10,5,200.00,'عمل موسمي','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(13,11,1,600.00,'مدخول شهري قار','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(14,13,1,400.00,'مدخول شهري قار','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(15,13,5,200.00,'عمل موسمي','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(16,14,2,1100.00,'مدخول شهري قار','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(17,15,1,750.00,'مدخول شهري قار','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(18,16,2,600.00,'مدخول شهري قار','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(19,16,5,200.00,'عمل موسمي','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(20,17,1,850.00,'مدخول شهري قار','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(21,18,2,400.00,'مدخول شهري قار','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(22,19,1,1100.00,'مدخول شهري قار','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(23,19,5,200.00,'عمل موسمي','2026-09-22 14:23:20','2026-09-22 14:23:20'),
(24,21,1,600.00,'مدخول شهري قار','2026-09-22 14:23:21','2026-09-22 14:23:21'),
(25,22,2,850.00,'مدخول شهري قار','2026-09-22 14:23:21','2026-09-22 14:23:21'),
(26,22,5,200.00,'عمل موسمي','2026-09-22 14:23:21','2026-09-22 14:23:21'),
(27,23,1,400.00,'مدخول شهري قار','2026-09-22 14:23:21','2026-09-22 14:23:21'),
(28,24,2,1100.00,'مدخول شهري قار','2026-09-22 14:23:21','2026-09-22 14:23:21'),
(29,25,1,750.00,'مدخول شهري قار','2026-09-22 14:23:21','2026-09-22 14:23:21'),
(30,25,5,200.00,'عمل موسمي','2026-09-22 14:23:21','2026-09-22 14:23:21'),
(31,26,2,600.00,'مدخول شهري قار','2026-09-22 14:23:21','2026-09-22 14:23:21');
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
  `husband_death_date` date DEFAULT NULL,
  `idda_end_date` date DEFAULT NULL,
  `is_idda_case` tinyint(1) NOT NULL DEFAULT 0,
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
  KEY `widows_admission_date_index` (`admission_date`),
  KEY `widows_idda_case_index` (`is_idda_case`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `widows` WRITE;
/*!40000 ALTER TABLE `widows` DISABLE KEYS */;
INSERT INTO `widows` VALUES
(1,'فاطمة','الزهراء','0614172187',NULL,'شارع 0, حي السلام','حي السلام','2025-12-22','DEMO000001','1993-09-22',NULL,NULL,0,'Widowed','عمة الأيتام','بدون',0,NULL,NULL,NULL,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(2,'خديجة','بنعلي','0685579493',NULL,'شارع 1, حي النور','حي النور','2025-08-22','DEMO000002','1974-09-22',NULL,NULL,0,'Widowed',NULL,'ابتدائي',0,NULL,NULL,NULL,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(3,'أمينة','الحسني','0632975229',NULL,'شارع 2, حي الأمل','حي الأمل','2024-04-22','DEMO000003','1973-09-22',NULL,NULL,0,'Widowed',NULL,'إعدادي',0,NULL,NULL,NULL,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(4,'زينب','المرابط','0695483214',NULL,'شارع 3, حي الفتح','حي الفتح','2024-11-22','DEMO000004','1996-09-22',NULL,NULL,0,'Widowed',NULL,'ثانوي',0,NULL,NULL,NULL,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(5,'سعاد','بوزيان','0664685577',NULL,'شارع 4, حي الرحمة','حي الرحمة','2026-03-22','DEMO000005','1978-09-22',NULL,NULL,0,'Widowed','عمة الأيتام','جامعي',0,NULL,NULL,NULL,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(6,'نادية','العلوي','0641000943',NULL,'شارع 5, حي السلام','حي السلام','2025-09-22','DEMO000006','1992-09-22',NULL,NULL,0,'Widowed',NULL,'بدون',0,NULL,NULL,NULL,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(7,'حياة','الإدريسي','0626051505',NULL,'شارع 6, حي النور','حي النور','2025-06-22','DEMO000007','1983-09-22',NULL,NULL,0,'Widowed',NULL,'ابتدائي',0,NULL,NULL,NULL,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(8,'رشيدة','التازي','0693484998',NULL,'شارع 7, حي الأمل','حي الأمل','2025-04-22','DEMO000008','1973-09-22',NULL,NULL,0,'Widowed',NULL,'إعدادي',0,NULL,NULL,NULL,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(9,'لطيفة','بنجلون','0647902374',NULL,'شارع 8, حي الفتح','حي الفتح','2024-07-22','DEMO000009','1993-09-22',NULL,NULL,0,'Widowed','عمة الأيتام','ثانوي',0,NULL,NULL,NULL,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(10,'سميرة','الوردي','0659774618',NULL,'شارع 9, حي الرحمة','حي الرحمة','2025-04-22','DEMO000010','1996-09-22',NULL,NULL,0,'Widowed',NULL,'جامعي',0,NULL,NULL,NULL,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(11,'كريمة','الفاسي','0642599303',NULL,'شارع 10, حي السلام','حي السلام','2026-02-22','DEMO000011','1984-09-22',NULL,NULL,0,'Widowed',NULL,'بدون',0,NULL,NULL,NULL,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(12,'نعيمة','بركة','0671828516',NULL,'شارع 11, حي المسيرة','حي المسيرة','2024-07-22','DEMO000012','1995-09-22',NULL,NULL,0,'Widowed',NULL,'ابتدائي',0,NULL,NULL,NULL,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(13,'حنان','الصقلي','0653856450',NULL,'شارع 12, حي النهضة','حي النهضة','2026-04-22','DEMO000013','1983-09-22',NULL,NULL,0,'Widowed','عمة الأيتام','إعدادي',1,'إعاقة حركية جزئية',NULL,NULL,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(14,'بشرى','العمراني','0622987142',NULL,'شارع 13, حي الوفاق','حي الوفاق','2025-01-22','DEMO000014','1971-09-22',NULL,NULL,0,'Widowed',NULL,'ثانوي',0,NULL,NULL,NULL,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(15,'مليكة','الحداد','0633067663',NULL,'شارع 14, حي السلام','حي السلام','2026-02-22','DEMO000015','1979-09-22',NULL,NULL,0,'Widowed',NULL,'جامعي',0,NULL,NULL,NULL,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(16,'سناء','الرامي','0647068523',NULL,'شارع 15, حي النور','حي النور','2025-01-22','DEMO000016','1990-09-22',NULL,NULL,0,'Widowed',NULL,'بدون',0,NULL,NULL,NULL,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(17,'وفاء','الشامي','0676126337',NULL,'شارع 16, حي المسيرة','حي المسيرة','2026-01-22','DEMO000017','1975-09-22',NULL,NULL,0,'Widowed','عمة الأيتام','ابتدائي',0,NULL,NULL,NULL,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(18,'ثريا','بنعمر','0699765108',NULL,'شارع 17, حي الأمل','حي الأمل','2026-02-22','DEMO000018','1984-09-22',NULL,NULL,0,'Widowed',NULL,'إعدادي',0,NULL,NULL,NULL,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(19,'جميلة','الكتاني','0690701316',NULL,'شارع 18, حي النهضة','حي النهضة','2026-03-22','DEMO000019','1975-09-22',NULL,NULL,0,'Widowed',NULL,'ثانوي',0,NULL,NULL,NULL,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(20,'رجاء','السباعي','0614208507',NULL,'شارع 19, حي الفتح','حي الفتح','2025-07-22','DEMO000020','1980-09-22',NULL,NULL,0,'Widowed',NULL,'جامعي',0,NULL,NULL,NULL,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(21,'هدى','المنصوري','0699158110',NULL,'شارع 20, حي الوفاق','حي الوفاق','2025-10-22','DEMO000021','1977-09-22',NULL,NULL,0,'Widowed','عمة الأيتام','بدون',0,NULL,NULL,NULL,NULL,'2026-09-22 14:23:20','2026-09-22 14:23:20',NULL),
(22,'أسماء','بلحاج','0664147068',NULL,'شارع 21, حي الرحمة','حي الرحمة','2024-05-22','DEMO000022','1993-09-22',NULL,NULL,0,'Widowed',NULL,'ابتدائي',0,NULL,NULL,NULL,NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21',NULL),
(23,'ابتسام','الغزواني','0630708217',NULL,'شارع 22, حي المسيرة','حي المسيرة','2024-04-22','DEMO000023','1978-09-22',NULL,NULL,0,'Widowed',NULL,'إعدادي',0,NULL,NULL,NULL,NULL,'2026-09-22 14:23:21','2026-09-22 14:23:21',NULL),
(24,'مينة','الرگراگي','0665863225',NULL,'شارع 23, حي النهضة','حي النهضة','2026-04-10','DEMO000024','1993-09-22','2026-03-22','2026-09-04',1,'Widowed',NULL,'ثانوي',0,NULL,NULL,NULL,NULL,'2026-09-22 14:23:21','2026-09-22 14:23:22',NULL),
(25,'فتيحة','أوبيهي','0635846095',NULL,'شارع 24, حي الوفاق','حي الوفاق','2026-08-13','DEMO000025','1986-09-22','2026-07-16','2026-11-26',1,'Widowed','عمة الأيتام','جامعي',0,NULL,NULL,NULL,NULL,'2026-09-22 14:23:21','2026-09-22 14:23:22',NULL),
(26,'زهور','التمسماني','0662659052',NULL,'شارع 25, حي السلام','حي السلام','2025-04-22','DEMO000026','1991-09-22',NULL,NULL,0,'Widowed',NULL,'بدون',0,NULL,'2026-09-19','graduated','انتقلت الأسرة إلى مدينة أخرى بعد تحسن وضعها','2026-09-22 14:23:21','2026-09-22 14:23:22','2026-09-22 14:23:22');
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
