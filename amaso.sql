-- AMASO - قاعدة بيانات تجريبية / Demo database
-- جمعية المنصور لكفالة اليتيم
--
-- Generated: 2026-09-11  (by backend/regenerate-demo-sql.sh)
-- Charset:   utf8mb4 / utf8mb4_unicode_ci
--
-- ماذا يحتوي هذا الملف / What this file contains
--   Schema for all 52 tables and the v_current_cash view, plus reference
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
(1,2026,'2026/2027',1,'2026-09-11 02:10:56','2026-09-11 02:10:56'),
(2,2024,'2024/2025',0,'2026-09-11 02:10:56','2026-09-11 02:10:56'),
(3,2025,'2025/2026',0,'2026-09-11 02:10:56','2026-09-11 02:10:56');
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
(1,'مساعدة شهرية','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(2,'مساعدة طبية','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(3,'مساعدة تعليمية','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(4,'مساعدة طارئة','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(5,'مساعدة غذائية','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(6,'مساعدة كسوة','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(7,'مساعدة إيجار','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(8,'مساعدة فواتير','2026-09-11 02:10:56','2026-09-11 02:10:56');
/*!40000 ALTER TABLE `aid_types` ENABLE KEYS */;
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
(1,2,'income',24,400.00,20400.00,'اعتماد إيراد بحوالة بنكية',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(2,2,'income',25,400.00,20800.00,'اعتماد إيراد بحوالة بنكية',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(3,2,'expense',1,-750.00,20050.00,'اعتماد مصروف',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(4,1,'expense',2,-1200.00,48800.00,'اعتماد مصروف',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(5,2,'expense',3,-450.00,19600.00,'اعتماد مصروف',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(6,1,'expense',4,-600.00,48200.00,'اعتماد مصروف',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(7,2,'expense',5,-900.00,18700.00,'اعتماد مصروف',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(8,1,'expense',6,-1350.00,46850.00,'اعتماد مصروف',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(9,2,'expense',7,-520.00,18180.00,'اعتماد مصروف',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(10,1,'expense',10,-1500.00,45350.00,'اعتماد مصروف',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(11,1,'transfer_out',1,-6000.00,39350.00,'تحويل إلى حساب \"حساب الكفالات\"',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(12,2,'transfer_in',1,6000.00,24180.00,'تحويل من حساب \"الحساب الرئيسي\"',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57');
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
(1,'الحساب الرئيسي','بنك التجارة','MA-1001',39350.00,50000.00,NULL,'2026-09-11 02:10:56','2026-09-11 02:10:57'),
(2,'حساب الكفالات','بنك الوفاء','MA-1002',24180.00,20000.00,NULL,'2026-09-11 02:10:56','2026-09-11 02:10:57');
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
(1,'Widow',1,NULL,'2026-09-11 02:10:56','2026-09-11 02:10:56'),
(2,'Orphan',NULL,1,'2026-09-11 02:10:56','2026-09-11 02:10:56'),
(3,'Orphan',NULL,2,'2026-09-11 02:10:56','2026-09-11 02:10:56'),
(4,'Widow',2,NULL,'2026-09-11 02:10:56','2026-09-11 02:10:56'),
(5,'Orphan',NULL,3,'2026-09-11 02:10:56','2026-09-11 02:10:56'),
(6,'Orphan',NULL,4,'2026-09-11 02:10:56','2026-09-11 02:10:56'),
(7,'Orphan',NULL,5,'2026-09-11 02:10:56','2026-09-11 02:10:56'),
(8,'Widow',3,NULL,'2026-09-11 02:10:56','2026-09-11 02:10:56'),
(9,'Orphan',NULL,6,'2026-09-11 02:10:56','2026-09-11 02:10:56'),
(10,'Widow',4,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(11,'Orphan',NULL,7,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(12,'Orphan',NULL,8,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(13,'Widow',5,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(14,'Orphan',NULL,9,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(15,'Widow',6,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(16,'Orphan',NULL,10,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(17,'Orphan',NULL,11,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(18,'Orphan',NULL,12,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(19,'Widow',7,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(20,'Orphan',NULL,13,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(21,'Orphan',NULL,14,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(22,'Widow',8,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(23,'Orphan',NULL,15,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(24,'Widow',9,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(25,'Orphan',NULL,16,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(26,'Orphan',NULL,17,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(27,'Widow',10,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(28,'Orphan',NULL,18,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(29,'Widow',11,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(30,'Orphan',NULL,19,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(31,'Orphan',NULL,20,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(32,'Widow',12,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(33,'Orphan',NULL,21,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(34,'Orphan',NULL,22,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(35,'Orphan',NULL,23,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(36,'Orphan',NULL,24,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(37,'Widow',13,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(38,'Orphan',NULL,25,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(39,'Orphan',NULL,26,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(40,'Widow',14,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(41,'Orphan',NULL,27,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(42,'Orphan',NULL,28,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(43,'Orphan',NULL,29,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(44,'Widow',15,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(45,'Orphan',NULL,30,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(46,'Widow',16,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(47,'Orphan',NULL,31,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(48,'Orphan',NULL,32,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(49,'Widow',17,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(50,'Orphan',NULL,33,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(51,'Orphan',NULL,34,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(52,'Orphan',NULL,35,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(53,'Widow',18,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(54,'Orphan',NULL,36,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(55,'Orphan',NULL,37,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(56,'Widow',19,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(57,'Orphan',NULL,38,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(58,'Widow',20,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(59,'Orphan',NULL,39,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(60,'Orphan',NULL,40,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(61,'Orphan',NULL,41,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(62,'Widow',21,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(63,'Orphan',NULL,42,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(64,'Orphan',NULL,43,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(65,'Widow',22,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(66,'Orphan',NULL,44,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(67,'Orphan',NULL,45,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(68,'Orphan',NULL,46,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(69,'Orphan',NULL,47,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(70,'Widow',23,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(71,'Orphan',NULL,48,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(72,'Widow',24,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(73,'Orphan',NULL,49,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(74,'Orphan',NULL,50,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(75,'Widow',25,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(76,'Orphan',NULL,51,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(77,'Orphan',NULL,52,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(78,'Orphan',NULL,53,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(79,'Widow',26,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57');
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
(1,1,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(1,4,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(1,8,'2026-09-11 02:10:57','2026-09-11 02:10:57');
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
(1,'مجموعة حي السلام','الأسر المستفيدة في حي السلام','2026-09-11 02:10:57','2026-09-11 02:10:57');
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
INSERT INTO `budgets` (`id`, `label`, `created_at`, `updated_at`, `is_default`) VALUES 
(1,'الرعاية الصحية','2026-09-10 19:26:10','2026-09-10 19:26:10',0),
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
(1,'عبد الكريم','الودغيري','0681301036','عبد الكريم.الودغيري@example.com',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57',1,1070.00),
(2,'خالد','بنموسى','0673184100','خالد.بنموسى@example.com',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57',1,3020.00),
(3,'ياسمين','الشرقاوي','0614907123','ياسمين.الشرقاوي@example.com',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57',1,3040.00),
(4,'محمد','الغالي','0626922314','محمد.الغالي@example.com',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57',1,2120.00),
(5,'سارة','أمين','0614110516','سارة.أمين@example.com',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57',1,2300.00),
(6,'عثمان','الفيلالي','0644453464','عثمان.الفيلالي@example.com',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57',1,700.00),
(7,'ليلى','حمداوي','0684684116','ليلى.حمداوي@example.com',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57',1,1800.00),
(8,'طارق','بوستة','0637439097','طارق.بوستة@example.com',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57',1,900.00),
(9,'رشيد','العلمي','0642112034','رشيد.العلمي@example.com',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57',0,500.00),
(10,'نبيلة','بنكيران','0624897485','نبيلة.بنكيران@example.com',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57',0,1400.00),
(11,'يوسف','الحلو','0691178732','يوسف.الحلو@example.com',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57',0,1160.00),
(12,'سلمى','برادة','0672348166','سلمى.برادة@example.com',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57',0,2750.00),
(13,'إدريس','المكاوي','0656507156','إدريس.المكاوي@example.com',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57',0,1570.00),
(14,'غزلان','الطاهري','0671686373','غزلان.الطاهري@example.com',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57',0,2120.00),
(15,'أنس','زروال','0692664537','أنس.زروال@example.com',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57',0,940.00),
(16,'سميرة','القادري','0645185608','سميرة.القادري@example.com',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57',0,2420.00),
(17,'مصطفى','العروسي','0658565271','مصطفى.العروسي@example.com',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57',0,1360.00),
(18,'نزهة','بنشقرون','0693948582','نزهة.بنشقرون@example.com',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57',0,2750.00);
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
(1,1,13,NULL,750.00,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(2,2,24,NULL,1200.00,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(3,3,37,NULL,450.00,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(4,4,49,NULL,600.00,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(5,5,62,NULL,900.00,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(6,6,75,NULL,1350.00,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(7,7,8,NULL,520.00,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(8,8,19,NULL,680.00,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(9,9,29,NULL,1050.00,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(10,11,15,NULL,770.00,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(11,12,24,NULL,280.00,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(12,13,32,NULL,630.00,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(13,14,44,NULL,450.00,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(14,15,53,NULL,770.00,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(15,16,62,NULL,280.00,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(16,17,72,NULL,630.00,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(17,18,1,NULL,450.00,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(18,19,13,NULL,550.00,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(19,20,22,NULL,940.00,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(20,21,29,NULL,340.00,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(21,22,40,NULL,770.00,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(22,23,49,NULL,550.00,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(23,24,58,NULL,940.00,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(24,25,70,NULL,340.00,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(25,26,79,NULL,770.00,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(26,27,8,NULL,550.00,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57');
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
(1,NULL,'أدوية ومستلزمات طبية','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(2,NULL,'فحوصات طبية','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(3,NULL,'عمليات جراحية','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(4,NULL,'علاج طبيعي','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(5,NULL,'مساعدات طبية طارئة','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(6,NULL,'رسوم مدرسية','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(7,NULL,'مواد تعليمية','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(8,NULL,'دورات تدريبية','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(9,NULL,'منح الطلاب','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(10,NULL,'مصاريف النقل للطلاب','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(11,NULL,'وقود','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(12,NULL,'صيانة المركبات','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(13,NULL,'تأمين المركبات','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(14,NULL,'أجرة سائقين','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(15,NULL,'تذاكر النقل العام','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(16,NULL,'رواتب الموظفين','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(17,NULL,'مصاريف المكتب','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(18,NULL,'إيجار','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(19,NULL,'كهرباء وماء','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(20,NULL,'مصاريف الاتصالات','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(21,NULL,'مصاريف قانونية ومحاسبية','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(22,NULL,'مساعدات نقدية للأرامل','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(23,NULL,'مساعدات نقدية للأيتام','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(24,NULL,'مساعدات غذائية','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(25,NULL,'مساعدات سكن','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(26,NULL,'مساعدات كسوة','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(27,NULL,'تنظيم الفعاليات','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(28,NULL,'برامج ترفيهية للأطفال','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(29,NULL,'ورش تدريبية','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(30,NULL,'مؤتمرات ولقاءات','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(31,NULL,'مواد دعائية وإعلانية','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(999,NULL,'Deleted Category (Default)','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(1000,NULL,'مصاريف إدارية','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(1001,NULL,'أدوات ومستلزمات مكتبية','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(1002,NULL,'اتصالات وإنترنت','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(1003,NULL,'سلة غذائية','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(1004,NULL,'مساعدة نقدية شهرية','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(1005,NULL,'كسوة وملابس','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(1006,NULL,'مساعدة في الإيجار','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(1007,NULL,'فواتير الماء والكهرباء','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(1008,NULL,'رسوم التمدرس','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(1009,NULL,'أدوات ولوازم مدرسية','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(1010,NULL,'دعم ومساندة دراسية','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(1011,NULL,'نقل مدرسي','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(1012,NULL,'أدوية','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(1013,NULL,'فحوصات وتحاليل','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(1014,NULL,'استشارات طبية','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(1015,NULL,'نظارات وأجهزة طبية','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(1016,NULL,'رحلات وخرجات','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(1017,NULL,'مخيمات صيفية','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(1018,NULL,'أنشطة ثقافية ورياضية','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(1019,NULL,'هدايا المناسبات','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(1020,NULL,'مشاريع مدرة للدخل','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(1021,NULL,'تجهيز مشروع أسرة','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(1022,NULL,'دعم نشاط حر','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(1023,NULL,'دورات تكوينية','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(1024,NULL,'تكوين مهني','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(1025,NULL,'ورشات تأهيلية','2026-09-11 02:10:56','2026-09-11 02:10:56');
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
(1,1,7,2,NULL,NULL,'2026-01-13',750.00,'Cash',NULL,'EX-2026-01',2,NULL,0,'Approved',1,1,'2026-09-11 02:10:57','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(2,1,7,3,NULL,NULL,'2026-02-18',1200.00,'Cash',NULL,'EX-2026-02',1,NULL,0,'Approved',1,1,'2026-09-11 02:10:57','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(3,1,7,4,NULL,NULL,'2026-03-23',450.00,'Cash',NULL,'EX-2026-03',2,NULL,0,'Approved',1,1,'2026-09-11 02:10:57','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(4,1,7,5,NULL,NULL,'2026-04-10',600.00,'Cheque',NULL,'EX-2026-04',1,NULL,0,'Approved',1,1,'2026-09-11 02:10:57','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(5,1,7,6,NULL,NULL,'2026-05-15',900.00,'Cash',NULL,'EX-2026-05',2,NULL,0,'Approved',1,1,'2026-09-11 02:10:57','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(6,1,7,7,NULL,NULL,'2026-06-20',1350.00,'Cash',NULL,'EX-2026-06',1,NULL,0,'Approved',1,1,'2026-09-11 02:10:57','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(7,1,7,8,NULL,NULL,'2026-07-25',520.00,'Cash',NULL,'EX-2026-07',2,NULL,0,'Approved',1,1,'2026-09-11 02:10:57','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(8,1,7,9,NULL,NULL,'2026-08-12',680.00,'Cheque',NULL,'EX-2026-08',NULL,NULL,0,'Draft',1,NULL,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(9,1,7,10,NULL,NULL,'2026-09-11',1050.00,'Cash',NULL,'EX-2026-09',NULL,NULL,0,'Draft',1,NULL,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(10,1,7,1,NULL,NULL,'2026-09-11',1500.00,'BankWire',NULL,NULL,1,NULL,1,'Approved',1,1,'2026-09-11 02:10:57','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(11,2,7,4,NULL,NULL,'2024-08-19',770.00,'Cash',NULL,'EX-2024-01',NULL,NULL,0,'Approved',1,1,'2024-08-19 00:00:00','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(12,2,7,5,NULL,NULL,'2024-01-26',280.00,'Cash',NULL,'EX-2024-02',NULL,NULL,0,'Approved',1,1,'2024-01-26 00:00:00','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(13,2,7,6,NULL,NULL,'2024-06-16',630.00,'Cheque',NULL,'EX-2024-03',NULL,NULL,0,'Approved',1,1,'2024-06-16 00:00:00','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(14,2,7,7,NULL,NULL,'2024-11-24',450.00,'Cash',NULL,'EX-2024-04',NULL,NULL,0,'Approved',1,1,'2024-11-24 00:00:00','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(15,2,7,8,NULL,NULL,'2024-04-19',770.00,'Cash',NULL,'EX-2024-05',NULL,NULL,0,'Approved',1,1,'2024-04-19 00:00:00','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(16,2,7,9,NULL,NULL,'2024-09-26',280.00,'Cheque',NULL,'EX-2024-06',NULL,NULL,0,'Approved',1,1,'2024-09-26 00:00:00','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(17,2,7,10,NULL,NULL,'2024-02-20',630.00,'Cash',NULL,'EX-2024-07',NULL,NULL,0,'Approved',1,1,'2024-02-20 00:00:00','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(18,2,7,11,NULL,NULL,'2024-07-20',450.00,'Cash',NULL,'EX-2024-08',NULL,NULL,0,'Approved',1,1,'2024-07-20 00:00:00','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(19,3,7,3,NULL,NULL,'2025-07-10',550.00,'Cash',NULL,'EX-2025-01',NULL,NULL,0,'Approved',1,1,'2025-07-10 00:00:00','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(20,3,7,4,NULL,NULL,'2025-12-22',940.00,'Cash',NULL,'EX-2025-02',NULL,NULL,0,'Approved',1,1,'2025-12-22 00:00:00','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(21,3,7,5,NULL,NULL,'2025-05-07',340.00,'Cheque',NULL,'EX-2025-03',NULL,NULL,0,'Approved',1,1,'2025-05-07 00:00:00','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(22,3,7,6,NULL,NULL,'2025-10-03',770.00,'Cash',NULL,'EX-2025-04',NULL,NULL,0,'Approved',1,1,'2025-10-03 00:00:00','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(23,3,7,7,NULL,NULL,'2025-03-11',550.00,'Cash',NULL,'EX-2025-05',NULL,NULL,0,'Approved',1,1,'2025-03-11 00:00:00','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(24,3,7,8,NULL,NULL,'2025-08-14',940.00,'Cheque',NULL,'EX-2025-06',NULL,NULL,0,'Approved',1,1,'2025-08-14 00:00:00','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(25,3,7,9,NULL,NULL,'2025-01-09',340.00,'Cash',NULL,'EX-2025-07',NULL,NULL,0,'Approved',1,1,'2025-01-09 00:00:00','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(26,3,7,10,NULL,NULL,'2025-06-21',770.00,'Cash',NULL,'EX-2025-08',NULL,NULL,0,'Approved',1,1,'2025-06-21 00:00:00','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(27,3,7,11,NULL,NULL,'2025-11-11',550.00,'Cheque',NULL,'EX-2025-09',NULL,NULL,0,'Approved',1,1,'2025-11-11 00:00:00','2026-09-11 02:10:57','2026-09-11 02:10:57');
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
(1,2026,1,0.00,0.00,'2026-09-11 02:10:56','2026-09-11 02:10:56'),
(2,2024,0,0.00,0.00,'2026-09-11 02:10:56','2026-09-11 02:10:56'),
(3,2025,0,0.00,0.00,'2026-09-11 02:10:56','2026-09-11 02:10:56');
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
(1,'شقة','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(2,'منزل','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(3,'غرفة','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(4,'بيت شعبي','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(5,'كوخ','2026-09-11 02:10:56','2026-09-11 02:10:56');
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
(1,'سكري',0,'2026-09-11 02:10:56','2026-09-11 02:10:56'),
(2,'ضغط دم',0,'2026-09-11 02:10:56','2026-09-11 02:10:56'),
(3,'قلب',0,'2026-09-11 02:10:56','2026-09-11 02:10:56'),
(4,'كلى',0,'2026-09-11 02:10:56','2026-09-11 02:10:56'),
(5,'ربو',0,'2026-09-11 02:10:56','2026-09-11 02:10:56'),
(6,'التهاب مفاصل',0,'2026-09-11 02:10:56','2026-09-11 02:10:56'),
(7,'صداع نصفي',0,'2026-09-11 02:10:56','2026-09-11 02:10:56'),
(8,'فقر دم',0,'2026-09-11 02:10:56','2026-09-11 02:10:56'),
(9,'غدة درقية',0,'2026-09-11 02:10:56','2026-09-11 02:10:56');
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
(1,NULL,'تبرعات للرعاية الصحية','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(3,NULL,'دعم العلاجات','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(4,NULL,'رسوم التدريب','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(5,NULL,'تبرعات تعليمية','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(6,NULL,'منح دراسية','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(7,NULL,'تبرعات للمواصلات','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(8,NULL,'دعم النقل','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(9,NULL,'رسوم إدارية','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(10,NULL,'تبرعات عامة','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(11,NULL,'تبرعات للمساعدات الاجتماعية','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(12,NULL,'زكاة','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(13,NULL,'صدقات','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(14,NULL,'رعاية الفعاليات','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(15,NULL,'تبرعات للبرامج','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(999,NULL,'Deleted Category (Default)','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(1002,NULL,'كفالة شاملة','2026-09-11 02:10:56','2026-09-11 02:10:56');
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
(1,1,7,10,2,NULL,NULL,'2026-01-08',900.00,'Cash',NULL,'RC-2026-01',NULL,NULL,'Approved',1,1,'2026-09-11 02:10:57',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(2,1,7,10,3,NULL,NULL,'2026-02-11',2400.00,'Cash',NULL,'RC-2026-02',NULL,NULL,'Approved',1,1,'2026-09-11 02:10:57',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(3,1,7,10,4,NULL,NULL,'2026-03-14',1100.00,'Cheque',NULL,'RC-2026-03',NULL,NULL,'Approved',1,1,'2026-09-11 02:10:57',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(4,1,7,10,5,NULL,NULL,'2026-04-17',1800.00,'Cash',NULL,'RC-2026-04',NULL,NULL,'Approved',1,1,'2026-09-11 02:10:57',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(5,1,7,10,6,NULL,NULL,'2026-05-20',700.00,'Cash',NULL,'RC-2026-05',NULL,NULL,'Approved',1,1,'2026-09-11 02:10:57',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(6,1,7,10,7,NULL,NULL,'2026-06-23',1500.00,'Cheque',NULL,'RC-2026-06',NULL,NULL,'Approved',1,1,'2026-09-11 02:10:57',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(7,1,7,10,8,NULL,NULL,'2026-07-06',900.00,'Cash',NULL,'RC-2026-07',NULL,NULL,'Approved',1,1,'2026-09-11 02:10:57',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(8,1,7,10,9,NULL,NULL,'2026-08-09',2400.00,'Cash',NULL,'RC-2026-08',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(9,1,7,10,10,NULL,NULL,'2026-09-11',1100.00,'Cheque',NULL,'RC-2026-09',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(10,1,7,10,5,NULL,NULL,'2026-01-11',500.00,'Cash',NULL,'RC-1000',NULL,NULL,'Approved',1,1,'2026-09-11 02:10:57',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(11,1,7,10,6,NULL,NULL,'2026-02-12',1200.00,'Cash',NULL,'RC-1001',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(12,1,7,10,7,NULL,NULL,'2026-03-13',300.00,'Cash',NULL,'RC-1002',NULL,NULL,'Approved',1,1,'2026-09-11 02:10:57',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(13,1,7,10,8,NULL,NULL,'2026-04-14',2000.00,'Cash',NULL,'RC-1003',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(14,1,7,10,9,NULL,NULL,'2026-05-15',500.00,'Cash',NULL,'RC-1004',NULL,NULL,'Approved',1,1,'2026-09-11 02:10:57',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(15,1,7,10,10,NULL,NULL,'2026-06-16',1200.00,'Cash',NULL,'RC-1005',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(16,1,7,10,11,NULL,NULL,'2026-07-17',300.00,'Cash',NULL,'RC-1006',NULL,NULL,'Approved',1,1,'2026-09-11 02:10:57',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(17,1,7,10,12,NULL,NULL,'2026-08-18',2000.00,'Cash',NULL,'RC-1007',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(18,1,7,10,13,NULL,NULL,'2026-09-11',500.00,'Cash',NULL,'RC-1008',NULL,NULL,'Approved',1,1,'2026-09-11 02:10:57',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(19,1,7,10,14,NULL,NULL,'2026-01-20',1200.00,'Cash',NULL,'RC-1009',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(20,1,7,10,15,NULL,NULL,'2026-02-21',300.00,'Cash',NULL,'RC-1010',NULL,NULL,'Approved',1,1,'2026-09-11 02:10:57',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(21,1,7,10,16,NULL,NULL,'2026-03-22',2000.00,'Cash',NULL,'RC-1011',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(22,1,7,10,17,NULL,NULL,'2026-04-23',500.00,'Cash',NULL,'RC-1012',NULL,NULL,'Approved',1,1,'2026-09-11 02:10:57',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(23,1,7,10,18,NULL,NULL,'2026-05-24',1200.00,'Cash',NULL,'RC-1013',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(24,1,8,1002,NULL,3,3,'2026-09-03',400.00,'BankWire',NULL,NULL,2,NULL,'Approved',1,1,'2026-09-11 02:10:57',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(25,1,8,1002,NULL,3,4,'2026-09-03',400.00,'BankWire',NULL,NULL,2,NULL,'Approved',1,1,'2026-09-11 02:10:57',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(26,1,9,1002,NULL,1,1,'2026-08-14',80.00,'Cash',NULL,'RC-KC-1',NULL,NULL,'Approved',1,1,'2026-09-11 02:10:57',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(27,1,10,1002,NULL,1,1,'2026-08-14',400.00,'Cash',NULL,'RC-KC-1',NULL,NULL,'Approved',1,1,'2026-09-11 02:10:57',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(28,1,11,1002,NULL,1,1,'2026-08-14',160.00,'Cash',NULL,'RC-KC-1',NULL,NULL,'Approved',1,1,'2026-09-11 02:10:57',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(29,1,12,1002,NULL,1,1,'2026-08-14',32.00,'Cash',NULL,'RC-KC-1',NULL,NULL,'Approved',1,1,'2026-09-11 02:10:57',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(30,1,13,1002,NULL,1,1,'2026-08-14',40.00,'Cash',NULL,'RC-KC-1',NULL,NULL,'Approved',1,1,'2026-09-11 02:10:57',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(31,1,14,1002,NULL,1,1,'2026-08-14',48.00,'Cash',NULL,'RC-KC-1',NULL,NULL,'Approved',1,1,'2026-09-11 02:10:57',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(32,1,15,1002,NULL,1,1,'2026-08-14',40.00,'Cash',NULL,'RC-KC-1',NULL,NULL,'Approved',1,1,'2026-09-11 02:10:57',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(33,1,9,1002,NULL,2,NULL,'2026-09-11',80.00,'Cash',NULL,'RC-KC-2',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(34,1,10,1002,NULL,2,NULL,'2026-09-11',400.00,'Cash',NULL,'RC-KC-2',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(35,1,11,1002,NULL,2,NULL,'2026-09-11',160.00,'Cash',NULL,'RC-KC-2',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(36,1,12,1002,NULL,2,NULL,'2026-09-11',32.00,'Cash',NULL,'RC-KC-2',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(37,1,13,1002,NULL,2,NULL,'2026-09-11',40.00,'Cash',NULL,'RC-KC-2',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(38,1,14,1002,NULL,2,NULL,'2026-09-11',48.00,'Cash',NULL,'RC-KC-2',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(39,1,15,1002,NULL,2,NULL,'2026-09-11',40.00,'Cash',NULL,'RC-KC-2',NULL,NULL,'Draft',1,NULL,NULL,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(40,2,7,10,10,NULL,NULL,'2024-01-24',1400.00,'Cash',NULL,'RC-2024-01',NULL,NULL,'Approved',1,1,'2024-01-24 00:00:00','2024-01-24 00:00:00','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(41,2,7,10,11,NULL,NULL,'2024-02-26',600.00,'Cash',NULL,'RC-2024-02',NULL,NULL,'Approved',1,1,'2024-02-26 00:00:00','2024-02-26 00:00:00','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(42,2,7,10,12,NULL,NULL,'2024-03-25',1050.00,'Cash',NULL,'RC-2024-03',NULL,NULL,'Approved',1,1,'2024-03-25 00:00:00','2024-03-25 00:00:00','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(43,2,7,10,13,NULL,NULL,'2024-04-04',350.00,'Cheque',NULL,'RC-2024-04',NULL,NULL,'Approved',1,1,'2024-04-04 00:00:00','2024-04-04 00:00:00','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(44,2,7,10,14,NULL,NULL,'2024-05-18',840.00,'Cash',NULL,'RC-2024-05',NULL,NULL,'Approved',1,1,'2024-05-18 00:00:00','2024-05-18 00:00:00','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(45,2,7,10,15,NULL,NULL,'2024-06-07',210.00,'Cash',NULL,'RC-2024-06',NULL,NULL,'Approved',1,1,'2024-06-07 00:00:00','2024-06-07 00:00:00','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(46,2,7,10,16,NULL,NULL,'2024-07-09',1400.00,'Cash',NULL,'RC-2024-07',NULL,NULL,'Approved',1,1,'2024-07-09 00:00:00','2024-07-09 00:00:00','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(47,2,7,10,17,NULL,NULL,'2024-08-15',600.00,'Cheque',NULL,'RC-2024-08',NULL,NULL,'Approved',1,1,'2024-08-15 00:00:00','2024-08-15 00:00:00','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(48,2,7,10,18,NULL,NULL,'2024-09-27',1050.00,'Cash',NULL,'RC-2024-09',NULL,NULL,'Approved',1,1,'2024-09-27 00:00:00','2024-09-27 00:00:00','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(49,2,7,10,1,NULL,NULL,'2024-10-21',350.00,'Cash',NULL,'RC-2024-10',NULL,NULL,'Approved',1,1,'2024-10-21 00:00:00','2024-10-21 00:00:00','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(50,2,7,10,2,NULL,NULL,'2024-11-17',840.00,'Cash',NULL,'RC-2024-11',NULL,NULL,'Approved',1,1,'2024-11-17 00:00:00','2024-11-17 00:00:00','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(51,2,7,10,3,NULL,NULL,'2024-12-26',210.00,'Cheque',NULL,'RC-2024-12',NULL,NULL,'Approved',1,1,'2024-12-26 00:00:00','2024-12-26 00:00:00','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(52,3,7,10,11,NULL,NULL,'2025-01-27',260.00,'Cash',NULL,'RC-2025-01',NULL,NULL,'Approved',1,1,'2025-01-27 00:00:00','2025-01-27 00:00:00','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(53,3,7,10,12,NULL,NULL,'2025-02-22',1700.00,'Cash',NULL,'RC-2025-02',NULL,NULL,'Approved',1,1,'2025-02-22 00:00:00','2025-02-22 00:00:00','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(54,3,7,10,13,NULL,NULL,'2025-03-20',720.00,'Cash',NULL,'RC-2025-03',NULL,NULL,'Approved',1,1,'2025-03-20 00:00:00','2025-03-20 00:00:00','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(55,3,7,10,14,NULL,NULL,'2025-04-19',1280.00,'Cheque',NULL,'RC-2025-04',NULL,NULL,'Approved',1,1,'2025-04-19 00:00:00','2025-04-19 00:00:00','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(56,3,7,10,15,NULL,NULL,'2025-05-07',430.00,'Cash',NULL,'RC-2025-05',NULL,NULL,'Approved',1,1,'2025-05-07 00:00:00','2025-05-07 00:00:00','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(57,3,7,10,16,NULL,NULL,'2025-06-12',1020.00,'Cash',NULL,'RC-2025-06',NULL,NULL,'Approved',1,1,'2025-06-12 00:00:00','2025-06-12 00:00:00','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(58,3,7,10,17,NULL,NULL,'2025-07-11',260.00,'Cash',NULL,'RC-2025-07',NULL,NULL,'Approved',1,1,'2025-07-11 00:00:00','2025-07-11 00:00:00','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(59,3,7,10,18,NULL,NULL,'2025-08-13',1700.00,'Cheque',NULL,'RC-2025-08',NULL,NULL,'Approved',1,1,'2025-08-13 00:00:00','2025-08-13 00:00:00','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(60,3,7,10,1,NULL,NULL,'2025-09-12',720.00,'Cash',NULL,'RC-2025-09',NULL,NULL,'Approved',1,1,'2025-09-12 00:00:00','2025-09-12 00:00:00','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(61,3,7,10,2,NULL,NULL,'2025-10-08',1280.00,'Cash',NULL,'RC-2025-10',NULL,NULL,'Approved',1,1,'2025-10-08 00:00:00','2025-10-08 00:00:00','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(62,3,7,10,3,NULL,NULL,'2025-11-21',430.00,'Cash',NULL,'RC-2025-11',NULL,NULL,'Approved',1,1,'2025-11-21 00:00:00','2025-11-21 00:00:00','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(63,3,7,10,4,NULL,NULL,'2025-12-16',1020.00,'Cheque',NULL,'RC-2025-12',NULL,NULL,'Approved',1,1,'2025-12-16 00:00:00','2025-12-16 00:00:00','2026-09-11 02:10:57','2026-09-11 02:10:57');
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
INSERT INTO `kafala_chamila_splits` (`id`, `key`, `label`, `percentage`, `budget_id`, `income_category_id`, `sort_order`, `created_at`, `updated_at`) VALUES 
(1,'management','تسيير',10.00,9,1002,1,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(2,'maouna','مؤونة',50.00,10,1002,2,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(3,'education','تعليم',20.00,11,1002,3,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(4,'health','صحة',4.00,12,1002,4,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(5,'activities','تربية وترفيه',5.00,13,1002,5,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(6,'projects','مشاريع',6.00,14,1002,6,'2026-09-10 19:26:11','2026-09-10 19:26:11'),
(7,'formation','تكوين',5.00,15,1002,7,'2026-09-10 19:26:11','2026-09-10 19:26:11');
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
(1,1,1,400.00,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(2,2,2,800.00,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(3,3,3,400.00,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(4,3,4,400.00,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(5,4,6,400.00,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(6,5,7,400.00,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(7,5,8,400.00,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(8,5,9,400.00,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(9,6,11,400.00,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(10,7,13,400.00,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(11,7,14,400.00,'2026-09-11 02:10:57','2026-09-11 02:10:57');
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
(1,'عبد الكريم','الودغيري','0681301036','عبد الكريم.الودغيري@example.com',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57',1,800.00),
(2,'خالد','بنموسى','0673184100','خالد.بنموسى@example.com',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57',2,1600.00),
(3,'ياسمين','الشرقاوي','0614907123','ياسمين.الشرقاوي@example.com',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57',3,800.00),
(4,'محمد','الغالي','0626922314','محمد.الغالي@example.com',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57',4,400.00),
(5,'سارة','أمين','0614110516','سارة.أمين@example.com',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57',5,2400.00),
(6,'عثمان','الفيلالي','0644453464','عثمان.الفيلالي@example.com',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57',6,800.00),
(7,'ليلى','حمداوي','0684684116','ليلى.حمداوي@example.com',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57',7,1200.00),
(8,'طارق','بوستة','0637439097','طارق.بوستة@example.com',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57',8,800.00);
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
) ENGINE=InnoDB AUTO_INCREMENT=59 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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
(58,'2025_09_15_000002_add_opening_balance_to_bank_accounts',1);
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
(1,1,1,3,1,NULL,NULL,NULL,NULL,NULL,20.00,1,'الرياضيات','الجمعية','enrolled',NULL,'2026-09-11 02:10:56','2026-09-11 02:10:57'),
(2,2,1,8,2,NULL,NULL,NULL,9.73,18.47,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-11 02:10:56','2026-09-11 02:10:57'),
(3,3,1,6,1,NULL,NULL,NULL,12.13,10.64,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-11 02:10:56','2026-09-11 02:10:57'),
(4,4,1,11,3,NULL,NULL,NULL,14.23,NULL,20.00,1,'الرياضيات، الفيزياء','الجمعية','passed',NULL,'2026-09-11 02:10:56','2026-09-11 02:10:57'),
(5,5,1,16,5,'الإعلاميات','master',1,72.31,72.36,100.00,0,NULL,NULL,'failed',NULL,'2026-09-11 02:10:56','2026-09-11 02:10:57'),
(6,6,1,9,3,NULL,NULL,NULL,7.34,18.53,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(7,9,1,16,5,'علوم الحياة والأرض','licence',3,62.49,38.49,100.00,1,'اللغة الفرنسية','الجمعية','enrolled',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(8,10,1,16,6,'الإعلاميات','licence',1,NULL,NULL,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(9,11,1,6,1,NULL,NULL,NULL,12.99,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(10,12,1,11,3,NULL,NULL,NULL,12.07,13.82,20.00,1,'الفيزياء والكيمياء','الجمعية','failed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(11,13,1,4,1,NULL,NULL,NULL,7.66,8.87,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(12,14,1,9,3,NULL,NULL,NULL,15.83,10.98,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(13,15,1,7,1,NULL,NULL,NULL,11.32,16.24,20.00,1,'الرياضيات','الجمعية','enrolled',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(14,16,1,10,3,NULL,NULL,NULL,15.21,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(15,17,1,16,5,'الاقتصاد','master',1,NULL,NULL,100.00,0,NULL,NULL,'failed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(16,19,1,16,6,'علوم الحياة والأرض','licence',3,14.43,18.33,20.00,1,'الرياضيات، الفيزياء','الجمعية','enrolled',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(17,20,1,4,1,NULL,NULL,NULL,9.52,10.35,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(18,21,1,16,6,'الاقتصاد','licence',2,15.57,18.60,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(19,22,1,7,1,NULL,NULL,NULL,13.67,NULL,20.00,1,'اللغة الفرنسية','الجمعية','passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(20,23,1,12,4,NULL,NULL,NULL,13.91,13.71,20.00,0,NULL,NULL,'failed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(21,24,1,16,5,'الاقتصاد','licence',2,54.18,59.39,100.00,0,NULL,NULL,'enrolled',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(22,25,1,5,2,NULL,NULL,NULL,NULL,NULL,20.00,1,'الفيزياء والكيمياء','الجمعية','enrolled',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(23,26,1,10,3,NULL,NULL,NULL,14.26,12.41,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(24,27,1,8,2,NULL,NULL,NULL,9.43,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(25,28,1,13,4,NULL,NULL,NULL,10.70,11.66,20.00,1,'الرياضيات','الجمعية','failed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(26,29,1,16,6,'الإعلاميات','licence',1,18.02,9.85,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(27,30,1,11,3,NULL,NULL,NULL,8.16,7.42,20.00,1,'اللغة الفرنسية','مركز الدعم المدرسي','enrolled',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(28,31,1,14,4,NULL,NULL,NULL,11.60,18.84,20.00,1,'الرياضيات، الفيزياء','الجمعية','enrolled',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(29,32,1,16,5,'الإعلاميات','technician',1,NULL,NULL,100.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(30,33,1,16,6,'الاقتصاد','master',2,7.97,16.28,20.00,0,NULL,NULL,'failed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(31,34,1,5,1,NULL,NULL,NULL,12.76,13.87,20.00,1,'اللغة الفرنسية','الجمعية','enrolled',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(32,35,1,10,3,NULL,NULL,NULL,9.26,17.76,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(33,36,1,3,1,NULL,NULL,NULL,17.42,10.29,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(34,37,1,8,2,NULL,NULL,NULL,11.27,NULL,20.00,1,'الفيزياء والكيمياء','الجمعية','passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(35,38,1,6,1,NULL,NULL,NULL,11.51,18.62,20.00,0,NULL,NULL,'failed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(36,39,1,9,3,NULL,NULL,NULL,NULL,NULL,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(37,40,1,14,4,NULL,NULL,NULL,18.38,17.71,20.00,1,'الرياضيات','الجمعية','enrolled',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(38,41,1,16,6,'الإعلاميات','licence',1,10.63,7.04,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(39,42,1,12,4,NULL,NULL,NULL,12.34,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(40,43,1,16,6,'علوم الحياة والأرض','master',2,13.27,9.50,20.00,1,'الرياضيات، الفيزياء','الجمعية','failed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(41,44,1,16,5,'الإعلاميات','licence',1,86.67,59.79,100.00,0,NULL,NULL,'enrolled',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(42,45,1,3,2,NULL,NULL,NULL,15.48,14.85,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(43,46,1,8,1,NULL,NULL,NULL,NULL,NULL,20.00,1,'اللغة الفرنسية','الجمعية','enrolled',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(44,47,1,13,4,NULL,NULL,NULL,7.25,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(45,48,1,16,5,'الاقتصاد','master',1,63.68,68.52,100.00,0,NULL,NULL,'failed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(46,49,1,4,2,NULL,NULL,NULL,15.43,11.56,20.00,1,'الفيزياء والكيمياء','الجمعية','enrolled',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(47,50,1,9,3,NULL,NULL,NULL,18.15,18.97,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(48,51,1,7,2,NULL,NULL,NULL,13.26,15.92,20.00,0,NULL,NULL,'enrolled',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(49,52,1,12,4,NULL,NULL,NULL,18.03,NULL,20.00,1,'الرياضيات','الجمعية','passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(50,53,1,16,6,'الإعلاميات','master',2,NULL,NULL,20.00,0,NULL,NULL,'failed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(51,1,2,3,1,NULL,NULL,NULL,8.95,NULL,20.00,1,'الرياضيات','الجمعية','passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(52,1,3,3,1,NULL,NULL,NULL,14.67,7.79,20.00,1,'الرياضيات','الجمعية','passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(53,2,2,6,2,NULL,NULL,NULL,11.83,12.19,20.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(54,2,3,7,2,NULL,NULL,NULL,18.21,12.95,20.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(55,3,2,4,1,NULL,NULL,NULL,11.13,9.54,20.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(56,3,3,5,1,NULL,NULL,NULL,7.78,7.74,20.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(57,4,2,9,3,NULL,NULL,NULL,7.80,7.48,20.00,1,'الرياضيات، الفيزياء','الجمعية','passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(58,4,3,10,3,NULL,NULL,NULL,8.59,13.87,20.00,1,'الرياضيات، الفيزياء','الجمعية','passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(59,5,2,14,4,NULL,NULL,NULL,7.56,16.45,20.00,1,'الرياضيات','أستاذ متطوع','passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(60,5,3,16,5,'الإعلاميات','master',2,10.69,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(61,6,2,7,2,NULL,NULL,NULL,8.26,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(62,6,3,8,2,NULL,NULL,NULL,16.66,11.03,20.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(63,9,2,14,4,NULL,NULL,NULL,7.96,9.90,20.00,1,'اللغة الفرنسية','الجمعية','passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(64,9,3,16,5,'علوم الحياة والأرض','licence',2,16.96,7.12,20.00,1,'اللغة الفرنسية','الجمعية','passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(65,10,2,14,4,NULL,NULL,NULL,11.96,18.41,20.00,1,'الرياضيات، الفيزياء','أستاذ متطوع','passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(66,10,3,16,6,'الإعلاميات','licence',3,95.26,86.05,100.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(67,11,2,4,1,NULL,NULL,NULL,7.85,12.29,20.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(68,11,3,5,1,NULL,NULL,NULL,7.78,10.16,20.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(69,12,2,9,3,NULL,NULL,NULL,14.08,14.43,20.00,1,'الفيزياء والكيمياء','الجمعية','passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(70,12,3,10,3,NULL,NULL,NULL,7.62,NULL,20.00,1,'الفيزياء والكيمياء','الجمعية','passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(71,13,2,3,1,NULL,NULL,NULL,18.90,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(72,13,3,3,1,NULL,NULL,NULL,18.96,18.04,20.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(73,14,2,7,2,NULL,NULL,NULL,8.54,17.74,20.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(74,14,3,8,2,NULL,NULL,NULL,8.66,7.95,20.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(75,15,2,5,1,NULL,NULL,NULL,8.82,12.32,20.00,1,'الرياضيات','الجمعية','passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(76,15,3,6,1,NULL,NULL,NULL,14.14,15.30,20.00,1,'الرياضيات','الجمعية','passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(77,16,2,8,2,NULL,NULL,NULL,14.94,12.49,20.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(78,16,3,9,3,NULL,NULL,NULL,13.04,18.49,20.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(79,17,2,14,4,NULL,NULL,NULL,17.72,11.92,20.00,1,'اللغة الفرنسية','مركز الدعم المدرسي','passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(80,17,3,16,5,'الاقتصاد','master',2,16.89,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(81,19,2,14,4,NULL,NULL,NULL,9.31,NULL,20.00,1,'الرياضيات، الفيزياء','الجمعية','passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(82,19,3,16,6,'علوم الحياة والأرض','licence',2,72.19,46.87,100.00,1,'الرياضيات، الفيزياء','الجمعية','passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(83,20,2,3,1,NULL,NULL,NULL,12.44,11.25,20.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(84,20,3,3,1,NULL,NULL,NULL,11.89,8.65,20.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(85,21,2,14,4,NULL,NULL,NULL,12.77,11.59,20.00,1,'الفيزياء والكيمياء','مركز الدعم المدرسي','passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(86,21,3,16,6,'الاقتصاد','licence',1,95.04,95.38,100.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(87,22,2,5,1,NULL,NULL,NULL,13.28,17.08,20.00,1,'اللغة الفرنسية','الجمعية','passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(88,22,3,6,1,NULL,NULL,NULL,15.71,12.17,20.00,1,'اللغة الفرنسية','الجمعية','passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(89,23,2,10,3,NULL,NULL,NULL,11.23,16.62,20.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(90,23,3,11,3,NULL,NULL,NULL,16.01,NULL,20.00,1,'الرياضيات، الفيزياء','أستاذ متطوع','passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(91,24,2,14,4,NULL,NULL,NULL,8.65,NULL,20.00,1,'الرياضيات','مركز الدعم المدرسي','passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(92,24,3,16,5,'الاقتصاد','licence',1,16.09,7.55,20.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(93,25,2,3,2,NULL,NULL,NULL,11.21,15.68,20.00,1,'الفيزياء والكيمياء','الجمعية','passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(94,25,3,4,2,NULL,NULL,NULL,15.06,9.68,20.00,1,'الفيزياء والكيمياء','الجمعية','passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(95,26,2,8,1,NULL,NULL,NULL,16.20,10.62,20.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(96,26,3,9,3,NULL,NULL,NULL,17.50,14.27,20.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(97,27,2,6,2,NULL,NULL,NULL,13.73,13.61,20.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(98,27,3,7,2,NULL,NULL,NULL,13.25,9.45,20.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(99,28,2,11,3,NULL,NULL,NULL,13.04,13.70,20.00,1,'الرياضيات','الجمعية','passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(100,28,3,12,4,NULL,NULL,NULL,7.26,NULL,20.00,1,'الرياضيات','الجمعية','passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(101,29,2,14,4,NULL,NULL,NULL,12.66,NULL,20.00,1,'الفيزياء والكيمياء','أستاذ متطوع','passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(102,29,3,16,6,'الإعلاميات','licence',3,44.20,40.70,100.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(103,30,2,9,3,NULL,NULL,NULL,7.08,18.21,20.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(104,30,3,10,3,NULL,NULL,NULL,14.09,11.79,20.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(105,31,2,12,4,NULL,NULL,NULL,12.55,17.62,20.00,1,'الرياضيات، الفيزياء','الجمعية','passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(106,31,3,13,4,NULL,NULL,NULL,11.33,7.40,20.00,1,'الرياضيات، الفيزياء','الجمعية','passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(107,32,2,14,4,NULL,NULL,NULL,15.17,17.06,20.00,1,'الرياضيات','أستاذ متطوع','passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(108,32,3,16,5,'الإعلاميات','technician',2,7.18,7.44,20.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(109,33,2,14,4,NULL,NULL,NULL,13.50,10.05,20.00,1,'الفيزياء والكيمياء','مركز الدعم المدرسي','passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(110,33,3,16,6,'الاقتصاد','master',1,89.40,NULL,100.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(111,34,2,3,1,NULL,NULL,NULL,8.71,NULL,20.00,1,'اللغة الفرنسية','الجمعية','passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(112,34,3,4,1,NULL,NULL,NULL,9.02,14.35,20.00,1,'اللغة الفرنسية','الجمعية','passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(113,35,2,8,2,NULL,NULL,NULL,8.38,11.95,20.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(114,35,3,9,3,NULL,NULL,NULL,17.97,10.77,20.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(115,36,2,3,1,NULL,NULL,NULL,16.74,15.94,20.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(116,36,3,3,1,NULL,NULL,NULL,8.09,12.44,20.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(117,37,2,6,2,NULL,NULL,NULL,17.68,10.27,20.00,1,'الفيزياء والكيمياء','الجمعية','passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(118,37,3,7,2,NULL,NULL,NULL,10.79,15.84,20.00,1,'الفيزياء والكيمياء','الجمعية','passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(119,38,2,4,1,NULL,NULL,NULL,15.81,12.83,20.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(120,38,3,5,1,NULL,NULL,NULL,18.65,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(121,39,2,7,2,NULL,NULL,NULL,17.86,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(122,39,3,8,2,NULL,NULL,NULL,9.11,18.57,20.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(123,40,2,12,4,NULL,NULL,NULL,18.53,17.16,20.00,1,'الرياضيات','الجمعية','passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(124,40,3,13,4,NULL,NULL,NULL,10.83,14.52,20.00,1,'الرياضيات','الجمعية','passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(125,41,2,14,4,NULL,NULL,NULL,12.39,12.13,20.00,1,'الفيزياء والكيمياء','أستاذ متطوع','passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(126,41,3,16,6,'الإعلاميات','licence',3,88.05,73.30,100.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(127,42,2,10,3,NULL,NULL,NULL,7.08,10.77,20.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(128,42,3,11,3,NULL,NULL,NULL,8.17,13.82,20.00,1,'اللغة الفرنسية','مركز الدعم المدرسي','passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(129,43,2,14,4,NULL,NULL,NULL,10.02,9.22,20.00,1,'الرياضيات، الفيزياء','الجمعية','passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(130,43,3,16,6,'علوم الحياة والأرض','master',1,89.77,NULL,100.00,1,'الرياضيات، الفيزياء','الجمعية','passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(131,44,2,14,4,NULL,NULL,NULL,12.05,NULL,20.00,1,'الرياضيات','أستاذ متطوع','passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(132,44,3,16,5,'الإعلاميات','licence',3,17.34,13.67,20.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(133,45,2,3,2,NULL,NULL,NULL,8.21,8.71,20.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(134,45,3,3,2,NULL,NULL,NULL,17.37,13.81,20.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(135,46,2,6,1,NULL,NULL,NULL,8.03,10.00,20.00,1,'اللغة الفرنسية','الجمعية','passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(136,46,3,7,1,NULL,NULL,NULL,7.82,7.40,20.00,1,'اللغة الفرنسية','الجمعية','passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(137,47,2,11,3,NULL,NULL,NULL,17.64,13.61,20.00,1,'الرياضيات، الفيزياء','أستاذ متطوع','passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(138,47,3,12,4,NULL,NULL,NULL,14.75,13.04,20.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(139,48,2,14,4,NULL,NULL,NULL,15.48,7.79,20.00,1,'الرياضيات','مركز الدعم المدرسي','passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(140,48,3,16,5,'الاقتصاد','master',2,14.13,NULL,20.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(141,49,2,3,2,NULL,NULL,NULL,9.75,NULL,20.00,1,'الفيزياء والكيمياء','الجمعية','passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(142,49,3,3,2,NULL,NULL,NULL,9.72,14.21,20.00,1,'الفيزياء والكيمياء','الجمعية','passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(143,50,2,7,1,NULL,NULL,NULL,12.44,12.07,20.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(144,50,3,8,1,NULL,NULL,NULL,10.46,8.29,20.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(145,51,2,5,2,NULL,NULL,NULL,10.31,8.80,20.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(146,51,3,6,2,NULL,NULL,NULL,11.67,17.13,20.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(147,52,2,10,3,NULL,NULL,NULL,10.19,12.75,20.00,1,'الرياضيات','الجمعية','passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(148,52,3,11,3,NULL,NULL,NULL,9.19,11.19,20.00,1,'الرياضيات','الجمعية','passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(149,53,2,14,4,NULL,NULL,NULL,18.04,9.25,20.00,1,'الفيزياء والكيمياء','أستاذ متطوع','passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(150,53,3,16,6,'الإعلاميات','master',1,90.68,NULL,100.00,0,NULL,NULL,'passed',NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57');
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
(1,1,'يوسف','الزهراء','male','2020-02-07',3,'ربو مزمن - متابعة شهرية',NULL,NULL,0,NULL,0,0,1,'M000000100',0,0,'2026-09-11 02:10:56','2026-09-11 02:10:56',NULL),
(2,1,'مريم','الزهراء','female','2015-05-30',8,NULL,NULL,NULL,0,NULL,0,0,1,'M000000101',0,0,'2026-09-11 02:10:56','2026-09-11 02:10:56',NULL),
(3,2,'مريم','بنعلي','male','2017-03-13',6,NULL,NULL,NULL,0,NULL,0,0,1,'M000000200',0,0,'2026-09-11 02:10:56','2026-09-11 02:10:56',NULL),
(4,2,'أحمد','بنعلي','female','2012-05-06',11,NULL,NULL,NULL,0,NULL,0,0,1,'M000000201',0,0,'2026-09-11 02:10:56','2026-09-11 02:10:56',NULL),
(5,2,'سلمى','بنعلي','male','2007-08-15',16,NULL,'0632399708','D478054',0,NULL,0,0,1,'M000000202',0,0,'2026-09-11 02:10:56','2026-09-11 02:10:56',NULL),
(6,3,'أحمد','الحسني','male','2014-07-31',9,NULL,NULL,NULL,0,NULL,0,0,1,'M000000300',0,0,'2026-09-11 02:10:56','2026-09-11 02:10:56',NULL),
(7,4,'سلمى','المرابط','male','2011-02-16',12,NULL,NULL,NULL,1,'خياطة منزلية',0,0,0,'M000000400',0,0,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(8,4,'إلياس','المرابط','female','2005-12-26',16,NULL,'0679548304','D783261',1,'خياطة منزلية',0,0,0,'M000000401',0,0,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(9,5,'إلياس','بوزيان','male','2008-06-05',16,NULL,'0692556053','D258087',0,NULL,0,0,1,'M000000500',1,0,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(10,6,'زكرياء','العلوي','male','2005-03-21',16,NULL,'0638668307','D994291',0,NULL,0,0,1,'M000000600',0,0,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(11,6,'خديجة','العلوي','female','2017-06-04',6,NULL,NULL,NULL,0,NULL,0,0,1,'M000000601',0,0,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(12,6,'عمر','العلوي','male','2012-08-24',11,NULL,NULL,NULL,0,NULL,0,0,1,'M000000602',0,0,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(13,7,'خديجة','الإدريسي','male','2019-01-17',4,'ربو مزمن - متابعة شهرية',NULL,NULL,0,NULL,0,0,1,'M000000700',0,1,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(14,7,'عمر','الإدريسي','female','2013-11-22',9,NULL,NULL,NULL,0,NULL,0,0,1,'M000000701',0,1,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(15,8,'عمر','التازي','male','2016-07-03',7,NULL,NULL,NULL,0,NULL,0,0,1,'M000000800',0,0,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(16,9,'هاجر','بنجلون','male','2012-12-05',10,NULL,NULL,NULL,0,NULL,0,0,1,'M000000900',0,0,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(17,9,'أيوب','بنجلون','female','2007-11-20',16,NULL,'0651754184','D726307',0,NULL,0,0,1,'M000000901',0,0,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(18,10,'أيوب','الوردي','male','2010-08-12',13,NULL,NULL,NULL,0,NULL,0,1,0,'M000001000',0,0,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(19,11,'نور','الفاسي','male','2007-02-16',16,NULL,'0684346265','D470136',0,NULL,0,0,1,'M000001100',0,0,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(20,11,'حمزة','الفاسي','female','2019-06-30',4,NULL,NULL,NULL,0,NULL,0,0,1,'M000001101',0,0,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(21,12,'حمزة','بركة','male','2004-08-18',16,NULL,'0611940795','D566848',0,NULL,0,0,1,'M000001200',0,0,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(22,12,'يوسف','بركة','female','2016-07-07',7,NULL,NULL,NULL,0,NULL,0,0,1,'M000001201',0,0,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(23,12,'مريم','بركة','male','2011-06-10',12,NULL,NULL,NULL,0,NULL,0,0,1,'M000001202',0,0,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(24,12,'أحمد','بركة','female','2005-12-09',16,NULL,'0699832338','D306176',0,NULL,0,0,1,'M000001203',0,0,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(25,13,'يوسف','الصقلي','male','2018-03-18',5,'ربو مزمن - متابعة شهرية',NULL,NULL,0,NULL,0,0,1,'M000001300',0,0,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(26,13,'مريم','الصقلي','female','2013-05-26',10,NULL,NULL,NULL,0,NULL,0,0,1,'M000001301',0,0,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(27,14,'مريم','العمراني','male','2015-05-23',8,NULL,NULL,NULL,0,NULL,0,0,1,'M000001400',0,0,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(28,14,'أحمد','العمراني','female','2010-05-29',13,NULL,NULL,NULL,0,NULL,0,0,1,'M000001401',0,0,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(29,14,'سلمى','العمراني','male','2005-06-20',16,NULL,'0622525497','D105828',0,NULL,0,0,1,'M000001402',0,0,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(30,15,'أحمد','الحداد','male','2011-12-25',11,NULL,NULL,NULL,1,'تنظيف',0,0,1,'M000001500',0,0,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(31,16,'سلمى','الرامي','male','2009-05-13',14,NULL,NULL,NULL,0,NULL,0,0,1,'M000001600',0,0,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(32,16,'إلياس','الرامي','female','2004-02-26',16,NULL,'0686154868','D918742',0,NULL,0,0,1,'M000001601',0,0,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(33,17,'إلياس','الشامي','male','2006-06-17',16,NULL,'0652905618','D494768',0,NULL,0,0,1,'M000001700',0,0,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(34,17,'زكرياء','الشامي','female','2018-04-01',5,NULL,NULL,NULL,0,NULL,0,0,1,'M000001701',0,0,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(35,17,'خديجة','الشامي','male','2013-01-15',10,NULL,NULL,NULL,0,NULL,0,0,1,'M000001702',0,0,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(36,18,'زكرياء','بنعمر','male','2020-03-28',3,NULL,NULL,NULL,0,NULL,0,0,1,'M000001800',0,0,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(37,18,'خديجة','بنعمر','female','2015-05-11',8,NULL,NULL,NULL,0,NULL,0,0,1,'M000001801',0,0,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(38,19,'خديجة','الكتاني','male','2016-11-28',6,'ربو مزمن - متابعة شهرية',NULL,NULL,0,NULL,0,0,1,'M000001900',0,0,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(39,20,'عمر','السباعي','male','2014-05-14',9,NULL,NULL,NULL,0,NULL,0,0,1,'M000002000',0,0,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(40,20,'هاجر','السباعي','female','2009-03-06',14,NULL,NULL,NULL,0,NULL,0,0,1,'M000002001',0,0,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(41,20,'أيوب','السباعي','male','2004-06-06',16,NULL,'0612552469','D481506',0,NULL,0,0,1,'M000002002',0,0,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(42,21,'هاجر','المنصوري','male','2011-01-15',12,NULL,NULL,NULL,0,NULL,0,0,1,'M000002100',0,0,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(43,21,'أيوب','المنصوري','female','2006-03-12',16,NULL,'0633682532','D593680',0,NULL,0,0,1,'M000002101',0,0,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(44,22,'أيوب','بلحاج','male','2008-04-26',16,NULL,'0611336503','D492819',0,NULL,0,0,1,'M000002200',0,0,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(45,22,'نور','بلحاج','female','2019-12-29',3,NULL,NULL,NULL,0,NULL,0,0,1,'M000002201',0,0,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(46,22,'حمزة','بلحاج','male','2015-08-10',8,NULL,NULL,NULL,0,NULL,0,0,1,'M000002202',0,0,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(47,22,'يوسف','بلحاج','female','2010-05-14',13,NULL,NULL,NULL,0,NULL,0,0,1,'M000002203',0,0,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(48,23,'نور','الغزواني','male','2005-07-23',16,NULL,'0646318011','D632569',0,NULL,0,0,1,'M000002300',0,0,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(49,24,'حمزة','الرگراگي','male','2019-01-15',4,NULL,NULL,NULL,1,'بيع منتجات منزلية',0,0,1,'M000002400',0,0,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(50,24,'يوسف','الرگراگي','female','2014-05-15',9,NULL,NULL,NULL,1,'بيع منتجات منزلية',0,0,1,'M000002401',0,0,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(51,25,'يوسف','أوبيهي','male','2016-03-21',7,'ربو مزمن - متابعة شهرية',NULL,NULL,0,NULL,0,0,1,'M000002500',0,0,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(52,25,'مريم','أوبيهي','female','2011-05-24',12,NULL,NULL,NULL,0,NULL,0,0,1,'M000002501',0,0,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(53,25,'أحمد','أوبيهي','male','2006-03-15',16,NULL,'0631454101','D742304',0,NULL,0,0,1,'M000002502',0,0,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL);
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
(1,'لم يلتحق بالمدرسة','Not Enrolled',1,1,'2026-09-11 02:10:56','2026-09-11 02:10:56'),
(2,'روضة أطفال','Kindergarten',2,1,'2026-09-11 02:10:56','2026-09-11 02:10:56'),
(3,'الصف الأول الابتدائي','First Grade',3,1,'2026-09-11 02:10:56','2026-09-11 02:10:56'),
(4,'الصف الثاني الابتدائي','Second Grade',4,1,'2026-09-11 02:10:56','2026-09-11 02:10:56'),
(5,'الصف الثالث الابتدائي','Third Grade',5,1,'2026-09-11 02:10:56','2026-09-11 02:10:56'),
(6,'الصف الرابع الابتدائي','Fourth Grade',6,1,'2026-09-11 02:10:56','2026-09-11 02:10:56'),
(7,'الصف الخامس الابتدائي','Fifth Grade',7,1,'2026-09-11 02:10:56','2026-09-11 02:10:56'),
(8,'الصف السادس الابتدائي','Sixth Grade',8,1,'2026-09-11 02:10:56','2026-09-11 02:10:56'),
(9,'الصف الأول الإعدادي','Seventh Grade',9,1,'2026-09-11 02:10:56','2026-09-11 02:10:56'),
(10,'الصف الثاني الإعدادي','Eighth Grade',10,1,'2026-09-11 02:10:56','2026-09-11 02:10:56'),
(11,'الصف الثالث الإعدادي','Ninth Grade',11,1,'2026-09-11 02:10:56','2026-09-11 02:10:56'),
(12,'الصف الأول الثانوي','Tenth Grade',12,1,'2026-09-11 02:10:56','2026-09-11 02:10:56'),
(13,'الصف الثاني الثانوي','Eleventh Grade',13,1,'2026-09-11 02:10:56','2026-09-11 02:10:56'),
(14,'الصف الثالث الثانوي','Twelfth Grade',14,1,'2026-09-11 02:10:56','2026-09-11 02:10:56'),
(15,'تخرج من الثانوية','High School Graduate',15,1,'2026-09-11 02:10:56','2026-09-11 02:10:56'),
(16,'جامعي','University',16,1,'2026-09-11 02:10:56','2026-09-11 02:10:56'),
(17,'تخرج من الجامعة','University Graduate',17,1,'2026-09-11 02:10:56','2026-09-11 02:10:56');
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
(1,'التغذية','2026-09-11 02:10:56','2026-09-11 02:10:56');
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
(1,1,'مواد غذائية','2026-09-11 02:10:56','2026-09-11 02:10:56');
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
(1,'جمعية الإحسان','0522334455',NULL,NULL,1,1,'2026-09-11 02:10:56','2026-09-11 02:10:56'),
(2,'مؤسسة الخير','0522667788',NULL,NULL,1,1,'2026-09-11 02:10:56','2026-09-11 02:10:56');
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
(1,'مدرسة الأمل الابتدائية','school',0,0,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(2,'مدرسة النور الخاصة','school',1,1,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(3,'إعدادية الفتح','school',0,0,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(4,'ثانوية النهضة','school',0,0,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(5,'كلية العلوم - جامعة ابن زهر','university',0,0,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(6,'المعهد العالي للتكنولوجيا التطبيقية','university',1,0,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57');
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
(1,'خياطة','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(2,'طبخ','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(3,'تنظيف','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(4,'تدريس','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(5,'أشغال يدوية','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(6,'حياكة','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(7,'تطريز','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(8,'حلاقة نسائية','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(9,'ماكياج','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(10,'حاسوب','2026-09-11 02:10:56','2026-09-11 02:10:56');
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
(1,1,'2026-09-06',1,2,6000.00,'تغطية مستحقات الكفالات الشهرية','Approved',1,1,'2026-09-11 02:10:57','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(2,1,'2026-09-11',2,1,1500.00,'إرجاع فائض الشهر الماضي','Draft',1,NULL,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57');
/*!40000 ALTER TABLE `transfers` ENABLE KEYS */;
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
(1,'بنصديق محمد','admin@amaso.org','admin',NULL,NULL,1,NULL,'2026-09-11 02:10:56','$2y$12$mjxbFlK8Z8xCqyWeIGuTrO/WOjFrdt4TYy1tTfsxz5Xj1/lg5Msje',NULL,'2026-09-11 02:10:56','2026-09-11 02:10:56'),
(2,'سارة المحاسبة','accountant@amaso.org','accountant',NULL,NULL,1,NULL,'2026-09-11 02:10:56','$2y$12$vAGXsEtYvZhfkevWCQh7XO5rKuzpFeqSXcfGyPLEje.BvT9XjOu9a',NULL,'2026-09-11 02:10:56','2026-09-11 02:10:56'),
(3,'أحمد الأخصائي','social@amaso.org','social_worker',NULL,NULL,1,NULL,'2026-09-11 02:10:56','$2y$12$EHFkIEBRlAzHrX.c42Egiukz.k4Fia.Jr73VX75trib0Wqry0DGm6',NULL,'2026-09-11 02:10:56','2026-09-11 02:10:56');
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
(1,'إيجار','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(2,'طعام','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(3,'دواء','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(4,'تعليم','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(5,'فواتير','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(6,'مواصلات','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(7,'ملابس','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(8,'مستلزمات منزلية','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(9,'رعاية صحية','2026-09-11 02:10:56','2026-09-11 02:10:56');
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
(1,1,'widow',1,1,'2026-09-11 02:10:56','2026-09-11 02:10:56'),
(2,2,'widow',0,0,'2026-09-11 02:10:56','2026-09-11 02:10:56'),
(3,3,'widow',0,1,'2026-09-11 02:10:56','2026-09-11 02:10:56'),
(4,4,'widow',1,0,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(5,5,'widow',0,1,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(6,6,'widow',0,0,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(7,7,'widow',1,1,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(8,8,'widow',0,0,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(9,9,'widow',0,1,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(10,10,'widow',1,0,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(11,11,'widow',0,1,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(12,12,'widow',0,0,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(13,13,'widow',1,1,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(14,14,'widow',0,0,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(15,15,'widow',0,1,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(16,16,'widow',1,0,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(17,17,'widow',0,1,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(18,18,'widow',0,0,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(19,19,'widow',1,1,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(20,20,'widow',0,0,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(21,21,'widow',0,1,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(22,22,'widow',1,0,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(23,23,'widow',0,1,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(24,24,'widow',0,0,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(25,25,'widow',1,1,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(26,26,'widow',0,0,'2026-09-11 02:10:57','2026-09-11 02:10:57');
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
(1,'راتب','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(2,'معاش','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(3,'مساعدة','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(4,'تجارة','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(5,'عمل حر','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(6,'تبرعات','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(7,'إيجار عقار','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(8,'حرفة','2026-09-11 02:10:56','2026-09-11 02:10:56');
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
(1,1,1,211.00,1,'2026-09-11 02:10:56','2026-09-11 02:10:56'),
(2,3,1,243.00,1,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(3,5,1,414.00,1,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(4,7,1,229.00,1,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(5,9,1,213.00,1,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(6,11,1,415.00,1,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(7,13,1,407.00,1,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(8,15,1,319.00,1,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(9,17,1,375.00,1,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(10,19,1,453.00,1,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(11,21,1,393.00,1,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(12,23,1,267.00,1,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(13,25,1,383.00,1,'2026-09-11 02:10:57','2026-09-11 02:10:57');
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
(1,1,'0549595527','هاتف الجيران','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(2,4,'0572578702','هاتف الجيران','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(3,7,'0524576854','هاتف الجيران','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(4,10,'0586844942','هاتف الجيران','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(5,13,'0543366996','هاتف الجيران','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(6,16,'0511104747','هاتف الجيران','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(7,19,'0591343433','هاتف الجيران','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(8,22,'0542072073','هاتف الجيران','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(9,25,'0560591664','هاتف الجيران','2026-09-11 02:10:57','2026-09-11 02:10:57');
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
(1,1,1,'rented',0,0,0,'2026-09-11 02:10:56','2026-09-11 02:10:56'),
(2,2,2,'owned',1,1,1,'2026-09-11 02:10:56','2026-09-11 02:10:56'),
(3,3,3,'free',1,1,2,'2026-09-11 02:10:56','2026-09-11 02:10:56'),
(4,4,4,'rented',1,1,3,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(5,5,5,'owned',1,1,4,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(6,6,1,'free',0,1,5,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(7,7,2,'rented',1,1,0,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(8,8,3,'owned',1,0,1,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(9,9,4,'free',1,1,2,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(10,10,5,'rented',1,1,3,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(11,11,1,'owned',0,1,4,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(12,12,2,'free',1,1,5,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(13,13,3,'rented',1,1,0,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(14,14,4,'owned',1,1,1,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(15,15,5,'free',1,0,2,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(16,16,1,'rented',0,1,3,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(17,17,2,'owned',1,1,4,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(18,18,3,'free',1,1,5,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(19,19,4,'rented',1,1,0,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(20,20,5,'owned',1,1,1,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(21,21,1,'free',0,1,2,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(22,22,2,'rented',1,0,3,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(23,23,3,'owned',1,1,4,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(24,24,4,'free',1,1,5,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(25,25,5,'rented',1,1,0,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(26,26,1,'owned',0,1,1,'2026-09-11 02:10:57','2026-09-11 02:10:57');
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
(1,1,2,1000.00,'مصاريف التغذية','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(2,1,1,700.00,'كراء السكن','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(3,1,3,150.00,NULL,'2026-09-11 02:10:56','2026-09-11 02:10:56'),
(4,2,2,1250.00,'مصاريف التغذية','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(5,2,4,300.00,NULL,'2026-09-11 02:10:56','2026-09-11 02:10:56'),
(6,3,2,750.00,'مصاريف التغذية','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(7,3,5,220.00,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(8,4,2,1000.00,'مصاريف التغذية','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(9,4,1,700.00,'كراء السكن','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(10,4,6,400.00,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(11,5,2,750.00,'مصاريف التغذية','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(12,5,3,150.00,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(13,6,2,1250.00,'مصاريف التغذية','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(14,6,4,300.00,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(15,7,2,1000.00,'مصاريف التغذية','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(16,7,1,700.00,'كراء السكن','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(17,7,5,220.00,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(18,8,2,750.00,'مصاريف التغذية','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(19,8,6,400.00,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(20,9,2,1000.00,'مصاريف التغذية','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(21,9,3,150.00,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(22,10,2,750.00,'مصاريف التغذية','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(23,10,1,700.00,'كراء السكن','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(24,10,4,300.00,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(25,11,2,1000.00,'مصاريف التغذية','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(26,11,5,220.00,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(27,12,2,1500.00,'مصاريف التغذية','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(28,12,6,400.00,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(29,13,2,1000.00,'مصاريف التغذية','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(30,13,1,700.00,'كراء السكن','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(31,13,3,150.00,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(32,14,2,1250.00,'مصاريف التغذية','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(33,14,4,300.00,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(34,15,2,750.00,'مصاريف التغذية','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(35,15,5,220.00,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(36,16,2,1000.00,'مصاريف التغذية','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(37,16,1,700.00,'كراء السكن','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(38,16,6,400.00,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(39,17,2,1250.00,'مصاريف التغذية','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(40,17,3,150.00,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(41,18,2,1000.00,'مصاريف التغذية','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(42,18,4,300.00,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(43,19,2,750.00,'مصاريف التغذية','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(44,19,1,700.00,'كراء السكن','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(45,19,5,220.00,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(46,20,2,1250.00,'مصاريف التغذية','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(47,20,6,400.00,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(48,21,2,1000.00,'مصاريف التغذية','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(49,21,3,150.00,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(50,22,2,1500.00,'مصاريف التغذية','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(51,22,1,700.00,'كراء السكن','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(52,22,4,300.00,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(53,23,2,750.00,'مصاريف التغذية','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(54,23,5,220.00,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(55,24,2,1000.00,'مصاريف التغذية','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(56,24,6,400.00,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(57,25,2,1250.00,'مصاريف التغذية','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(58,25,1,700.00,'كراء السكن','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(59,25,3,150.00,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57'),
(60,26,2,500.00,'مصاريف التغذية','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(61,26,4,300.00,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57');
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
(1,1,1,600.00,'مدخول شهري قار','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(2,1,5,200.00,'عمل موسمي','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(3,2,2,850.00,'مدخول شهري قار','2026-09-11 02:10:56','2026-09-11 02:10:56'),
(4,3,1,400.00,'مدخول شهري قار','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(5,5,1,750.00,'مدخول شهري قار','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(6,6,2,600.00,'مدخول شهري قار','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(7,7,1,850.00,'مدخول شهري قار','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(8,7,5,200.00,'عمل موسمي','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(9,8,2,400.00,'مدخول شهري قار','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(10,9,1,1100.00,'مدخول شهري قار','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(11,10,2,750.00,'مدخول شهري قار','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(12,10,5,200.00,'عمل موسمي','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(13,11,1,600.00,'مدخول شهري قار','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(14,13,1,400.00,'مدخول شهري قار','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(15,13,5,200.00,'عمل موسمي','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(16,14,2,1100.00,'مدخول شهري قار','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(17,15,1,750.00,'مدخول شهري قار','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(18,16,2,600.00,'مدخول شهري قار','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(19,16,5,200.00,'عمل موسمي','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(20,17,1,850.00,'مدخول شهري قار','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(21,18,2,400.00,'مدخول شهري قار','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(22,19,1,1100.00,'مدخول شهري قار','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(23,19,5,200.00,'عمل موسمي','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(24,21,1,600.00,'مدخول شهري قار','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(25,22,2,850.00,'مدخول شهري قار','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(26,22,5,200.00,'عمل موسمي','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(27,23,1,400.00,'مدخول شهري قار','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(28,24,2,1100.00,'مدخول شهري قار','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(29,25,1,750.00,'مدخول شهري قار','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(30,25,5,200.00,'عمل موسمي','2026-09-11 02:10:57','2026-09-11 02:10:57'),
(31,26,2,600.00,'مدخول شهري قار','2026-09-11 02:10:57','2026-09-11 02:10:57');
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
(1,'فاطمة','الزهراء','0612409764',NULL,'شارع 0, حي السلام','حي السلام','2025-06-11','DEMO000001','1992-09-11','Widowed','عمة الأيتام','بدون',0,NULL,NULL,NULL,NULL,'2026-09-11 02:10:56','2026-09-11 02:10:56',NULL),
(2,'خديجة','بنعلي','0645804973',NULL,'شارع 1, حي النور','حي النور','2025-05-11','DEMO000002','1976-09-11','Widowed',NULL,'ابتدائي',0,NULL,NULL,NULL,NULL,'2026-09-11 02:10:56','2026-09-11 02:10:56',NULL),
(3,'أمينة','الحسني','0631588085',NULL,'شارع 2, حي الأمل','حي الأمل','2024-12-11','DEMO000003','1992-09-11','Widowed',NULL,'إعدادي',0,NULL,NULL,NULL,NULL,'2026-09-11 02:10:56','2026-09-11 02:10:56',NULL),
(4,'زينب','المرابط','0685216109',NULL,'شارع 3, حي الفتح','حي الفتح','2024-10-11','DEMO000004','1985-09-11','Widowed',NULL,'ثانوي',0,NULL,NULL,NULL,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(5,'سعاد','بوزيان','0684660255',NULL,'شارع 4, حي الرحمة','حي الرحمة','2026-06-11','DEMO000005','1975-09-11','Widowed','عمة الأيتام','جامعي',0,NULL,NULL,NULL,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(6,'نادية','العلوي','0675005278',NULL,'شارع 5, حي السلام','حي السلام','2024-03-11','DEMO000006','1972-09-11','Widowed',NULL,'بدون',0,NULL,NULL,NULL,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(7,'حياة','الإدريسي','0688298219',NULL,'شارع 6, حي النور','حي النور','2025-08-11','DEMO000007','1989-09-11','Widowed',NULL,'ابتدائي',0,NULL,NULL,NULL,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(8,'رشيدة','التازي','0621947847',NULL,'شارع 7, حي الأمل','حي الأمل','2025-02-11','DEMO000008','1987-09-11','Widowed',NULL,'إعدادي',0,NULL,NULL,NULL,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(9,'لطيفة','بنجلون','0636784359',NULL,'شارع 8, حي الفتح','حي الفتح','2026-06-11','DEMO000009','1989-09-11','Widowed','عمة الأيتام','ثانوي',0,NULL,NULL,NULL,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(10,'سميرة','الوردي','0655114719',NULL,'شارع 9, حي الرحمة','حي الرحمة','2024-06-11','DEMO000010','1975-09-11','Widowed',NULL,'جامعي',0,NULL,NULL,NULL,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(11,'كريمة','الفاسي','0618024018',NULL,'شارع 10, حي السلام','حي السلام','2025-08-11','DEMO000011','1995-09-11','Widowed',NULL,'بدون',0,NULL,NULL,NULL,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(12,'نعيمة','بركة','0657882121',NULL,'شارع 11, حي المسيرة','حي المسيرة','2025-09-11','DEMO000012','1990-09-11','Widowed',NULL,'ابتدائي',0,NULL,NULL,NULL,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(13,'حنان','الصقلي','0643699779',NULL,'شارع 12, حي النهضة','حي النهضة','2025-10-11','DEMO000013','1977-09-11','Widowed','عمة الأيتام','إعدادي',1,'إعاقة حركية جزئية',NULL,NULL,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(14,'بشرى','العمراني','0669855539',NULL,'شارع 13, حي الوفاق','حي الوفاق','2026-03-11','DEMO000014','1984-09-11','Widowed',NULL,'ثانوي',0,NULL,NULL,NULL,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(15,'مليكة','الحداد','0646191659',NULL,'شارع 14, حي السلام','حي السلام','2024-12-11','DEMO000015','1987-09-11','Widowed',NULL,'جامعي',0,NULL,NULL,NULL,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(16,'سناء','الرامي','0658656918',NULL,'شارع 15, حي النور','حي النور','2025-04-11','DEMO000016','1989-09-11','Widowed',NULL,'بدون',0,NULL,NULL,NULL,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(17,'وفاء','الشامي','0682153589',NULL,'شارع 16, حي المسيرة','حي المسيرة','2025-10-11','DEMO000017','1992-09-11','Widowed','عمة الأيتام','ابتدائي',0,NULL,NULL,NULL,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(18,'ثريا','بنعمر','0680433165',NULL,'شارع 17, حي الأمل','حي الأمل','2026-03-11','DEMO000018','1980-09-11','Widowed',NULL,'إعدادي',0,NULL,NULL,NULL,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(19,'جميلة','الكتاني','0695560841',NULL,'شارع 18, حي النهضة','حي النهضة','2025-07-11','DEMO000019','1973-09-11','Widowed',NULL,'ثانوي',0,NULL,NULL,NULL,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(20,'رجاء','السباعي','0617347096',NULL,'شارع 19, حي الفتح','حي الفتح','2025-07-11','DEMO000020','1985-09-11','Widowed',NULL,'جامعي',0,NULL,NULL,NULL,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(21,'هدى','المنصوري','0690136252',NULL,'شارع 20, حي الوفاق','حي الوفاق','2025-03-11','DEMO000021','1991-09-11','Widowed','عمة الأيتام','بدون',0,NULL,NULL,NULL,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(22,'أسماء','بلحاج','0629766044',NULL,'شارع 21, حي الرحمة','حي الرحمة','2026-04-11','DEMO000022','1996-09-11','Widowed',NULL,'ابتدائي',0,NULL,NULL,NULL,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(23,'ابتسام','الغزواني','0626929549',NULL,'شارع 22, حي المسيرة','حي المسيرة','2026-05-11','DEMO000023','1982-09-11','Widowed',NULL,'إعدادي',0,NULL,NULL,NULL,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(24,'مينة','الرگراگي','0638737833',NULL,'شارع 23, حي النهضة','حي النهضة','2024-07-11','DEMO000024','1990-09-11','Widowed',NULL,'ثانوي',0,NULL,NULL,NULL,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(25,'فتيحة','أوبيهي','0622898457',NULL,'شارع 24, حي الوفاق','حي الوفاق','2025-01-11','DEMO000025','1993-09-11','Widowed','عمة الأيتام','جامعي',0,NULL,NULL,NULL,NULL,'2026-09-11 02:10:57','2026-09-11 02:10:57',NULL),
(26,'زهور','التمسماني','0649134635',NULL,'شارع 25, حي السلام','حي السلام','2024-07-11','DEMO000026','1974-09-11','Widowed',NULL,'بدون',0,NULL,'2026-09-08','graduated','انتقلت الأسرة إلى مدينة أخرى بعد تحسن وضعها','2026-09-11 02:10:57','2026-09-11 02:10:57','2026-09-11 02:10:57');
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
