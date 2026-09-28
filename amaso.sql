-- AMASO - قاعدة بيانات تجريبية / Demo database
-- جمعية المنصور لكفالة اليتيم
--
-- Generated: 2026-09-22  (by backend/regenerate-demo-sql.sh)
-- Charset:   utf8mb4 / utf8mb4_unicode_ci
--
-- ماذا يحتوي هذا الملف / What this file contains
--   Schema for all 63 tables and the v_current_cash view, plus reference
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
(1,2026,'2026/2027',1,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(2,2024,'2024/2025',0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(3,2025,'2025/2026',0,'2026-09-22 22:20:12','2026-09-22 22:20:12');
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
(1,'مساعدة شهرية','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(2,'مساعدة طبية','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(3,'مساعدة تعليمية','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(4,'مساعدة طارئة','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(5,'مساعدة غذائية','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(6,'مساعدة كسوة','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(7,'مساعدة إيجار','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(8,'مساعدة فواتير','2026-09-22 22:20:11','2026-09-22 22:20:11');
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
(1,2,'income',24,400.00,20400.00,'اعتماد إيراد بحوالة بنكية',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(2,2,'income',25,400.00,20800.00,'اعتماد إيراد بحوالة بنكية',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(3,2,'expense',1,-750.00,20050.00,'اعتماد مصروف',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(4,1,'expense',2,-1200.00,48800.00,'اعتماد مصروف',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(5,2,'expense',3,-450.00,19600.00,'اعتماد مصروف',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(6,1,'expense',4,-600.00,48200.00,'اعتماد مصروف',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(7,2,'expense',5,-900.00,18700.00,'اعتماد مصروف',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(8,1,'expense',6,-1350.00,46850.00,'اعتماد مصروف',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(9,2,'expense',7,-520.00,18180.00,'اعتماد مصروف',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(10,1,'expense',10,-1500.00,45350.00,'اعتماد مصروف',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(11,1,'transfer_out',1,-6000.00,39350.00,'تحويل إلى حساب \"حساب الكفالات\"',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(12,2,'transfer_in',1,6000.00,24180.00,'تحويل من حساب \"الحساب الرئيسي\"',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13');
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
(1,'الحساب الرئيسي','بنك التجارة','MA-1001',39350.00,50000.00,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:13'),
(2,'حساب الكفالات','بنك الوفاء','MA-1002',24180.00,20000.00,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:13');
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
(1,'Widow',1,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(2,'Orphan',NULL,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(3,'Orphan',NULL,2,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(4,'Widow',2,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(5,'Orphan',NULL,3,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(6,'Orphan',NULL,4,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(7,'Orphan',NULL,5,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(8,'Widow',3,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(9,'Orphan',NULL,6,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(10,'Widow',4,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(11,'Orphan',NULL,7,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(12,'Orphan',NULL,8,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(13,'Widow',5,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(14,'Orphan',NULL,9,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(15,'Widow',6,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(16,'Orphan',NULL,10,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(17,'Orphan',NULL,11,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(18,'Orphan',NULL,12,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(19,'Widow',7,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(20,'Orphan',NULL,13,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(21,'Orphan',NULL,14,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(22,'Widow',8,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(23,'Orphan',NULL,15,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(24,'Widow',9,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(25,'Orphan',NULL,16,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(26,'Orphan',NULL,17,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(27,'Widow',10,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(28,'Orphan',NULL,18,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(29,'Widow',11,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(30,'Orphan',NULL,19,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(31,'Orphan',NULL,20,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(32,'Widow',12,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(33,'Orphan',NULL,21,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(34,'Orphan',NULL,22,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(35,'Orphan',NULL,23,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(36,'Orphan',NULL,24,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(37,'Widow',13,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(38,'Orphan',NULL,25,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(39,'Orphan',NULL,26,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(40,'Widow',14,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(41,'Orphan',NULL,27,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(42,'Orphan',NULL,28,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(43,'Orphan',NULL,29,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(44,'Widow',15,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(45,'Orphan',NULL,30,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(46,'Widow',16,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(47,'Orphan',NULL,31,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(48,'Orphan',NULL,32,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(49,'Widow',17,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(50,'Orphan',NULL,33,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(51,'Orphan',NULL,34,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(52,'Orphan',NULL,35,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(53,'Widow',18,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(54,'Orphan',NULL,36,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(55,'Orphan',NULL,37,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(56,'Widow',19,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(57,'Orphan',NULL,38,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(58,'Widow',20,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(59,'Orphan',NULL,39,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(60,'Orphan',NULL,40,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(61,'Orphan',NULL,41,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(62,'Widow',21,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(63,'Orphan',NULL,42,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(64,'Orphan',NULL,43,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(65,'Widow',22,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(66,'Orphan',NULL,44,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(67,'Orphan',NULL,45,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(68,'Orphan',NULL,46,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(69,'Orphan',NULL,47,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(70,'Widow',23,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(71,'Orphan',NULL,48,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(72,'Widow',24,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(73,'Orphan',NULL,49,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(74,'Orphan',NULL,50,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(75,'Widow',25,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(76,'Orphan',NULL,51,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(77,'Orphan',NULL,52,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(78,'Orphan',NULL,53,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(79,'Widow',26,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12');
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
(1,1,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(1,4,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(1,8,'2026-09-22 22:20:13','2026-09-22 22:20:13');
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
(1,'مجموعة حي السلام','الأسر المستفيدة في حي السلام','2026-09-22 22:20:13','2026-09-22 22:20:13');
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
(1,1,1,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(2,1,2,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(3,1,3,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(4,1,4,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(5,1,5,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(6,2,6,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(7,2,7,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(8,2,8,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(9,2,9,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(10,2,10,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(11,3,11,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(12,3,12,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(13,3,13,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(14,3,14,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(15,3,15,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(16,4,16,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(17,4,17,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(18,4,18,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(19,4,19,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(20,4,20,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(21,4,21,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(22,5,22,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(23,5,23,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(24,5,24,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(25,5,25,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(26,5,26,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(27,6,27,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(28,6,28,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(29,6,29,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(30,6,30,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(31,6,31,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(32,1,999,'2026-09-22 22:20:11','2026-09-22 22:20:11');
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
(1,1,1,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(2,1,3,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(3,2,4,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(4,2,5,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(5,2,6,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(6,3,7,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(7,3,8,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(8,4,9,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(9,4,10,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(10,5,11,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(11,5,12,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(12,5,13,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(13,6,14,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(14,6,15,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(15,1,999,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(16,8,1002,'2026-09-22 22:20:11','2026-09-22 22:20:11');
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
(1,'الرعاية الصحية','2026-09-22 22:20:11','2026-09-22 22:20:11',0,0),
(2,'التعليم والتدريب','2026-09-22 22:20:11','2026-09-22 22:20:11',0,0),
(3,'النقل والمواصلات','2026-09-22 22:20:11','2026-09-22 22:20:11',0,0),
(4,'الإدارة العامة','2026-09-22 22:20:11','2026-09-22 22:20:11',0,0),
(5,'المساعدات الاجتماعية','2026-09-22 22:20:11','2026-09-22 22:20:11',0,0),
(6,'البرامج والفعاليات','2026-09-22 22:20:11','2026-09-22 22:20:11',0,0),
(7,'الميزانية العامة','2026-09-22 22:20:11','2026-09-22 22:20:11',1,0),
(8,'كفالة شاملة','2026-09-22 22:20:11','2026-09-22 22:20:11',0,0),
(9,'عدّة','2026-09-22 22:20:11','2026-09-22 22:20:11',0,1),
(10,'كفالة شاملة - تسيير','2026-09-22 22:20:11','2026-09-22 22:20:11',0,0),
(11,'كفالة شاملة - مؤونة','2026-09-22 22:20:11','2026-09-22 22:20:11',0,0),
(12,'كفالة شاملة - تعليم','2026-09-22 22:20:11','2026-09-22 22:20:11',0,0),
(13,'كفالة شاملة - صحة','2026-09-22 22:20:11','2026-09-22 22:20:11',0,0),
(14,'كفالة شاملة - تربية وترفيه','2026-09-22 22:20:11','2026-09-22 22:20:11',0,0),
(15,'كفالة شاملة - مشاريع','2026-09-22 22:20:11','2026-09-22 22:20:11',0,0),
(16,'كفالة شاملة - تكوين','2026-09-22 22:20:11','2026-09-22 22:20:11',0,0);
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
(1,'عبد الكريم','الودغيري','D113328','0646199735','عبد الكريم.الودغيري@example.com',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:13',1,1070.00),
(2,'خالد','بنموسى','D723319','0687315265','خالد.بنموسى@example.com',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:13',1,3020.00),
(3,'ياسمين','الشرقاوي','D332187','0648445011','ياسمين.الشرقاوي@example.com',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:13',1,3040.00),
(4,'محمد','الغالي','D974230','0683158000','محمد.الغالي@example.com',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:13',1,2120.00),
(5,'سارة','أمين','D355244','0656140186','سارة.أمين@example.com',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:13',1,2300.00),
(6,'عثمان','الفيلالي','D130488','0646061137','عثمان.الفيلالي@example.com',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:13',1,700.00),
(7,'ليلى','حمداوي','D736821','0610628386','ليلى.حمداوي@example.com',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:13',1,1800.00),
(8,'طارق','بوستة','D945728','0620588965','طارق.بوستة@example.com',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:13',1,900.00),
(9,'رشيد','العلمي','D185878','0696484377','رشيد.العلمي@example.com',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:13',0,500.00),
(10,'نبيلة','بنكيران','D827539','0648116842','نبيلة.بنكيران@example.com',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:13',0,1400.00),
(11,'يوسف','الحلو','D246692','0681140440','يوسف.الحلو@example.com',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:13',0,1160.00),
(12,'سلمى','برادة','D844014','0629792540','سلمى.برادة@example.com',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:13',0,2750.00),
(13,'إدريس','المكاوي','D428967','0670980701','إدريس.المكاوي@example.com',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:13',0,1570.00),
(14,'غزلان','الطاهري','D896716','0669293636','غزلان.الطاهري@example.com',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:13',0,2120.00),
(15,'أنس','زروال','D758190','0636870924','أنس.زروال@example.com',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:13',0,940.00),
(16,'سميرة','القادري','D503131','0646197170','سميرة.القادري@example.com',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:13',0,2420.00),
(17,'مصطفى','العروسي','D619462','0630197208','مصطفى.العروسي@example.com',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:13',0,1360.00),
(18,'نزهة','بنشقرون','D958023','0669027681','نزهة.بنشقرون@example.com',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:13',0,2750.00);
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
(1,1,'الأسدس الأول',50.00,0,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(2,1,'الأسدس الثاني',50.00,1,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(3,2,'الأسدس الأول',50.00,0,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(4,2,'الأسدس الثاني',50.00,1,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(5,3,'الأسدس الأول',50.00,0,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(6,3,'الأسدس الثاني',50.00,1,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(7,4,'الأسدس الأول',50.00,0,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(8,4,'الأسدس الثاني',50.00,1,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(9,5,'الأسدس الأول',50.00,0,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(10,5,'الأسدس الثاني',50.00,1,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(11,6,'الأسدس الأول',50.00,0,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(12,6,'الأسدس الثاني',50.00,1,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(13,7,'الأسدس الأول',50.00,0,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(14,7,'الأسدس الثاني',50.00,1,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(15,8,'الأسدس الأول',50.00,0,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(16,8,'الأسدس الثاني',50.00,1,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(17,9,'الأسدس الأول',50.00,0,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(18,9,'الأسدس الثاني',50.00,1,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(19,10,'الأسدس الأول',50.00,0,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(20,10,'الأسدس الثاني',50.00,1,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(21,11,'الأسدس الأول',50.00,0,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(22,11,'الأسدس الثاني',50.00,1,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(23,12,'الأسدس الأول',50.00,0,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(24,12,'الأسدس الثاني',50.00,1,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(25,13,'الأسدس الأول',50.00,0,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(26,13,'الأسدس الثاني',50.00,1,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(27,14,'الأسدس الأول',50.00,0,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(28,14,'الأسدس الثاني',50.00,1,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(29,15,'الأسدس الأول',50.00,0,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(30,15,'الأسدس الثاني',50.00,1,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(31,16,'الأسدس الأول',50.00,0,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(32,16,'الأسدس الثاني',50.00,1,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(33,17,'الأسدس الأول',50.00,0,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(34,17,'الأسدس الثاني',50.00,1,'2026-09-22 22:20:11','2026-09-22 22:20:11');
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
(1,51,'الأسدس الأول',7.69,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(2,52,'الأسدس الأول',10.31,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(3,52,'الأسدس الثاني',16.39,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(4,53,'الأسدس الأول',14.32,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(5,53,'الأسدس الثاني',14.62,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(6,54,'الأسدس الأول',7.60,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(7,54,'الأسدس الثاني',17.40,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(8,2,'الأسدس الأول',11.98,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(9,2,'الأسدس الثاني',8.64,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(10,55,'الأسدس الأول',9.81,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(11,55,'الأسدس الثاني',14.95,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(12,56,'الأسدس الأول',17.94,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(13,56,'الأسدس الثاني',15.57,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(14,3,'الأسدس الأول',12.63,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(15,3,'الأسدس الثاني',8.43,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(16,57,'الأسدس الأول',11.91,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(17,57,'الأسدس الثاني',7.59,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(18,58,'الأسدس الأول',18.09,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(19,58,'الأسدس الثاني',12.16,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(20,4,'الأسدس الأول',17.58,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(21,59,'الأسدس الأول',18.99,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(22,59,'الأسدس الثاني',17.67,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(23,60,'الأسدس الأول',8.95,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(24,5,'الأسدس الأول',13.00,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(25,5,'الأسدس الثاني',14.57,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(26,61,'الأسدس الأول',9.13,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(27,62,'الأسدس الأول',18.76,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(28,62,'الأسدس الثاني',7.77,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(29,6,'الأسدس الأول',18.85,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(30,6,'الأسدس الثاني',8.93,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(31,63,'الأسدس الأول',12.99,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(32,63,'الأسدس الثاني',18.46,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(33,64,'الأسدس الأول',9.12,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(34,64,'الأسدس الثاني',10.84,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(35,7,'الأسدس الأول',10.93,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(36,7,'الأسدس الثاني',8.97,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(37,65,'الأسدس الأول',9.21,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(38,65,'الأسدس الثاني',16.84,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(39,66,'الأسدس الأول',8.53,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(40,66,'الأسدس الثاني',14.48,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(41,67,'الأسدس الأول',18.06,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(42,67,'الأسدس الثاني',14.35,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(43,68,'الأسدس الأول',13.07,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(44,68,'الأسدس الثاني',7.29,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(45,9,'الأسدس الأول',7.96,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(46,69,'الأسدس الأول',8.69,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(47,69,'الأسدس الثاني',18.82,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(48,70,'الأسدس الأول',18.56,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(49,10,'الأسدس الأول',17.17,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(50,10,'الأسدس الثاني',18.75,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(51,71,'الأسدس الأول',10.43,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(52,72,'الأسدس الأول',10.22,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(53,72,'الأسدس الثاني',16.45,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(54,11,'الأسدس الأول',15.07,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(55,11,'الأسدس الثاني',14.26,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(56,73,'الأسدس الأول',10.32,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(57,73,'الأسدس الثاني',7.75,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(58,74,'الأسدس الأول',14.19,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(59,74,'الأسدس الثاني',18.74,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(60,12,'الأسدس الأول',9.34,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(61,12,'الأسدس الثاني',17.23,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(62,75,'الأسدس الأول',15.29,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(63,75,'الأسدس الثاني',9.37,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(64,76,'الأسدس الأول',9.01,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(65,76,'الأسدس الثاني',17.52,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(66,13,'الأسدس الأول',13.99,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(67,13,'الأسدس الثاني',16.21,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(68,77,'الأسدس الأول',15.74,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(69,77,'الأسدس الثاني',14.73,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(70,78,'الأسدس الأول',16.17,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(71,78,'الأسدس الثاني',17.11,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(72,14,'الأسدس الأول',14.28,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(73,79,'الأسدس الأول',13.63,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(74,79,'الأسدس الثاني',12.02,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(75,80,'الأسدس الأول',15.89,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(76,81,'الأسدس الأول',13.62,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(77,82,'الأسدس الأول',8.75,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(78,82,'الأسدس الثاني',7.10,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(79,16,'الأسدس الأول',8.01,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(80,16,'الأسدس الثاني',17.01,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(81,83,'الأسدس الأول',13.55,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(82,83,'الأسدس الثاني',16.83,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(83,84,'الأسدس الأول',10.65,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(84,84,'الأسدس الثاني',17.88,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(85,17,'الأسدس الأول',18.75,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(86,17,'الأسدس الثاني',13.52,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(87,85,'الأسدس الأول',17.44,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(88,85,'الأسدس الثاني',15.28,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(89,86,'الأسدس الأول',9.70,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(90,86,'الأسدس الثاني',18.20,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(91,18,'الأسدس الأول',13.72,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(92,18,'الأسدس الثاني',14.33,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(93,87,'الأسدس الأول',16.73,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(94,87,'الأسدس الثاني',16.91,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(95,88,'الأسدس الأول',18.36,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(96,88,'الأسدس الثاني',14.44,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(97,19,'الأسدس الأول',8.21,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(98,89,'الأسدس الأول',8.33,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(99,89,'الأسدس الثاني',11.22,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(100,90,'الأسدس الأول',7.49,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(101,20,'الأسدس الأول',14.83,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(102,20,'الأسدس الثاني',12.60,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(103,91,'الأسدس الأول',9.10,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(104,92,'الأسدس الأول',17.75,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(105,92,'الأسدس الثاني',16.24,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(106,21,'الأسدس الأول',18.88,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(107,21,'الأسدس الثاني',14.13,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(108,93,'الأسدس الأول',7.10,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(109,93,'الأسدس الثاني',18.20,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(110,94,'الأسدس الأول',7.61,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(111,94,'الأسدس الثاني',8.67,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(112,95,'الأسدس الأول',10.82,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(113,95,'الأسدس الثاني',9.26,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(114,96,'الأسدس الأول',11.47,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(115,96,'الأسدس الثاني',9.62,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(116,23,'الأسدس الأول',8.10,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(117,23,'الأسدس الثاني',13.60,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(118,97,'الأسدس الأول',12.47,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(119,97,'الأسدس الثاني',17.32,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(120,98,'الأسدس الأول',18.29,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(121,98,'الأسدس الثاني',14.79,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(122,24,'الأسدس الأول',9.27,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(123,99,'الأسدس الأول',16.86,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(124,99,'الأسدس الثاني',12.83,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(125,100,'الأسدس الأول',12.28,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(126,25,'الأسدس الأول',7.64,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(127,25,'الأسدس الثاني',9.74,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(128,101,'الأسدس الأول',17.10,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(129,102,'الأسدس الأول',16.50,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(130,102,'الأسدس الثاني',15.61,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(131,26,'الأسدس الأول',15.80,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(132,26,'الأسدس الثاني',18.07,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(133,103,'الأسدس الأول',15.06,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(134,103,'الأسدس الثاني',14.23,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(135,104,'الأسدس الأول',8.89,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(136,104,'الأسدس الثاني',8.46,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(137,27,'الأسدس الأول',11.98,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(138,27,'الأسدس الثاني',8.93,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(139,105,'الأسدس الأول',7.01,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(140,105,'الأسدس الثاني',16.40,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(141,106,'الأسدس الأول',18.06,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(142,106,'الأسدس الثاني',7.06,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(143,28,'الأسدس الأول',7.11,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(144,28,'الأسدس الثاني',14.23,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(145,107,'الأسدس الأول',13.41,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(146,107,'الأسدس الثاني',11.56,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(147,108,'الأسدس الأول',10.46,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(148,108,'الأسدس الثاني',12.23,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(149,109,'الأسدس الأول',12.65,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(150,109,'الأسدس الثاني',7.03,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(151,110,'الأسدس الأول',11.26,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(152,30,'الأسدس الأول',17.14,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(153,30,'الأسدس الثاني',18.13,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(154,111,'الأسدس الأول',12.42,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(155,112,'الأسدس الأول',18.53,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(156,112,'الأسدس الثاني',8.00,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(157,31,'الأسدس الأول',18.21,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(158,31,'الأسدس الثاني',7.70,20.00,50.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(159,113,'الأسدس الأول',10.54,20.00,50.00,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(160,113,'الأسدس الثاني',18.09,20.00,50.00,1,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(161,114,'الأسدس الأول',8.25,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(162,114,'الأسدس الثاني',10.18,20.00,50.00,1,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(163,32,'الأسدس الأول',15.13,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(164,32,'الأسدس الثاني',12.51,20.00,50.00,1,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(165,115,'الأسدس الأول',14.82,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(166,115,'الأسدس الثاني',8.41,20.00,50.00,1,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(167,116,'الأسدس الأول',11.69,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(168,116,'الأسدس الثاني',13.11,20.00,50.00,1,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(169,33,'الأسدس الأول',14.16,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(170,33,'الأسدس الثاني',9.20,20.00,50.00,1,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(171,117,'الأسدس الأول',8.59,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(172,117,'الأسدس الثاني',17.26,20.00,50.00,1,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(173,118,'الأسدس الأول',16.38,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(174,118,'الأسدس الثاني',8.03,20.00,50.00,1,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(175,34,'الأسدس الأول',7.17,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(176,119,'الأسدس الأول',11.23,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(177,119,'الأسدس الثاني',10.61,20.00,50.00,1,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(178,120,'الأسدس الأول',8.30,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(179,35,'الأسدس الأول',8.67,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(180,35,'الأسدس الثاني',18.12,20.00,50.00,1,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(181,121,'الأسدس الأول',10.44,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(182,122,'الأسدس الأول',18.15,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(183,122,'الأسدس الثاني',18.78,20.00,50.00,1,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(184,123,'الأسدس الأول',15.53,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(185,123,'الأسدس الثاني',15.70,20.00,50.00,1,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(186,124,'الأسدس الأول',12.81,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(187,124,'الأسدس الثاني',14.50,20.00,50.00,1,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(188,37,'الأسدس الأول',16.46,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(189,37,'الأسدس الثاني',12.46,20.00,50.00,1,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(190,125,'الأسدس الأول',7.30,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(191,125,'الأسدس الثاني',11.49,20.00,50.00,1,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(192,126,'الأسدس الأول',18.24,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(193,126,'الأسدس الثاني',18.09,20.00,50.00,1,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(194,38,'الأسدس الأول',16.53,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(195,38,'الأسدس الثاني',9.30,20.00,50.00,1,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(196,127,'الأسدس الأول',16.27,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(197,127,'الأسدس الثاني',12.49,20.00,50.00,1,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(198,128,'الأسدس الأول',15.08,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(199,128,'الأسدس الثاني',8.08,20.00,50.00,1,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(200,39,'الأسدس الأول',8.51,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(201,129,'الأسدس الأول',14.86,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(202,129,'الأسدس الثاني',16.47,20.00,50.00,1,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(203,130,'الأسدس الأول',16.86,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(204,40,'الأسدس الأول',14.02,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(205,40,'الأسدس الثاني',8.51,20.00,50.00,1,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(206,131,'الأسدس الأول',13.41,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(207,132,'الأسدس الأول',13.31,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(208,132,'الأسدس الثاني',14.51,20.00,50.00,1,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(209,41,'الأسدس الأول',13.42,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(210,41,'الأسدس الثاني',10.99,20.00,50.00,1,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(211,133,'الأسدس الأول',18.76,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(212,133,'الأسدس الثاني',13.43,20.00,50.00,1,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(213,134,'الأسدس الأول',18.17,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(214,134,'الأسدس الثاني',10.56,20.00,50.00,1,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(215,42,'الأسدس الأول',7.50,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(216,42,'الأسدس الثاني',14.27,20.00,50.00,1,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(217,135,'الأسدس الأول',11.54,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(218,135,'الأسدس الثاني',9.57,20.00,50.00,1,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(219,136,'الأسدس الأول',17.85,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(220,136,'الأسدس الثاني',8.20,20.00,50.00,1,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(221,137,'الأسدس الأول',11.07,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(222,137,'الأسدس الثاني',12.18,20.00,50.00,1,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(223,138,'الأسدس الأول',14.86,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(224,138,'الأسدس الثاني',17.80,20.00,50.00,1,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(225,44,'الأسدس الأول',7.87,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(226,139,'الأسدس الأول',9.89,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(227,139,'الأسدس الثاني',12.76,20.00,50.00,1,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(228,140,'الأسدس الأول',8.41,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(229,45,'الأسدس الأول',17.73,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(230,45,'الأسدس الثاني',17.55,20.00,50.00,1,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(231,141,'الأسدس الأول',11.01,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(232,142,'الأسدس الأول',8.70,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(233,142,'الأسدس الثاني',12.18,20.00,50.00,1,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(234,46,'الأسدس الأول',17.03,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(235,46,'الأسدس الثاني',16.68,20.00,50.00,1,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(236,143,'الأسدس الأول',11.55,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(237,143,'الأسدس الثاني',17.41,20.00,50.00,1,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(238,144,'الأسدس الأول',9.30,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(239,144,'الأسدس الثاني',18.17,20.00,50.00,1,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(240,47,'الأسدس الأول',13.18,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(241,47,'الأسدس الثاني',18.28,20.00,50.00,1,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(242,145,'الأسدس الأول',14.58,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(243,145,'الأسدس الثاني',16.93,20.00,50.00,1,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(244,146,'الأسدس الأول',13.36,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(245,146,'الأسدس الثاني',10.37,20.00,50.00,1,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(246,48,'الأسدس الأول',14.00,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(247,48,'الأسدس الثاني',7.73,20.00,50.00,1,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(248,147,'الأسدس الأول',7.32,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(249,147,'الأسدس الثاني',11.47,20.00,50.00,1,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(250,148,'الأسدس الأول',18.75,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(251,148,'الأسدس الثاني',13.59,20.00,50.00,1,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(252,49,'الأسدس الأول',13.88,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(253,149,'الأسدس الأول',14.53,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(254,149,'الأسدس الثاني',16.66,20.00,50.00,1,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(255,150,'الأسدس الأول',8.70,20.00,50.00,0,'2026-09-22 22:20:13','2026-09-22 22:20:13');
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
(1,1,13,NULL,750.00,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(2,2,24,NULL,1200.00,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(3,3,37,NULL,450.00,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(4,4,49,NULL,600.00,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(5,5,62,NULL,900.00,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(6,6,75,NULL,1350.00,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(7,7,8,NULL,520.00,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(8,8,19,NULL,680.00,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(9,9,29,NULL,1050.00,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(10,11,15,NULL,770.00,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(11,12,24,NULL,280.00,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(12,13,32,NULL,630.00,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(13,14,44,NULL,450.00,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(14,15,53,NULL,770.00,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(15,16,62,NULL,280.00,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(16,17,72,NULL,630.00,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(17,18,1,NULL,450.00,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(18,19,13,NULL,550.00,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(19,20,22,NULL,940.00,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(20,21,29,NULL,340.00,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(21,22,40,NULL,770.00,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(22,23,49,NULL,550.00,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(23,24,58,NULL,940.00,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(24,25,70,NULL,340.00,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(25,26,79,NULL,770.00,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(26,27,8,NULL,550.00,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13');
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
(1,NULL,'أدوية ومستلزمات طبية','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(2,NULL,'فحوصات طبية','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(3,NULL,'عمليات جراحية','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(4,NULL,'علاج طبيعي','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(5,NULL,'مساعدات طبية طارئة','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(6,NULL,'رسوم مدرسية','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(7,NULL,'مواد تعليمية','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(8,NULL,'دورات تدريبية','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(9,NULL,'منح الطلاب','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(10,NULL,'مصاريف النقل للطلاب','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(11,NULL,'وقود','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(12,NULL,'صيانة المركبات','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(13,NULL,'تأمين المركبات','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(14,NULL,'أجرة سائقين','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(15,NULL,'تذاكر النقل العام','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(16,NULL,'رواتب الموظفين','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(17,NULL,'مصاريف المكتب','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(18,NULL,'إيجار','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(19,NULL,'كهرباء وماء','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(20,NULL,'مصاريف الاتصالات','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(21,NULL,'مصاريف قانونية ومحاسبية','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(22,NULL,'مساعدات نقدية للأرامل','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(23,NULL,'مساعدات نقدية للأيتام','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(24,NULL,'مساعدات غذائية','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(25,NULL,'مساعدات سكن','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(26,NULL,'مساعدات كسوة','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(27,NULL,'تنظيم الفعاليات','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(28,NULL,'برامج ترفيهية للأطفال','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(29,NULL,'ورش تدريبية','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(30,NULL,'مؤتمرات ولقاءات','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(31,NULL,'مواد دعائية وإعلانية','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(999,NULL,'Deleted Category (Default)','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(1000,NULL,'مصاريف إدارية','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(1001,NULL,'أدوات ومستلزمات مكتبية','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(1002,NULL,'اتصالات وإنترنت','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(1003,NULL,'سلة غذائية','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(1004,NULL,'مساعدة نقدية شهرية','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(1005,NULL,'كسوة وملابس','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(1006,NULL,'مساعدة في الإيجار','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(1007,NULL,'فواتير الماء والكهرباء','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(1008,NULL,'رسوم التمدرس','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(1009,NULL,'أدوات ولوازم مدرسية','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(1010,NULL,'دعم ومساندة دراسية','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(1011,NULL,'نقل مدرسي','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(1012,NULL,'أدوية','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(1013,NULL,'فحوصات وتحاليل','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(1014,NULL,'استشارات طبية','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(1015,NULL,'نظارات وأجهزة طبية','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(1016,NULL,'رحلات وخرجات','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(1017,NULL,'مخيمات صيفية','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(1018,NULL,'أنشطة ثقافية ورياضية','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(1019,NULL,'هدايا المناسبات','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(1020,NULL,'مشاريع مدرة للدخل','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(1021,NULL,'تجهيز مشروع أسرة','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(1022,NULL,'دعم نشاط حر','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(1023,NULL,'دورات تكوينية','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(1024,NULL,'تكوين مهني','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(1025,NULL,'ورشات تأهيلية','2026-09-22 22:20:11','2026-09-22 22:20:11');
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
(1,1,7,2,NULL,NULL,'2026-01-13',750.00,'Cash',NULL,'EX-2026-01',2,NULL,0,'Approved',1,1,'2026-09-22 22:20:13','2026-09-22 22:20:13','2026-09-22 22:20:13'),
(2,1,7,3,NULL,NULL,'2026-02-18',1200.00,'Cash',NULL,'EX-2026-02',1,NULL,0,'Approved',1,1,'2026-09-22 22:20:13','2026-09-22 22:20:13','2026-09-22 22:20:13'),
(3,1,7,4,NULL,NULL,'2026-03-23',450.00,'Cash',NULL,'EX-2026-03',2,NULL,0,'Approved',1,1,'2026-09-22 22:20:13','2026-09-22 22:20:13','2026-09-22 22:20:13'),
(4,1,7,5,NULL,NULL,'2026-04-10',600.00,'Cheque',NULL,'EX-2026-04',1,NULL,0,'Approved',1,1,'2026-09-22 22:20:13','2026-09-22 22:20:13','2026-09-22 22:20:13'),
(5,1,7,6,NULL,NULL,'2026-05-15',900.00,'Cash',NULL,'EX-2026-05',2,NULL,0,'Approved',1,1,'2026-09-22 22:20:13','2026-09-22 22:20:13','2026-09-22 22:20:13'),
(6,1,7,7,NULL,NULL,'2026-06-20',1350.00,'Cash',NULL,'EX-2026-06',1,NULL,0,'Approved',1,1,'2026-09-22 22:20:13','2026-09-22 22:20:13','2026-09-22 22:20:13'),
(7,1,7,8,NULL,NULL,'2026-07-25',520.00,'Cash',NULL,'EX-2026-07',2,NULL,0,'Approved',1,1,'2026-09-22 22:20:13','2026-09-22 22:20:13','2026-09-22 22:20:13'),
(8,1,7,9,NULL,NULL,'2026-08-12',680.00,'Cheque',NULL,'EX-2026-08',NULL,NULL,0,'Draft',1,NULL,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(9,1,7,10,NULL,NULL,'2026-09-17',1050.00,'Cash',NULL,'EX-2026-09',NULL,NULL,0,'Draft',1,NULL,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(10,1,7,1,NULL,NULL,'2026-09-12',1500.00,'BankWire',NULL,NULL,1,NULL,1,'Approved',1,1,'2026-09-22 22:20:13','2026-09-22 22:20:13','2026-09-22 22:20:13'),
(11,2,7,4,NULL,NULL,'2024-08-26',770.00,'Cash',NULL,'EX-2024-01',NULL,NULL,0,'Approved',1,1,'2024-08-26 00:00:00','2026-09-22 22:20:13','2026-09-22 22:20:13'),
(12,2,7,5,NULL,NULL,'2024-01-24',280.00,'Cash',NULL,'EX-2024-02',NULL,NULL,0,'Approved',1,1,'2024-01-24 00:00:00','2026-09-22 22:20:13','2026-09-22 22:20:13'),
(13,2,7,6,NULL,NULL,'2024-06-17',630.00,'Cheque',NULL,'EX-2024-03',NULL,NULL,0,'Approved',1,1,'2024-06-17 00:00:00','2026-09-22 22:20:13','2026-09-22 22:20:13'),
(14,2,7,7,NULL,NULL,'2024-11-18',450.00,'Cash',NULL,'EX-2024-04',NULL,NULL,0,'Approved',1,1,'2024-11-18 00:00:00','2026-09-22 22:20:13','2026-09-22 22:20:13'),
(15,2,7,8,NULL,NULL,'2024-04-19',770.00,'Cash',NULL,'EX-2024-05',NULL,NULL,0,'Approved',1,1,'2024-04-19 00:00:00','2026-09-22 22:20:13','2026-09-22 22:20:13'),
(16,2,7,9,NULL,NULL,'2024-09-27',280.00,'Cheque',NULL,'EX-2024-06',NULL,NULL,0,'Approved',1,1,'2024-09-27 00:00:00','2026-09-22 22:20:13','2026-09-22 22:20:13'),
(17,2,7,10,NULL,NULL,'2024-02-16',630.00,'Cash',NULL,'EX-2024-07',NULL,NULL,0,'Approved',1,1,'2024-02-16 00:00:00','2026-09-22 22:20:13','2026-09-22 22:20:13'),
(18,2,7,11,NULL,NULL,'2024-07-05',450.00,'Cash',NULL,'EX-2024-08',NULL,NULL,0,'Approved',1,1,'2024-07-05 00:00:00','2026-09-22 22:20:13','2026-09-22 22:20:13'),
(19,3,7,3,NULL,NULL,'2025-07-06',550.00,'Cash',NULL,'EX-2025-01',NULL,NULL,0,'Approved',1,1,'2025-07-06 00:00:00','2026-09-22 22:20:13','2026-09-22 22:20:13'),
(20,3,7,4,NULL,NULL,'2025-12-17',940.00,'Cash',NULL,'EX-2025-02',NULL,NULL,0,'Approved',1,1,'2025-12-17 00:00:00','2026-09-22 22:20:13','2026-09-22 22:20:13'),
(21,3,7,5,NULL,NULL,'2025-05-22',340.00,'Cheque',NULL,'EX-2025-03',NULL,NULL,0,'Approved',1,1,'2025-05-22 00:00:00','2026-09-22 22:20:13','2026-09-22 22:20:13'),
(22,3,7,6,NULL,NULL,'2025-10-14',770.00,'Cash',NULL,'EX-2025-04',NULL,NULL,0,'Approved',1,1,'2025-10-14 00:00:00','2026-09-22 22:20:13','2026-09-22 22:20:13'),
(23,3,7,7,NULL,NULL,'2025-03-12',550.00,'Cash',NULL,'EX-2025-05',NULL,NULL,0,'Approved',1,1,'2025-03-12 00:00:00','2026-09-22 22:20:13','2026-09-22 22:20:13'),
(24,3,7,8,NULL,NULL,'2025-08-27',940.00,'Cheque',NULL,'EX-2025-06',NULL,NULL,0,'Approved',1,1,'2025-08-27 00:00:00','2026-09-22 22:20:13','2026-09-22 22:20:13'),
(25,3,7,9,NULL,NULL,'2025-01-21',340.00,'Cash',NULL,'EX-2025-07',NULL,NULL,0,'Approved',1,1,'2025-01-21 00:00:00','2026-09-22 22:20:13','2026-09-22 22:20:13'),
(26,3,7,10,NULL,NULL,'2025-06-10',770.00,'Cash',NULL,'EX-2025-08',NULL,NULL,0,'Approved',1,1,'2025-06-10 00:00:00','2026-09-22 22:20:13','2026-09-22 22:20:13'),
(27,3,7,11,NULL,NULL,'2025-11-06',550.00,'Cheque',NULL,'EX-2025-09',NULL,NULL,0,'Approved',1,1,'2025-11-06 00:00:00','2026-09-22 22:20:13','2026-09-22 22:20:13');
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
(1,2026,1,0.00,0.00,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(2,2024,0,0.00,0.00,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(3,2025,0,0.00,0.00,'2026-09-22 22:20:12','2026-09-22 22:20:12');
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
(1,'شقة','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(2,'منزل','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(3,'غرفة','2026-09-22 22:20:11','2026-09-22 22:20:11');
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
(1,'سكري',0,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(2,'ضغط دم',0,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(3,'قلب',0,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(4,'كلى',0,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(5,'ربو',0,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(6,'التهاب مفاصل',0,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(7,'صداع نصفي',0,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(8,'فقر دم',0,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(9,'غدة درقية',0,'2026-09-22 22:20:11','2026-09-22 22:20:11');
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
(1,NULL,'تبرعات للرعاية الصحية','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(3,NULL,'دعم العلاجات','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(4,NULL,'رسوم التدريب','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(5,NULL,'تبرعات تعليمية','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(6,NULL,'منح دراسية','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(7,NULL,'تبرعات للمواصلات','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(8,NULL,'دعم النقل','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(9,NULL,'رسوم إدارية','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(10,NULL,'تبرعات عامة','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(11,NULL,'تبرعات للمساعدات الاجتماعية','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(12,NULL,'زكاة','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(13,NULL,'صدقات','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(14,NULL,'رعاية الفعاليات','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(15,NULL,'تبرعات للبرامج','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(999,NULL,'Deleted Category (Default)','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(1002,NULL,'كفالة شاملة','2026-09-22 22:20:11','2026-09-22 22:20:11');
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
(1,1,7,10,2,NULL,NULL,NULL,'2026-01-08',900.00,'Cash',NULL,'RC-2026-01',NULL,NULL,'Approved',1,1,'2026-09-22 22:20:13',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(2,1,7,10,3,NULL,NULL,NULL,'2026-02-11',2400.00,'Cash',NULL,'RC-2026-02',NULL,NULL,'Approved',1,1,'2026-09-22 22:20:13',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(3,1,7,10,4,NULL,NULL,NULL,'2026-03-14',1100.00,'Cheque',NULL,'RC-2026-03',NULL,NULL,'Approved',1,1,'2026-09-22 22:20:13',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(4,1,7,10,5,NULL,NULL,NULL,'2026-04-17',1800.00,'Cash',NULL,'RC-2026-04',NULL,NULL,'Approved',1,1,'2026-09-22 22:20:13',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(5,1,7,10,6,NULL,NULL,NULL,'2026-05-20',700.00,'Cash',NULL,'RC-2026-05',NULL,NULL,'Approved',1,1,'2026-09-22 22:20:13',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(6,1,7,10,7,NULL,NULL,NULL,'2026-06-23',1500.00,'Cheque',NULL,'RC-2026-06',NULL,NULL,'Approved',1,1,'2026-09-22 22:20:13',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(7,1,7,10,8,NULL,NULL,NULL,'2026-07-06',900.00,'Cash',NULL,'RC-2026-07',NULL,NULL,'Approved',1,1,'2026-09-22 22:20:13',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(8,1,7,10,9,NULL,NULL,NULL,'2026-08-09',2400.00,'Cash',NULL,'RC-2026-08',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(9,1,7,10,10,NULL,NULL,NULL,'2026-09-12',1100.00,'Cheque',NULL,'RC-2026-09',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(10,1,7,10,5,NULL,NULL,NULL,'2026-01-11',500.00,'Cash',NULL,'RC-1000',NULL,NULL,'Approved',1,1,'2026-09-22 22:20:13',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(11,1,7,10,6,NULL,NULL,NULL,'2026-02-12',1200.00,'Cash',NULL,'RC-1001',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(12,1,7,10,7,NULL,NULL,NULL,'2026-03-13',300.00,'Cash',NULL,'RC-1002',NULL,NULL,'Approved',1,1,'2026-09-22 22:20:13',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(13,1,7,10,8,NULL,NULL,NULL,'2026-04-14',2000.00,'Cash',NULL,'RC-1003',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(14,1,7,10,9,NULL,NULL,NULL,'2026-05-15',500.00,'Cash',NULL,'RC-1004',NULL,NULL,'Approved',1,1,'2026-09-22 22:20:13',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(15,1,7,10,10,NULL,NULL,NULL,'2026-06-16',1200.00,'Cash',NULL,'RC-1005',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(16,1,7,10,11,NULL,NULL,NULL,'2026-07-17',300.00,'Cash',NULL,'RC-1006',NULL,NULL,'Approved',1,1,'2026-09-22 22:20:13',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(17,1,7,10,12,NULL,NULL,NULL,'2026-08-18',2000.00,'Cash',NULL,'RC-1007',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(18,1,7,10,13,NULL,NULL,NULL,'2026-09-19',500.00,'Cash',NULL,'RC-1008',NULL,NULL,'Approved',1,1,'2026-09-22 22:20:13',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(19,1,7,10,14,NULL,NULL,NULL,'2026-01-20',1200.00,'Cash',NULL,'RC-1009',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(20,1,7,10,15,NULL,NULL,NULL,'2026-02-21',300.00,'Cash',NULL,'RC-1010',NULL,NULL,'Approved',1,1,'2026-09-22 22:20:13',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(21,1,7,10,16,NULL,NULL,NULL,'2026-03-22',2000.00,'Cash',NULL,'RC-1011',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(22,1,7,10,17,NULL,NULL,NULL,'2026-04-23',500.00,'Cash',NULL,'RC-1012',NULL,NULL,'Approved',1,1,'2026-09-22 22:20:13',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(23,1,7,10,18,NULL,NULL,NULL,'2026-05-24',1200.00,'Cash',NULL,'RC-1013',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(24,1,8,1002,NULL,3,3,NULL,'2026-09-03',400.00,'BankWire',NULL,NULL,2,NULL,'Approved',1,1,'2026-09-22 22:20:13',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(25,1,8,1002,NULL,3,4,NULL,'2026-09-03',400.00,'BankWire',NULL,NULL,2,NULL,'Approved',1,1,'2026-09-22 22:20:13',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(26,1,10,1002,NULL,1,1,'01M35K92WMSZAYE1R9SX6S660V','2026-08-14',80.00,'Cash',NULL,'RC-KC-1',NULL,NULL,'Approved',1,1,'2026-09-22 22:20:13',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(27,1,11,1002,NULL,1,1,'01M35K92WMSZAYE1R9SX6S660V','2026-08-14',400.00,'Cash',NULL,'RC-KC-1',NULL,NULL,'Approved',1,1,'2026-09-22 22:20:13',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(28,1,12,1002,NULL,1,1,'01M35K92WMSZAYE1R9SX6S660V','2026-08-14',160.00,'Cash',NULL,'RC-KC-1',NULL,NULL,'Approved',1,1,'2026-09-22 22:20:13',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(29,1,13,1002,NULL,1,1,'01M35K92WMSZAYE1R9SX6S660V','2026-08-14',32.00,'Cash',NULL,'RC-KC-1',NULL,NULL,'Approved',1,1,'2026-09-22 22:20:13',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(30,1,14,1002,NULL,1,1,'01M35K92WMSZAYE1R9SX6S660V','2026-08-14',40.00,'Cash',NULL,'RC-KC-1',NULL,NULL,'Approved',1,1,'2026-09-22 22:20:13',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(31,1,15,1002,NULL,1,1,'01M35K92WMSZAYE1R9SX6S660V','2026-08-14',48.00,'Cash',NULL,'RC-KC-1',NULL,NULL,'Approved',1,1,'2026-09-22 22:20:13',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(32,1,16,1002,NULL,1,1,'01M35K92WMSZAYE1R9SX6S660V','2026-08-14',40.00,'Cash',NULL,'RC-KC-1',NULL,NULL,'Approved',1,1,'2026-09-22 22:20:13',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(33,1,10,1002,NULL,2,NULL,'01M35K92X95CMPGAFZ9Z2WW06B','2026-09-22',80.00,'Cash',NULL,'RC-KC-2',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(34,1,11,1002,NULL,2,NULL,'01M35K92X95CMPGAFZ9Z2WW06B','2026-09-22',400.00,'Cash',NULL,'RC-KC-2',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(35,1,12,1002,NULL,2,NULL,'01M35K92X95CMPGAFZ9Z2WW06B','2026-09-22',160.00,'Cash',NULL,'RC-KC-2',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(36,1,13,1002,NULL,2,NULL,'01M35K92X95CMPGAFZ9Z2WW06B','2026-09-22',32.00,'Cash',NULL,'RC-KC-2',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(37,1,14,1002,NULL,2,NULL,'01M35K92X95CMPGAFZ9Z2WW06B','2026-09-22',40.00,'Cash',NULL,'RC-KC-2',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(38,1,15,1002,NULL,2,NULL,'01M35K92X95CMPGAFZ9Z2WW06B','2026-09-22',48.00,'Cash',NULL,'RC-KC-2',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(39,1,16,1002,NULL,2,NULL,'01M35K92X95CMPGAFZ9Z2WW06B','2026-09-22',40.00,'Cash',NULL,'RC-KC-2',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(40,2,7,10,10,NULL,NULL,NULL,'2024-01-22',1400.00,'Cash',NULL,'RC-2024-01',NULL,NULL,'Approved',1,1,'2024-01-22 00:00:00','2024-01-22 00:00:00','2026-09-22 22:20:13','2026-09-22 22:20:13'),
(41,2,7,10,11,NULL,NULL,NULL,'2024-02-18',600.00,'Cash',NULL,'RC-2024-02',NULL,NULL,'Approved',1,1,'2024-02-18 00:00:00','2024-02-18 00:00:00','2026-09-22 22:20:13','2026-09-22 22:20:13'),
(42,2,7,10,12,NULL,NULL,NULL,'2024-03-05',1050.00,'Cash',NULL,'RC-2024-03',NULL,NULL,'Approved',1,1,'2024-03-05 00:00:00','2024-03-05 00:00:00','2026-09-22 22:20:13','2026-09-22 22:20:13'),
(43,2,7,10,13,NULL,NULL,NULL,'2024-04-05',350.00,'Cheque',NULL,'RC-2024-04',NULL,NULL,'Approved',1,1,'2024-04-05 00:00:00','2024-04-05 00:00:00','2026-09-22 22:20:13','2026-09-22 22:20:13'),
(44,2,7,10,14,NULL,NULL,NULL,'2024-05-12',840.00,'Cash',NULL,'RC-2024-05',NULL,NULL,'Approved',1,1,'2024-05-12 00:00:00','2024-05-12 00:00:00','2026-09-22 22:20:13','2026-09-22 22:20:13'),
(45,2,7,10,15,NULL,NULL,NULL,'2024-06-03',210.00,'Cash',NULL,'RC-2024-06',NULL,NULL,'Approved',1,1,'2024-06-03 00:00:00','2024-06-03 00:00:00','2026-09-22 22:20:13','2026-09-22 22:20:13'),
(46,2,7,10,16,NULL,NULL,NULL,'2024-07-15',1400.00,'Cash',NULL,'RC-2024-07',NULL,NULL,'Approved',1,1,'2024-07-15 00:00:00','2024-07-15 00:00:00','2026-09-22 22:20:13','2026-09-22 22:20:13'),
(47,2,7,10,17,NULL,NULL,NULL,'2024-08-10',600.00,'Cheque',NULL,'RC-2024-08',NULL,NULL,'Approved',1,1,'2024-08-10 00:00:00','2024-08-10 00:00:00','2026-09-22 22:20:13','2026-09-22 22:20:13'),
(48,2,7,10,18,NULL,NULL,NULL,'2024-09-16',1050.00,'Cash',NULL,'RC-2024-09',NULL,NULL,'Approved',1,1,'2024-09-16 00:00:00','2024-09-16 00:00:00','2026-09-22 22:20:13','2026-09-22 22:20:13'),
(49,2,7,10,1,NULL,NULL,NULL,'2024-10-12',350.00,'Cash',NULL,'RC-2024-10',NULL,NULL,'Approved',1,1,'2024-10-12 00:00:00','2024-10-12 00:00:00','2026-09-22 22:20:13','2026-09-22 22:20:13'),
(50,2,7,10,2,NULL,NULL,NULL,'2024-11-25',840.00,'Cash',NULL,'RC-2024-11',NULL,NULL,'Approved',1,1,'2024-11-25 00:00:00','2024-11-25 00:00:00','2026-09-22 22:20:13','2026-09-22 22:20:13'),
(51,2,7,10,3,NULL,NULL,NULL,'2024-12-18',210.00,'Cheque',NULL,'RC-2024-12',NULL,NULL,'Approved',1,1,'2024-12-18 00:00:00','2024-12-18 00:00:00','2026-09-22 22:20:13','2026-09-22 22:20:13'),
(52,3,7,10,11,NULL,NULL,NULL,'2025-01-27',260.00,'Cash',NULL,'RC-2025-01',NULL,NULL,'Approved',1,1,'2025-01-27 00:00:00','2025-01-27 00:00:00','2026-09-22 22:20:13','2026-09-22 22:20:13'),
(53,3,7,10,12,NULL,NULL,NULL,'2025-02-05',1700.00,'Cash',NULL,'RC-2025-02',NULL,NULL,'Approved',1,1,'2025-02-05 00:00:00','2025-02-05 00:00:00','2026-09-22 22:20:13','2026-09-22 22:20:13'),
(54,3,7,10,13,NULL,NULL,NULL,'2025-03-26',720.00,'Cash',NULL,'RC-2025-03',NULL,NULL,'Approved',1,1,'2025-03-26 00:00:00','2025-03-26 00:00:00','2026-09-22 22:20:13','2026-09-22 22:20:13'),
(55,3,7,10,14,NULL,NULL,NULL,'2025-04-24',1280.00,'Cheque',NULL,'RC-2025-04',NULL,NULL,'Approved',1,1,'2025-04-24 00:00:00','2025-04-24 00:00:00','2026-09-22 22:20:13','2026-09-22 22:20:13'),
(56,3,7,10,15,NULL,NULL,NULL,'2025-05-12',430.00,'Cash',NULL,'RC-2025-05',NULL,NULL,'Approved',1,1,'2025-05-12 00:00:00','2025-05-12 00:00:00','2026-09-22 22:20:13','2026-09-22 22:20:13'),
(57,3,7,10,16,NULL,NULL,NULL,'2025-06-24',1020.00,'Cash',NULL,'RC-2025-06',NULL,NULL,'Approved',1,1,'2025-06-24 00:00:00','2025-06-24 00:00:00','2026-09-22 22:20:13','2026-09-22 22:20:13'),
(58,3,7,10,17,NULL,NULL,NULL,'2025-07-13',260.00,'Cash',NULL,'RC-2025-07',NULL,NULL,'Approved',1,1,'2025-07-13 00:00:00','2025-07-13 00:00:00','2026-09-22 22:20:13','2026-09-22 22:20:13'),
(59,3,7,10,18,NULL,NULL,NULL,'2025-08-10',1700.00,'Cheque',NULL,'RC-2025-08',NULL,NULL,'Approved',1,1,'2025-08-10 00:00:00','2025-08-10 00:00:00','2026-09-22 22:20:13','2026-09-22 22:20:13'),
(60,3,7,10,1,NULL,NULL,NULL,'2025-09-25',720.00,'Cash',NULL,'RC-2025-09',NULL,NULL,'Approved',1,1,'2025-09-25 00:00:00','2025-09-25 00:00:00','2026-09-22 22:20:13','2026-09-22 22:20:13'),
(61,3,7,10,2,NULL,NULL,NULL,'2025-10-26',1280.00,'Cash',NULL,'RC-2025-10',NULL,NULL,'Approved',1,1,'2025-10-26 00:00:00','2025-10-26 00:00:00','2026-09-22 22:20:13','2026-09-22 22:20:13'),
(62,3,7,10,3,NULL,NULL,NULL,'2025-11-22',430.00,'Cash',NULL,'RC-2025-11',NULL,NULL,'Approved',1,1,'2025-11-22 00:00:00','2025-11-22 00:00:00','2026-09-22 22:20:13','2026-09-22 22:20:13'),
(63,3,7,10,4,NULL,NULL,NULL,'2025-12-19',1020.00,'Cheque',NULL,'RC-2025-12',NULL,NULL,'Approved',1,1,'2025-12-19 00:00:00','2025-12-19 00:00:00','2026-09-22 22:20:13','2026-09-22 22:20:13');
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
(1,'management','تسيير',10.00,10,1002,1,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(2,'maouna','مؤونة',50.00,11,1002,2,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(3,'education','تعليم',20.00,12,1002,3,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(4,'health','صحة',4.00,13,1002,4,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(5,'activities','تربية وترفيه',5.00,14,1002,5,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(6,'projects','مشاريع',6.00,15,1002,6,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(7,'formation','تكوين',5.00,16,1002,7,'2026-09-22 22:20:11','2026-09-22 22:20:11');
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
(1,1,1,400.00,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(2,2,2,800.00,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(3,3,3,400.00,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(4,3,4,400.00,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(5,4,6,400.00,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(6,5,7,400.00,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(7,5,8,400.00,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(8,5,9,400.00,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(9,6,11,400.00,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(10,7,13,400.00,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(11,7,14,400.00,'2026-09-22 22:20:12','2026-09-22 22:20:12');
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
(1,'عبد الكريم','الودغيري','0646199735','عبد الكريم.الودغيري@example.com',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12',1,800.00),
(2,'خالد','بنموسى','0687315265','خالد.بنموسى@example.com',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12',2,1600.00),
(3,'ياسمين','الشرقاوي','0648445011','ياسمين.الشرقاوي@example.com',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12',3,800.00),
(4,'محمد','الغالي','0683158000','محمد.الغالي@example.com',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12',4,400.00),
(5,'سارة','أمين','0656140186','سارة.أمين@example.com',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12',5,2400.00),
(6,'عثمان','الفيلالي','0646061137','عثمان.الفيلالي@example.com',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12',6,800.00),
(7,'ليلى','حمداوي','0610628386','ليلى.حمداوي@example.com',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12',7,1200.00),
(8,'طارق','بوستة','0620588965','طارق.بوستة@example.com',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12',8,800.00);
/*!40000 ALTER TABLE `kafils` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `login_codes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `login_codes` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `challenge` varchar(64) NOT NULL,
  `code_hash` varchar(255) NOT NULL,
  `expires_at` timestamp NOT NULL,
  `consumed_at` timestamp NULL DEFAULT NULL,
  `attempts` tinyint(3) unsigned NOT NULL DEFAULT 0,
  `ip` varchar(45) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `login_codes_challenge_unique` (`challenge`),
  KEY `login_codes_user_expiry_index` (`user_id`,`expires_at`),
  CONSTRAINT `login_codes_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `login_codes` WRITE;
/*!40000 ALTER TABLE `login_codes` DISABLE KEYS */;
/*!40000 ALTER TABLE `login_codes` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=76 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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
(74,'2025_09_24_000002_attach_categories_to_budgets',1),
(75,'2025_09_25_000001_add_login_codes_and_password_age',1);
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
(1,1,1,3,1,NULL,NULL,NULL,20.00,1,'الرياضيات','الجمعية','enrolled',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(2,2,1,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(3,3,1,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(4,4,1,3,2,NULL,NULL,NULL,20.00,1,'الرياضيات، الفيزياء','الجمعية','passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(5,5,1,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'failed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(6,6,1,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(7,9,1,3,1,NULL,NULL,NULL,20.00,1,'اللغة الفرنسية','الجمعية','enrolled',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(8,10,1,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(9,11,1,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(10,12,1,3,2,NULL,NULL,NULL,20.00,1,'الفيزياء والكيمياء','الجمعية','failed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(11,13,1,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(12,14,1,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(13,15,1,3,1,NULL,NULL,NULL,20.00,1,'الرياضيات','الجمعية','enrolled',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(14,16,1,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(15,17,1,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'failed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(16,19,1,3,2,NULL,NULL,NULL,20.00,1,'الرياضيات، الفيزياء','الجمعية','enrolled',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(17,20,1,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(18,21,1,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(19,22,1,3,1,NULL,NULL,NULL,20.00,1,'اللغة الفرنسية','الجمعية','passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(20,23,1,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'failed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(21,24,1,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(22,25,1,3,2,NULL,NULL,NULL,20.00,1,'الفيزياء والكيمياء','الجمعية','enrolled',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(23,26,1,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(24,27,1,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(25,28,1,3,1,NULL,NULL,NULL,20.00,1,'الرياضيات','الجمعية','failed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(26,29,1,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(27,30,1,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(28,31,1,3,2,NULL,NULL,NULL,20.00,1,'الرياضيات، الفيزياء','الجمعية','enrolled',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(29,32,1,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(30,33,1,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'failed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(31,34,1,3,1,NULL,NULL,NULL,20.00,1,'اللغة الفرنسية','الجمعية','enrolled',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(32,35,1,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:13'),
(33,36,1,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:13'),
(34,37,1,3,2,NULL,NULL,NULL,20.00,1,'الفيزياء والكيمياء','الجمعية','passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:13'),
(35,38,1,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'failed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:13'),
(36,39,1,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:13'),
(37,40,1,3,1,NULL,NULL,NULL,20.00,1,'الرياضيات','الجمعية','enrolled',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:13'),
(38,41,1,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:13'),
(39,42,1,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:13'),
(40,43,1,3,2,NULL,NULL,NULL,20.00,1,'الرياضيات، الفيزياء','الجمعية','failed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:13'),
(41,44,1,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:13'),
(42,45,1,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:13'),
(43,46,1,3,1,NULL,NULL,NULL,20.00,1,'اللغة الفرنسية','الجمعية','enrolled',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:13'),
(44,47,1,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:13'),
(45,48,1,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'failed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:13'),
(46,49,1,3,2,NULL,NULL,NULL,20.00,1,'الفيزياء والكيمياء','الجمعية','enrolled',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:13'),
(47,50,1,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:13'),
(48,51,1,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:13'),
(49,52,1,3,1,NULL,NULL,NULL,20.00,1,'الرياضيات','الجمعية','passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:13'),
(50,53,1,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'failed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:13'),
(51,1,2,4,1,NULL,NULL,NULL,20.00,1,'الرياضيات','الجمعية','passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(52,1,3,3,1,NULL,NULL,NULL,20.00,1,'الرياضيات','الجمعية','passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(53,2,2,4,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(54,2,3,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(55,3,2,4,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(56,3,3,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(57,4,2,4,2,NULL,NULL,NULL,20.00,1,'الرياضيات، الفيزياء','الجمعية','passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(58,4,3,3,2,NULL,NULL,NULL,20.00,1,'الرياضيات، الفيزياء','الجمعية','passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(59,5,2,4,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(60,5,3,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(61,6,2,4,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(62,6,3,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(63,9,2,4,1,NULL,NULL,NULL,20.00,1,'اللغة الفرنسية','الجمعية','passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(64,9,3,3,1,NULL,NULL,NULL,20.00,1,'اللغة الفرنسية','الجمعية','passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(65,10,2,4,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(66,10,3,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(67,11,2,4,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(68,11,3,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(69,12,2,4,2,NULL,NULL,NULL,20.00,1,'الفيزياء والكيمياء','الجمعية','passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(70,12,3,3,2,NULL,NULL,NULL,20.00,1,'الفيزياء والكيمياء','الجمعية','passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(71,13,2,4,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(72,13,3,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(73,14,2,4,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(74,14,3,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(75,15,2,4,1,NULL,NULL,NULL,20.00,1,'الرياضيات','الجمعية','passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(76,15,3,3,1,NULL,NULL,NULL,20.00,1,'الرياضيات','الجمعية','passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(77,16,2,4,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(78,16,3,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(79,17,2,4,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(80,17,3,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(81,19,2,4,2,NULL,NULL,NULL,20.00,1,'الرياضيات، الفيزياء','الجمعية','passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(82,19,3,3,2,NULL,NULL,NULL,20.00,1,'الرياضيات، الفيزياء','الجمعية','passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(83,20,2,4,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(84,20,3,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(85,21,2,4,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(86,21,3,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(87,22,2,4,1,NULL,NULL,NULL,20.00,1,'اللغة الفرنسية','الجمعية','passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(88,22,3,3,1,NULL,NULL,NULL,20.00,1,'اللغة الفرنسية','الجمعية','passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(89,23,2,4,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(90,23,3,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(91,24,2,4,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(92,24,3,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(93,25,2,4,2,NULL,NULL,NULL,20.00,1,'الفيزياء والكيمياء','الجمعية','passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(94,25,3,3,2,NULL,NULL,NULL,20.00,1,'الفيزياء والكيمياء','الجمعية','passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(95,26,2,4,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(96,26,3,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(97,27,2,4,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(98,27,3,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(99,28,2,4,1,NULL,NULL,NULL,20.00,1,'الرياضيات','الجمعية','passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(100,28,3,3,1,NULL,NULL,NULL,20.00,1,'الرياضيات','الجمعية','passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(101,29,2,4,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(102,29,3,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(103,30,2,4,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(104,30,3,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(105,31,2,4,2,NULL,NULL,NULL,20.00,1,'الرياضيات، الفيزياء','الجمعية','passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(106,31,3,3,2,NULL,NULL,NULL,20.00,1,'الرياضيات، الفيزياء','الجمعية','passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(107,32,2,4,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(108,32,3,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(109,33,2,4,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(110,33,3,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(111,34,2,4,1,NULL,NULL,NULL,20.00,1,'اللغة الفرنسية','الجمعية','passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(112,34,3,3,1,NULL,NULL,NULL,20.00,1,'اللغة الفرنسية','الجمعية','passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(113,35,2,4,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(114,35,3,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(115,36,2,4,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(116,36,3,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(117,37,2,4,2,NULL,NULL,NULL,20.00,1,'الفيزياء والكيمياء','الجمعية','passed',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(118,37,3,3,2,NULL,NULL,NULL,20.00,1,'الفيزياء والكيمياء','الجمعية','passed',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(119,38,2,4,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(120,38,3,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(121,39,2,4,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(122,39,3,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(123,40,2,4,1,NULL,NULL,NULL,20.00,1,'الرياضيات','الجمعية','passed',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(124,40,3,3,1,NULL,NULL,NULL,20.00,1,'الرياضيات','الجمعية','passed',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(125,41,2,4,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(126,41,3,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(127,42,2,4,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(128,42,3,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(129,43,2,4,2,NULL,NULL,NULL,20.00,1,'الرياضيات، الفيزياء','الجمعية','passed',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(130,43,3,3,2,NULL,NULL,NULL,20.00,1,'الرياضيات، الفيزياء','الجمعية','passed',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(131,44,2,4,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(132,44,3,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(133,45,2,4,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(134,45,3,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(135,46,2,4,1,NULL,NULL,NULL,20.00,1,'اللغة الفرنسية','الجمعية','passed',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(136,46,3,3,1,NULL,NULL,NULL,20.00,1,'اللغة الفرنسية','الجمعية','passed',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(137,47,2,4,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(138,47,3,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(139,48,2,4,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(140,48,3,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(141,49,2,4,2,NULL,NULL,NULL,20.00,1,'الفيزياء والكيمياء','الجمعية','passed',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(142,49,3,3,2,NULL,NULL,NULL,20.00,1,'الفيزياء والكيمياء','الجمعية','passed',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(143,50,2,4,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(144,50,3,3,1,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(145,51,2,4,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(146,51,3,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(147,52,2,4,1,NULL,NULL,NULL,20.00,1,'الرياضيات','الجمعية','passed',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(148,52,3,3,1,NULL,NULL,NULL,20.00,1,'الرياضيات','الجمعية','passed',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(149,53,2,4,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(150,53,3,3,2,NULL,NULL,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13');
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
(1,1,'يوسف','الزهراء','male','2020-01-19',NULL,'ربو مزمن - متابعة شهرية',NULL,NULL,0,NULL,0,0,1,'M000000100',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(2,1,'مريم','الزهراء','female','2015-07-06',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000000101',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(3,2,'مريم','بنعلي','male','2016-12-10',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000000200',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(4,2,'أحمد','بنعلي','female','2012-09-02',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000000201',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(5,2,'سلمى','بنعلي','male','2007-07-19',NULL,NULL,'0656277457','D966327',0,NULL,0,0,1,'M000000202',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(6,3,'أحمد','الحسني','male','2014-06-12',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000000300',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(7,4,'سلمى','المرابط','male','2011-07-06',NULL,NULL,NULL,NULL,1,'خياطة منزلية',0,0,0,'M000000400',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(8,4,'إلياس','المرابط','female','2006-08-06',NULL,NULL,'0615481422','D520167',1,'خياطة منزلية',0,0,0,'M000000401',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(9,5,'إلياس','بوزيان','male','2008-05-22',NULL,NULL,'0666967524','D656355',0,NULL,0,0,1,'M000000500',1,0,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(10,6,'زكرياء','العلوي','male','2005-06-28',NULL,NULL,'0670499995','D633424',0,NULL,0,0,1,'M000000600',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(11,6,'خديجة','العلوي','female','2017-02-11',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000000601',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(12,6,'عمر','العلوي','male','2012-08-25',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000000602',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(13,7,'خديجة','الإدريسي','male','2019-05-11',NULL,'ربو مزمن - متابعة شهرية',NULL,NULL,0,NULL,0,0,1,'M000000700',0,1,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(14,7,'عمر','الإدريسي','female','2014-03-20',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000000701',0,1,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(15,8,'عمر','التازي','male','2016-03-08',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000000800',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(16,9,'هاجر','بنجلون','male','2013-02-08',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000000900',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(17,9,'أيوب','بنجلون','female','2008-02-09',NULL,NULL,'0645654236','D993751',0,NULL,0,0,1,'M000000901',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(18,10,'أيوب','الوردي','male','2010-04-16',NULL,NULL,NULL,NULL,0,NULL,0,1,0,'M000001000',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(19,11,'نور','الفاسي','male','2007-05-26',NULL,NULL,'0645944327','D332021',0,NULL,0,0,1,'M000001100',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(20,11,'حمزة','الفاسي','female','2019-06-03',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000001101',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(21,12,'حمزة','بركة','male','2004-03-10',NULL,NULL,'0692120278','D319838',0,NULL,0,0,1,'M000001200',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(22,12,'يوسف','بركة','female','2016-08-26',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000001201',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(23,12,'مريم','بركة','male','2010-12-05',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000001202',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(24,12,'أحمد','بركة','female','2006-09-02',NULL,NULL,'0613755281','D486699',0,NULL,0,0,1,'M000001203',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(25,13,'يوسف','الصقلي','male','2017-12-18',NULL,'ربو مزمن - متابعة شهرية',NULL,NULL,0,NULL,0,0,1,'M000001300',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(26,13,'مريم','الصقلي','female','2013-07-09',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000001301',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(27,14,'مريم','العمراني','male','2015-01-12',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000001400',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(28,14,'أحمد','العمراني','female','2010-06-27',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000001401',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(29,14,'سلمى','العمراني','male','2004-12-28',NULL,NULL,'0618994963','D598174',0,NULL,0,0,1,'M000001402',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(30,15,'أحمد','الحداد','male','2011-12-23',NULL,NULL,NULL,NULL,1,'تنظيف',0,0,1,'M000001500',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(31,16,'سلمى','الرامي','male','2009-08-30',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000001600',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(32,16,'إلياس','الرامي','female','2004-03-03',NULL,NULL,'0667105007','D848421',0,NULL,0,0,1,'M000001601',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(33,17,'إلياس','الشامي','male','2006-04-23',NULL,NULL,'0680985057','D626941',0,NULL,0,0,1,'M000001700',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(34,17,'زكرياء','الشامي','female','2017-12-12',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000001701',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(35,17,'خديجة','الشامي','male','2012-11-27',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000001702',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(36,18,'زكرياء','بنعمر','male','2020-03-15',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000001800',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(37,18,'خديجة','بنعمر','female','2015-09-12',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000001801',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(38,19,'خديجة','الكتاني','male','2016-11-29',NULL,'ربو مزمن - متابعة شهرية',NULL,NULL,0,NULL,0,0,1,'M000001900',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(39,20,'عمر','السباعي','male','2014-04-18',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000002000',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(40,20,'هاجر','السباعي','female','2008-11-28',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000002001',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(41,20,'أيوب','السباعي','male','2004-02-02',NULL,NULL,'0654072257','D448112',0,NULL,0,0,1,'M000002002',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(42,21,'هاجر','المنصوري','male','2011-03-11',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000002100',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(43,21,'أيوب','المنصوري','female','2006-03-21',NULL,NULL,'0636028465','D355672',0,NULL,0,0,1,'M000002101',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(44,22,'أيوب','بلحاج','male','2008-02-11',NULL,NULL,'0656206272','D433399',0,NULL,0,0,1,'M000002200',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(45,22,'نور','بلحاج','female','2020-08-13',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000002201',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(46,22,'حمزة','بلحاج','male','2014-12-23',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000002202',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(47,22,'يوسف','بلحاج','female','2010-06-28',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000002203',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(48,23,'نور','الغزواني','male','2005-02-17',NULL,NULL,'0655703146','D555933',0,NULL,0,0,1,'M000002300',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(49,24,'حمزة','الرگراگي','male','2019-04-10',NULL,NULL,NULL,NULL,1,'بيع منتجات منزلية',0,0,1,'M000002400',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(50,24,'يوسف','الرگراگي','female','2014-04-04',NULL,NULL,NULL,NULL,1,'بيع منتجات منزلية',0,0,1,'M000002401',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(51,25,'يوسف','أوبيهي','male','2015-12-18',NULL,'ربو مزمن - متابعة شهرية',NULL,NULL,0,NULL,0,0,1,'M000002500',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(52,25,'مريم','أوبيهي','female','2011-02-12',NULL,NULL,NULL,NULL,0,NULL,0,0,1,'M000002501',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(53,25,'أحمد','أوبيهي','male','2006-01-29',NULL,NULL,'0664118952','D292206',0,NULL,0,0,1,'M000002502',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL);
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
(1,'لم يلتحق بالمدرسة','Not Enrolled',1,1,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(2,'روضة أطفال','Kindergarten',2,1,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(3,'الصف الأول الابتدائي','First Grade',3,1,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(4,'الصف الثاني الابتدائي','Second Grade',4,1,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(5,'الصف الثالث الابتدائي','Third Grade',5,1,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(6,'الصف الرابع الابتدائي','Fourth Grade',6,1,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(7,'الصف الخامس الابتدائي','Fifth Grade',7,1,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(8,'الصف السادس الابتدائي','Sixth Grade',8,1,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(9,'الصف الأول الإعدادي','Seventh Grade',9,1,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(10,'الصف الثاني الإعدادي','Eighth Grade',10,1,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(11,'الصف الثالث الإعدادي','Ninth Grade',11,1,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(12,'الصف الأول الثانوي','Tenth Grade',12,1,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(13,'الصف الثاني الثانوي','Eleventh Grade',13,1,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(14,'الصف الثالث الثانوي','Twelfth Grade',14,1,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(15,'تخرج من الثانوية','High School Graduate',15,1,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(16,'جامعي','University',16,1,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(17,'تخرج من الجامعة','University Graduate',17,1,'2026-09-22 22:20:11','2026-09-22 22:20:11');
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
(1,'التغذية','2026-09-22 22:20:12','2026-09-22 22:20:12');
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
(1,1,'مواد غذائية','2026-09-22 22:20:12','2026-09-22 22:20:12');
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
(1,'جمعية الإحسان','0522334455',NULL,NULL,1,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(2,'مؤسسة الخير','0522667788',NULL,NULL,1,1,'2026-09-22 22:20:12','2026-09-22 22:20:12');
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
(1,'مدرسة الأمل الابتدائية','school',0,0,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(2,'مدرسة النور الخاصة','school',1,1,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(3,'إعدادية الفتح','school',0,0,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(4,'ثانوية النهضة','school',0,0,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(5,'كلية العلوم - جامعة ابن زهر','university',0,0,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(6,'المعهد العالي للتكنولوجيا التطبيقية','university',1,0,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12');
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
('idda_monthly_allowance','400','2026-09-22 22:20:11','2026-09-22 22:20:11'),
('login_code_lifetime_minutes','10','2026-09-22 22:20:11','2026-09-22 22:20:11'),
('password_max_age_days','30','2026-09-22 22:20:11','2026-09-22 22:20:11');
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
(1,'خياطة','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(2,'طبخ','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(3,'تنظيف','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(4,'تدريس','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(5,'أشغال يدوية','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(6,'حياكة','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(7,'تطريز','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(8,'حلاقة نسائية','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(9,'ماكياج','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(10,'حاسوب','2026-09-22 22:20:11','2026-09-22 22:20:11');
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
(1,1,'2026-09-06',1,2,6000.00,'تغطية مستحقات الكفالات الشهرية','Approved',1,1,'2026-09-22 22:20:13','2026-09-22 22:20:13','2026-09-22 22:20:13'),
(2,1,'2026-09-22',2,1,1500.00,'إرجاع فائض الشهر الماضي','Draft',1,NULL,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13');
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
(1,1,2,'bus',1,0,NULL,0.00,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(2,1,4,'bus',1,17,NULL,171.79,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(3,1,6,'bus',1,14,NULL,141.47,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(4,1,7,'bus',1,18,NULL,181.89,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(5,1,9,'bus',1,15,NULL,151.58,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(6,1,10,'bus',1,19,NULL,191.99,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(7,1,11,'allowance',0,7,15.00,105.00,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(8,1,13,'bus',1,20,NULL,202.10,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(9,1,14,'bus',1,17,NULL,171.79,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(10,1,16,'bus',1,0,NULL,0.00,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(11,1,17,'bus',1,18,NULL,181.89,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(12,1,19,'allowance',0,7,12.00,84.00,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(13,1,20,'bus',1,19,NULL,191.99,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(14,1,21,'bus',1,16,NULL,161.68,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(15,1,23,'bus',1,20,NULL,202.10,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(16,1,24,'bus',1,17,NULL,171.78,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(17,1,26,'bus',1,14,NULL,141.47,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(18,1,28,'bus',1,18,NULL,181.89,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(19,1,1,'bus',1,0,NULL,0.00,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(20,1,3,'allowance',0,10,10.00,100.00,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(21,1,5,'bus',1,16,NULL,161.68,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(22,1,8,'bus',1,20,NULL,202.10,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(23,1,12,'bus',1,17,NULL,171.78,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(24,1,15,'bus',1,14,NULL,141.47,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(25,1,18,'bus',1,18,NULL,181.89,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(26,1,22,'bus',1,15,NULL,151.58,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(27,1,25,'bus',1,19,NULL,191.99,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(28,1,27,'allowance',0,8,10.00,80.00,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(29,1,29,'bus',1,20,NULL,202.10,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(30,2,2,'bus',1,19,NULL,211.88,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(31,2,4,'bus',1,16,NULL,178.43,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(32,2,6,'bus',1,20,NULL,223.04,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(33,2,7,'bus',1,17,NULL,189.58,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(34,2,9,'bus',1,14,NULL,156.13,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(35,2,10,'bus',1,18,NULL,200.73,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(36,2,11,'allowance',0,8,15.00,120.00,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(37,2,13,'bus',1,19,NULL,211.88,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(38,2,14,'bus',1,0,NULL,0.00,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(39,2,16,'bus',1,20,NULL,223.04,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(40,2,17,'bus',1,17,NULL,189.58,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(41,2,19,'allowance',0,8,12.00,96.00,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(42,2,20,'bus',1,18,NULL,200.73,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(43,2,21,'bus',1,15,NULL,167.28,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(44,2,23,'bus',1,19,NULL,211.88,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(45,2,24,'bus',1,16,NULL,178.43,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(46,2,26,'bus',1,20,NULL,223.04,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(47,2,28,'bus',1,0,NULL,0.00,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(48,2,1,'bus',1,14,NULL,156.13,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(49,2,3,'allowance',0,6,10.00,60.00,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(50,2,5,'bus',1,15,NULL,167.28,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(51,2,8,'bus',1,19,NULL,211.88,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(52,2,12,'bus',1,16,NULL,178.43,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(53,2,15,'bus',1,20,NULL,223.04,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(54,2,18,'bus',1,17,NULL,189.58,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(55,2,22,'bus',1,14,NULL,156.13,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(56,2,25,'bus',1,0,NULL,0.00,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(57,2,27,'allowance',0,9,10.00,90.00,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(58,2,29,'bus',1,19,NULL,211.88,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(59,3,2,'bus',1,18,NULL,182.90,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(60,3,4,'bus',1,15,NULL,152.42,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(61,3,6,'bus',1,19,NULL,193.07,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(62,3,7,'bus',1,16,NULL,162.58,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(63,3,9,'bus',1,20,NULL,203.23,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(64,3,10,'bus',1,17,NULL,172.74,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(65,3,11,'allowance',0,9,15.00,135.00,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(66,3,13,'bus',1,0,NULL,0.00,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(67,3,14,'bus',1,15,NULL,152.42,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(68,3,16,'bus',1,19,NULL,193.07,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(69,3,17,'bus',1,16,NULL,162.58,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(70,3,19,'allowance',0,9,12.00,108.00,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(71,3,20,'bus',1,17,NULL,172.74,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(72,3,21,'bus',1,14,NULL,142.26,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(73,3,23,'bus',1,18,NULL,182.90,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(74,3,24,'bus',1,15,NULL,152.42,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(75,3,26,'bus',1,0,NULL,0.00,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(76,3,28,'bus',1,16,NULL,162.58,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(77,3,1,'bus',1,20,NULL,203.23,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(78,3,3,'allowance',0,7,10.00,70.00,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(79,3,5,'bus',1,14,NULL,142.26,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(80,3,8,'bus',1,18,NULL,182.90,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(81,3,12,'bus',1,15,NULL,152.42,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(82,3,15,'bus',1,19,NULL,193.06,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(83,3,18,'bus',1,16,NULL,162.58,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(84,3,22,'bus',1,0,NULL,0.00,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(85,3,25,'bus',1,17,NULL,172.74,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(86,3,27,'allowance',0,10,10.00,100.00,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(87,3,29,'bus',1,18,NULL,182.90,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13');
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
(1,1,'2026-10-01',1850.00,2000.00,0.00,NULL,'2026-10-31 23:59:59',NULL,'2026-10-31 23:59:59',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(2,1,'2026-11-01',1920.00,2000.00,340.00,NULL,'2026-11-30 23:59:59',NULL,NULL,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(3,1,'2026-12-01',1780.00,2000.00,0.00,NULL,NULL,NULL,NULL,NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13');
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
(1,1,'bus','أمام المسجد',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(2,3,'bus','أمام الفرن',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(3,4,'allowance',NULL,10.00,'2026-09-15',NULL,'active','يسكن خارج مسار الحافلة','2026-09-22 22:20:13','2026-09-22 22:20:13'),
(4,5,'bus','أمام المسجد',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(5,7,'bus','أمام الفرن',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(6,9,'bus','أمام المسجد',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(7,11,'bus','أمام الفرن',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(8,13,'bus','أمام المسجد',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(9,15,'bus','أمام الفرن',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(10,17,'bus','أمام المسجد',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(11,18,'allowance',NULL,15.00,'2026-09-15',NULL,'active','يسكن خارج مسار الحافلة','2026-09-22 22:20:13','2026-09-22 22:20:13'),
(12,19,'bus','أمام الفرن',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(13,21,'bus','أمام المسجد',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(14,23,'bus','أمام الفرن',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(15,25,'bus','أمام المسجد',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(16,27,'bus','أمام الفرن',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(17,29,'bus','أمام المسجد',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(18,31,'bus','أمام الفرن',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(19,32,'allowance',NULL,12.00,'2026-09-15',NULL,'active','يسكن خارج مسار الحافلة','2026-09-22 22:20:13','2026-09-22 22:20:13'),
(20,33,'bus','أمام المسجد',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(21,35,'bus','أمام الفرن',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(22,37,'bus','أمام المسجد',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(23,39,'bus','أمام الفرن',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(24,41,'bus','أمام المسجد',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(25,43,'bus','أمام الفرن',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(26,45,'bus','أمام المسجد',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(27,46,'allowance',NULL,10.00,'2026-09-15',NULL,'active','يسكن خارج مسار الحافلة','2026-09-22 22:20:13','2026-09-22 22:20:13'),
(28,47,'bus','أمام الفرن',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13'),
(29,49,'bus','أمام المسجد',NULL,'2026-09-15',NULL,'active',NULL,'2026-09-22 22:20:13','2026-09-22 22:20:13');
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
  `two_factor_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `password_changed_at` timestamp NULL DEFAULT NULL,
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
(1,'محمد بنصديق','mohamed@amaso.site','superuser',NULL,NULL,1,0,NULL,NULL,'2026-09-22 22:20:11','$2y$12$UllwQ9wsDq2jEyZaD/LzX.eDLm2fDtY1fQuzBTuYy17AQWadigg1.',NULL,'2026-09-22 22:20:11','2026-09-22 22:20:11'),
(2,'بشرى','bouchra@amaso.site','superuser',NULL,NULL,1,0,NULL,NULL,'2026-09-22 22:20:11','$2y$12$1.aMST.YLLdWXHmXUp7pWuUuH1NfTuSr/i253x0sBZ7a4Xo8eK1Qi',NULL,'2026-09-22 22:20:11','2026-09-22 22:20:11');
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
(1,'إيجار','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(2,'طعام','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(3,'دواء','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(4,'تعليم','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(5,'فواتير','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(6,'مواصلات','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(7,'ملابس','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(8,'مستلزمات منزلية','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(9,'رعاية صحية','2026-09-22 22:20:11','2026-09-22 22:20:11');
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
(1,1,'widow',1,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(2,2,'widow',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(3,3,'widow',0,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(4,4,'widow',1,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(5,5,'widow',0,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(6,6,'widow',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(7,7,'widow',1,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(8,8,'widow',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(9,9,'widow',0,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(10,10,'widow',1,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(11,11,'widow',0,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(12,12,'widow',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(13,13,'widow',1,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(14,14,'widow',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(15,15,'widow',0,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(16,16,'widow',1,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(17,17,'widow',0,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(18,18,'widow',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(19,19,'widow',1,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(20,20,'widow',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(21,21,'widow',0,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(22,22,'widow',1,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(23,23,'widow',0,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(24,24,'widow',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(25,25,'widow',1,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(26,26,'widow',0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12');
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
(1,'راتب','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(2,'معاش','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(3,'مساعدة','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(4,'تجارة','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(5,'عمل حر','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(6,'تبرعات','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(7,'إيجار عقار','2026-09-22 22:20:11','2026-09-22 22:20:11'),
(8,'حرفة','2026-09-22 22:20:11','2026-09-22 22:20:11');
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
(1,1,1,238.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(2,3,1,228.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(3,5,1,374.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(4,7,1,260.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(5,9,1,487.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(6,11,1,217.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(7,13,1,322.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(8,15,1,418.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(9,17,1,239.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(10,19,1,223.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(11,21,1,243.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(12,23,1,383.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(13,25,1,372.00,1,'2026-09-22 22:20:12','2026-09-22 22:20:12');
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
(1,1,'0573965700','هاتف الجيران','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(2,4,'0562121470','هاتف الجيران','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(3,7,'0531381888','هاتف الجيران','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(4,10,'0579435986','هاتف الجيران','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(5,13,'0513697341','هاتف الجيران','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(6,16,'0551545914','هاتف الجيران','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(7,19,'0517988252','هاتف الجيران','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(8,22,'0591843383','هاتف الجيران','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(9,25,'0572516885','هاتف الجيران','2026-09-22 22:20:12','2026-09-22 22:20:12');
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
(1,1,1,'rented',0,0,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(2,2,2,'owned',1,1,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(3,3,3,'free',1,1,2,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(4,4,1,'rented',1,1,3,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(5,5,2,'owned',1,1,4,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(6,6,3,'free',0,1,5,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(7,7,1,'rented',1,1,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(8,8,2,'owned',1,0,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(9,9,3,'free',1,1,2,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(10,10,1,'rented',1,1,3,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(11,11,2,'owned',0,1,4,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(12,12,3,'free',1,1,5,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(13,13,1,'rented',1,1,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(14,14,2,'owned',1,1,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(15,15,3,'free',1,0,2,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(16,16,1,'rented',0,1,3,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(17,17,2,'owned',1,1,4,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(18,18,3,'free',1,1,5,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(19,19,1,'rented',1,1,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(20,20,2,'owned',1,1,1,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(21,21,3,'free',0,1,2,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(22,22,1,'rented',1,0,3,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(23,23,2,'owned',1,1,4,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(24,24,3,'free',1,1,5,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(25,25,1,'rented',1,1,0,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(26,26,2,'owned',0,1,1,'2026-09-22 22:20:12','2026-09-22 22:20:12');
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
(1,1,2,1000.00,'مصاريف التغذية','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(2,1,1,700.00,'كراء السكن','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(3,1,3,150.00,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(4,2,2,1250.00,'مصاريف التغذية','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(5,2,4,300.00,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(6,3,2,750.00,'مصاريف التغذية','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(7,3,5,220.00,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(8,4,2,1000.00,'مصاريف التغذية','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(9,4,1,700.00,'كراء السكن','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(10,4,6,400.00,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(11,5,2,750.00,'مصاريف التغذية','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(12,5,3,150.00,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(13,6,2,1250.00,'مصاريف التغذية','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(14,6,4,300.00,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(15,7,2,1000.00,'مصاريف التغذية','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(16,7,1,700.00,'كراء السكن','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(17,7,5,220.00,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(18,8,2,750.00,'مصاريف التغذية','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(19,8,6,400.00,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(20,9,2,1000.00,'مصاريف التغذية','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(21,9,3,150.00,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(22,10,2,750.00,'مصاريف التغذية','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(23,10,1,700.00,'كراء السكن','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(24,10,4,300.00,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(25,11,2,1000.00,'مصاريف التغذية','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(26,11,5,220.00,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(27,12,2,1500.00,'مصاريف التغذية','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(28,12,6,400.00,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(29,13,2,1000.00,'مصاريف التغذية','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(30,13,1,700.00,'كراء السكن','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(31,13,3,150.00,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(32,14,2,1250.00,'مصاريف التغذية','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(33,14,4,300.00,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(34,15,2,750.00,'مصاريف التغذية','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(35,15,5,220.00,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(36,16,2,1000.00,'مصاريف التغذية','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(37,16,1,700.00,'كراء السكن','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(38,16,6,400.00,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(39,17,2,1250.00,'مصاريف التغذية','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(40,17,3,150.00,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(41,18,2,1000.00,'مصاريف التغذية','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(42,18,4,300.00,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(43,19,2,750.00,'مصاريف التغذية','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(44,19,1,700.00,'كراء السكن','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(45,19,5,220.00,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(46,20,2,1250.00,'مصاريف التغذية','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(47,20,6,400.00,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(48,21,2,1000.00,'مصاريف التغذية','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(49,21,3,150.00,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(50,22,2,1500.00,'مصاريف التغذية','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(51,22,1,700.00,'كراء السكن','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(52,22,4,300.00,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(53,23,2,750.00,'مصاريف التغذية','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(54,23,5,220.00,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(55,24,2,1000.00,'مصاريف التغذية','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(56,24,6,400.00,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(57,25,2,1250.00,'مصاريف التغذية','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(58,25,1,700.00,'كراء السكن','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(59,25,3,150.00,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12'),
(60,26,2,500.00,'مصاريف التغذية','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(61,26,4,300.00,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12');
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
(1,1,1,600.00,'مدخول شهري قار','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(2,1,5,200.00,'عمل موسمي','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(3,2,2,850.00,'مدخول شهري قار','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(4,3,1,400.00,'مدخول شهري قار','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(5,5,1,750.00,'مدخول شهري قار','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(6,6,2,600.00,'مدخول شهري قار','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(7,7,1,850.00,'مدخول شهري قار','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(8,7,5,200.00,'عمل موسمي','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(9,8,2,400.00,'مدخول شهري قار','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(10,9,1,1100.00,'مدخول شهري قار','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(11,10,2,750.00,'مدخول شهري قار','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(12,10,5,200.00,'عمل موسمي','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(13,11,1,600.00,'مدخول شهري قار','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(14,13,1,400.00,'مدخول شهري قار','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(15,13,5,200.00,'عمل موسمي','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(16,14,2,1100.00,'مدخول شهري قار','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(17,15,1,750.00,'مدخول شهري قار','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(18,16,2,600.00,'مدخول شهري قار','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(19,16,5,200.00,'عمل موسمي','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(20,17,1,850.00,'مدخول شهري قار','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(21,18,2,400.00,'مدخول شهري قار','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(22,19,1,1100.00,'مدخول شهري قار','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(23,19,5,200.00,'عمل موسمي','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(24,21,1,600.00,'مدخول شهري قار','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(25,22,2,850.00,'مدخول شهري قار','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(26,22,5,200.00,'عمل موسمي','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(27,23,1,400.00,'مدخول شهري قار','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(28,24,2,1100.00,'مدخول شهري قار','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(29,25,1,750.00,'مدخول شهري قار','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(30,25,5,200.00,'عمل موسمي','2026-09-22 22:20:12','2026-09-22 22:20:12'),
(31,26,2,600.00,'مدخول شهري قار','2026-09-22 22:20:12','2026-09-22 22:20:12');
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
(1,'فاطمة','الزهراء','0645019271',NULL,'شارع 0, حي السلام','حي السلام','2025-11-22','DEMO000001','1982-09-22',NULL,NULL,0,'Widowed','عمة الأيتام','بدون',0,NULL,NULL,NULL,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(2,'خديجة','بنعلي','0628492416',NULL,'شارع 1, حي النور','حي النور','2025-05-22','DEMO000002','1977-09-22',NULL,NULL,0,'Widowed',NULL,'ابتدائي',0,NULL,NULL,NULL,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(3,'أمينة','الحسني','0696536544',NULL,'شارع 2, حي الأمل','حي الأمل','2026-04-22','DEMO000003','1980-09-22',NULL,NULL,0,'Widowed',NULL,'إعدادي',0,NULL,NULL,NULL,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(4,'زينب','المرابط','0645852848',NULL,'شارع 3, حي الفتح','حي الفتح','2024-09-22','DEMO000004','1981-09-22',NULL,NULL,0,'Widowed',NULL,'ثانوي',0,NULL,NULL,NULL,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(5,'سعاد','بوزيان','0652630018',NULL,'شارع 4, حي الرحمة','حي الرحمة','2024-10-22','DEMO000005','1994-09-22',NULL,NULL,0,'Widowed','عمة الأيتام','جامعي',0,NULL,NULL,NULL,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(6,'نادية','العلوي','0675656752',NULL,'شارع 5, حي السلام','حي السلام','2026-03-22','DEMO000006','1981-09-22',NULL,NULL,0,'Widowed',NULL,'بدون',0,NULL,NULL,NULL,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(7,'حياة','الإدريسي','0651738215',NULL,'شارع 6, حي النور','حي النور','2024-04-22','DEMO000007','1978-09-22',NULL,NULL,0,'Widowed',NULL,'ابتدائي',0,NULL,NULL,NULL,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(8,'رشيدة','التازي','0628504841',NULL,'شارع 7, حي الأمل','حي الأمل','2026-05-22','DEMO000008','1978-09-22',NULL,NULL,0,'Widowed',NULL,'إعدادي',0,NULL,NULL,NULL,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(9,'لطيفة','بنجلون','0682557886',NULL,'شارع 8, حي الفتح','حي الفتح','2024-06-22','DEMO000009','1987-09-22',NULL,NULL,0,'Widowed','عمة الأيتام','ثانوي',0,NULL,NULL,NULL,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(10,'سميرة','الوردي','0630538524',NULL,'شارع 9, حي الرحمة','حي الرحمة','2026-06-22','DEMO000010','1993-09-22',NULL,NULL,0,'Widowed',NULL,'جامعي',0,NULL,NULL,NULL,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(11,'كريمة','الفاسي','0696736117',NULL,'شارع 10, حي السلام','حي السلام','2025-05-22','DEMO000011','1977-09-22',NULL,NULL,0,'Widowed',NULL,'بدون',0,NULL,NULL,NULL,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(12,'نعيمة','بركة','0695227759',NULL,'شارع 11, حي المسيرة','حي المسيرة','2025-01-22','DEMO000012','1979-09-22',NULL,NULL,0,'Widowed',NULL,'ابتدائي',0,NULL,NULL,NULL,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(13,'حنان','الصقلي','0647604595',NULL,'شارع 12, حي النهضة','حي النهضة','2026-01-22','DEMO000013','1992-09-22',NULL,NULL,0,'Widowed','عمة الأيتام','إعدادي',1,'إعاقة حركية جزئية',NULL,NULL,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(14,'بشرى','العمراني','0647255569',NULL,'شارع 13, حي الوفاق','حي الوفاق','2024-05-22','DEMO000014','1971-09-22',NULL,NULL,0,'Widowed',NULL,'ثانوي',0,NULL,NULL,NULL,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(15,'مليكة','الحداد','0655691341',NULL,'شارع 14, حي السلام','حي السلام','2025-01-22','DEMO000015','1982-09-22',NULL,NULL,0,'Widowed',NULL,'جامعي',0,NULL,NULL,NULL,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(16,'سناء','الرامي','0638827302',NULL,'شارع 15, حي النور','حي النور','2025-04-22','DEMO000016','1978-09-22',NULL,NULL,0,'Widowed',NULL,'بدون',0,NULL,NULL,NULL,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(17,'وفاء','الشامي','0662887478',NULL,'شارع 16, حي المسيرة','حي المسيرة','2025-12-22','DEMO000017','1996-09-22',NULL,NULL,0,'Widowed','عمة الأيتام','ابتدائي',0,NULL,NULL,NULL,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(18,'ثريا','بنعمر','0628597260',NULL,'شارع 17, حي الأمل','حي الأمل','2026-03-22','DEMO000018','1984-09-22',NULL,NULL,0,'Widowed',NULL,'إعدادي',0,NULL,NULL,NULL,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(19,'جميلة','الكتاني','0612402457',NULL,'شارع 18, حي النهضة','حي النهضة','2026-03-22','DEMO000019','1972-09-22',NULL,NULL,0,'Widowed',NULL,'ثانوي',0,NULL,NULL,NULL,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(20,'رجاء','السباعي','0688592003',NULL,'شارع 19, حي الفتح','حي الفتح','2024-09-22','DEMO000020','1982-09-22',NULL,NULL,0,'Widowed',NULL,'جامعي',0,NULL,NULL,NULL,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(21,'هدى','المنصوري','0697341330',NULL,'شارع 20, حي الوفاق','حي الوفاق','2024-10-22','DEMO000021','1976-09-22',NULL,NULL,0,'Widowed','عمة الأيتام','بدون',0,NULL,NULL,NULL,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(22,'أسماء','بلحاج','0631067096',NULL,'شارع 21, حي الرحمة','حي الرحمة','2026-04-22','DEMO000022','1995-09-22',NULL,NULL,0,'Widowed',NULL,'ابتدائي',0,NULL,NULL,NULL,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(23,'ابتسام','الغزواني','0627528445',NULL,'شارع 22, حي المسيرة','حي المسيرة','2024-07-22','DEMO000023','1982-09-22',NULL,NULL,0,'Widowed',NULL,'إعدادي',0,NULL,NULL,NULL,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:12',NULL),
(24,'مينة','الرگراگي','0683152073',NULL,'شارع 23, حي النهضة','حي النهضة','2026-04-10','DEMO000024','1986-09-22','2026-03-22','2026-09-04',1,'Widowed',NULL,'ثانوي',0,NULL,NULL,NULL,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:13',NULL),
(25,'فتيحة','أوبيهي','0620633484',NULL,'شارع 24, حي الوفاق','حي الوفاق','2026-08-13','DEMO000025','1981-09-22','2026-07-16','2026-11-26',1,'Widowed','عمة الأيتام','جامعي',0,NULL,NULL,NULL,NULL,'2026-09-22 22:20:12','2026-09-22 22:20:13',NULL),
(26,'زهور','التمسماني','0636725895',NULL,'شارع 25, حي السلام','حي السلام','2025-06-22','DEMO000026','1985-09-22',NULL,NULL,0,'Widowed',NULL,'بدون',0,NULL,'2026-09-19','graduated','انتقلت الأسرة إلى مدينة أخرى بعد تحسن وضعها','2026-09-22 22:20:12','2026-09-22 22:20:13','2026-09-22 22:20:13');
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
