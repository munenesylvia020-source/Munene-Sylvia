-- Database Structure generated from sqlite3

SET FOREIGN_KEY_CHECKS=0;

CREATE TABLE `django_migrations` (`id` INT NOT NULL PRIMARY KEY AUTO_INCREMENT, `app` varchar(255) NOT NULL, `name` varchar(255) NOT NULL, `applied` datetime NOT NULL);

CREATE TABLE `django_content_type` (`id` INT NOT NULL PRIMARY KEY AUTO_INCREMENT, `app_label` varchar(100) NOT NULL, `model` varchar(100) NOT NULL);

CREATE TABLE `auth_group_permissions` (`id` INT NOT NULL PRIMARY KEY AUTO_INCREMENT, `group_id` integer NOT NULL REFERENCES `auth_group` (`id`) , `permission_id` integer NOT NULL REFERENCES `auth_permission` (`id`) );

CREATE TABLE `auth_permission` (`id` INT NOT NULL PRIMARY KEY AUTO_INCREMENT, `content_type_id` integer NOT NULL REFERENCES `django_content_type` (`id`) , `codename` varchar(100) NOT NULL, `name` varchar(255) NOT NULL);

CREATE TABLE `auth_group` (`id` INT NOT NULL PRIMARY KEY AUTO_INCREMENT, `name` varchar(150) NOT NULL UNIQUE);

CREATE TABLE `accounts_student_groups` (`id` INT NOT NULL PRIMARY KEY AUTO_INCREMENT, `student_id` bigint NOT NULL REFERENCES `accounts_student` (`id`) , `group_id` integer NOT NULL REFERENCES `auth_group` (`id`) );

CREATE TABLE `accounts_student_user_permissions` (`id` INT NOT NULL PRIMARY KEY AUTO_INCREMENT, `student_id` bigint NOT NULL REFERENCES `accounts_student` (`id`) , `permission_id` integer NOT NULL REFERENCES `auth_permission` (`id`) );

CREATE TABLE `django_admin_log` (`id` INT NOT NULL PRIMARY KEY AUTO_INCREMENT, `object_id` text NULL, `object_repr` varchar(200) NOT NULL, `action_flag` smallint unsigned NOT NULL CHECK (`action_flag` >= 0), `change_message` text NOT NULL, `content_type_id` integer NULL REFERENCES `django_content_type` (`id`) , `user_id` bigint NOT NULL REFERENCES `accounts_student` (`id`) , `action_time` datetime NOT NULL);

CREATE TABLE `finance_wallet` (`id` INT NOT NULL PRIMARY KEY AUTO_INCREMENT, `balance` decimal NOT NULL, `currency` varchar(3) NOT NULL, `created_at` datetime NOT NULL, `updated_at` datetime NOT NULL, `student_id` bigint NOT NULL UNIQUE REFERENCES `accounts_student` (`id`) );

CREATE TABLE `finance_balancesnapshot` (`id` INT NOT NULL PRIMARY KEY AUTO_INCREMENT, `balance` decimal NOT NULL, `snapshot_date` datetime NOT NULL, `notes` text NULL, `wallet_id` bigint NOT NULL REFERENCES `finance_wallet` (`id`) );

CREATE TABLE `finance_transaction` (`id` INT NOT NULL PRIMARY KEY AUTO_INCREMENT, `transaction_type` varchar(20) NOT NULL, `amount` decimal NOT NULL, `status` varchar(20) NOT NULL, `description` text NULL, `mpesa_reference` varchar(100) NULL UNIQUE, `created_at` datetime NOT NULL, `updated_at` datetime NOT NULL, `student_id` bigint NOT NULL REFERENCES `accounts_student` (`id`) , `wallet_id` bigint NOT NULL REFERENCES `finance_wallet` (`id`) );

CREATE TABLE `helb_helbaccount` (`id` INT NOT NULL PRIMARY KEY AUTO_INCREMENT, `helb_reference_number` varchar(50) NULL UNIQUE, `total_approved_amount` decimal NOT NULL, `course_duration_years` integer unsigned NOT NULL CHECK (`course_duration_years` >= 0), `total_disbursed` decimal NOT NULL, `remaining_balance` decimal NOT NULL, `account_created_at` datetime NOT NULL, `updated_at` datetime NOT NULL, `student_id` bigint NOT NULL UNIQUE REFERENCES `accounts_student` (`id`) );

CREATE TABLE `helb_disbursementschedule` (`id` INT NOT NULL PRIMARY KEY AUTO_INCREMENT, `disbursement_frequency` varchar(20) NOT NULL, `schedule_json` text NOT NULL CHECK ((JSON_VALID(`schedule_json`) OR `schedule_json` IS NULL)), `created_at` datetime NOT NULL, `updated_at` datetime NOT NULL, `helb_account_id` bigint NOT NULL UNIQUE REFERENCES `helb_helbaccount` (`id`) );

CREATE TABLE `helb_disbursementprojection` (`id` INT NOT NULL PRIMARY KEY AUTO_INCREMENT, `projected_date` date NOT NULL, `next_disbursement_date` date NOT NULL, `projected_amount` decimal NULL, `confidence_level` varchar(20) NOT NULL, `created_at` datetime NOT NULL, `helb_account_id` bigint NOT NULL REFERENCES `helb_helbaccount` (`id`) );

CREATE TABLE `helb_disbursement` (`id` INT NOT NULL PRIMARY KEY AUTO_INCREMENT, `amount` decimal NOT NULL, `expected_date` date NOT NULL, `disbursal_date` date NULL, `received_date` date NULL, `status` varchar(20) NOT NULL, `notes` text NULL, `created_at` datetime NOT NULL, `updated_at` datetime NOT NULL, `student_id` bigint NOT NULL REFERENCES `accounts_student` (`id`) , `helb_account_id` bigint NOT NULL REFERENCES `helb_helbaccount` (`id`) );

CREATE TABLE `investments_allocationplan` (`id` INT NOT NULL PRIMARY KEY AUTO_INCREMENT, `total_amount` decimal NOT NULL, `tuition_amount` decimal NOT NULL, `upkeep_amount` decimal NOT NULL, `investment_amount` decimal NOT NULL, `status` varchar(20) NOT NULL, `created_at` datetime NOT NULL, `updated_at` datetime NOT NULL, `student_id` bigint NOT NULL REFERENCES `accounts_student` (`id`) );

CREATE TABLE `investments_investmentposition` (`id` INT NOT NULL PRIMARY KEY AUTO_INCREMENT, `fund_type` varchar(20) NOT NULL, `fund_name` varchar(255) NOT NULL, `principal_amount` decimal NOT NULL, `current_value` decimal NOT NULL, `annual_yield_percentage` decimal NOT NULL, `accumulated_interest` decimal NOT NULL, `status` varchar(20) NOT NULL, `investment_date` datetime NOT NULL, `last_interest_accrual` datetime NOT NULL, `updated_at` datetime NOT NULL, `allocation_id` bigint NULL REFERENCES `investments_allocationplan` (`id`) , `student_id` bigint NOT NULL REFERENCES `accounts_student` (`id`) );

CREATE TABLE `investments_interestaccruallog` (`id` INT NOT NULL PRIMARY KEY AUTO_INCREMENT, `interest_accrued` decimal NOT NULL, `value_before` decimal NOT NULL, `value_after` decimal NOT NULL, `accrual_date` datetime NOT NULL, `position_id` bigint NOT NULL REFERENCES `investments_investmentposition` (`id`) );

CREATE TABLE `django_session` (`session_key` varchar(40) NOT NULL PRIMARY KEY, `session_data` text NOT NULL, `expire_date` datetime NOT NULL);

CREATE TABLE `authtoken_token` (`key` varchar(40) NOT NULL PRIMARY KEY, `created` datetime NOT NULL, `user_id` bigint NOT NULL UNIQUE REFERENCES `accounts_student` (`id`) );

CREATE TABLE `finance_expense` (`id` INT NOT NULL PRIMARY KEY AUTO_INCREMENT, `description` varchar(255) NOT NULL, `category` varchar(100) NOT NULL, `amount` decimal NOT NULL, `date` date NOT NULL, `created_at` datetime NOT NULL, `updated_at` datetime NOT NULL, `student_id` bigint NOT NULL REFERENCES `accounts_student` (`id`) );

CREATE TABLE `finance_budget` (`id` INT NOT NULL PRIMARY KEY AUTO_INCREMENT, `updated_at` datetime NOT NULL, `student_id` bigint NOT NULL UNIQUE REFERENCES `accounts_student` (`id`) , `accommodation_limit` decimal NOT NULL, `education_limit` decimal NOT NULL, `entertainment_limit` decimal NOT NULL, `food_limit` decimal NOT NULL, `healthcare_limit` decimal NOT NULL, `other_limit` decimal NOT NULL, `transport_limit` decimal NOT NULL, `utilities_limit` decimal NOT NULL);

CREATE TABLE `finance_b2ctransaction` (`id` INT NOT NULL PRIMARY KEY AUTO_INCREMENT, `phone_number` varchar(20) NOT NULL, `amount` decimal NOT NULL, `purpose` varchar(50) NOT NULL, `status` varchar(20) NOT NULL, `conversation_id` varchar(100) NULL UNIQUE, `originator_conversation_id` varchar(100) NULL UNIQUE, `response_code` varchar(10) NULL, `response_description` text NULL, `result_code` varchar(10) NULL, `result_description` text NULL, `transaction_id` varchar(100) NULL UNIQUE, `created_at` datetime NOT NULL, `updated_at` datetime NOT NULL, `completed_at` datetime NULL, `student_id` bigint NOT NULL REFERENCES `accounts_student` (`id`) );

CREATE TABLE `finance_dailylimit` (`id` INT NOT NULL PRIMARY KEY AUTO_INCREMENT, `daily_amount` decimal NOT NULL, `phone_number` varchar(20) NOT NULL, `is_active` tinyint(1) NOT NULL, `disbursement_time` time NOT NULL, `remaining_today` decimal NOT NULL, `last_disbursement_date` date NULL, `created_at` datetime NOT NULL, `updated_at` datetime NOT NULL, `student_id` bigint NOT NULL UNIQUE REFERENCES `accounts_student` (`id`) );

CREATE TABLE `finance_dailydisbursement` (`id` INT NOT NULL PRIMARY KEY AUTO_INCREMENT, `amount` decimal NOT NULL, `phone_number` varchar(20) NOT NULL, `status` varchar(20) NOT NULL, `disbursement_date` date NOT NULL, `created_at` datetime NOT NULL, `updated_at` datetime NOT NULL, `completed_at` datetime NULL, `b2c_transaction_id` bigint NULL REFERENCES `finance_b2ctransaction` (`id`) , `student_id` bigint NOT NULL REFERENCES `accounts_student` (`id`) , `daily_limit_id` bigint NOT NULL REFERENCES `finance_dailylimit` (`id`) );

CREATE TABLE `finance_mpesatransaction` (`id` INT NOT NULL PRIMARY KEY AUTO_INCREMENT, `phone_number` varchar(20) NOT NULL, `amount` decimal NOT NULL, `mpesa_code` varchar(50) NOT NULL UNIQUE, `phone_number_initiator` varchar(20) NOT NULL, `status` varchar(20) NOT NULL, `transaction_id` varchar(100) NOT NULL UNIQUE, `reference` varchar(100) NOT NULL, `created_at` datetime NOT NULL, `updated_at` datetime NOT NULL, `completed_at` datetime NULL, `student_id` bigint NOT NULL REFERENCES `accounts_student` (`id`) );

CREATE TABLE `accounts_student` (`id` INT NOT NULL PRIMARY KEY AUTO_INCREMENT, `password` varchar(128) NOT NULL, `last_login` datetime NULL, `is_superuser` tinyint(1) NOT NULL, `username` varchar(150) NOT NULL UNIQUE, `first_name` varchar(150) NOT NULL, `last_name` varchar(150) NOT NULL, `email` varchar(254) NOT NULL, `is_staff` tinyint(1) NOT NULL, `is_active` tinyint(1) NOT NULL, `date_joined` datetime NOT NULL, `firebase_uid` varchar(255) NULL UNIQUE, `registration_number` varchar(50) NULL UNIQUE, `phone_number` varchar(20) NULL, `institution_name` varchar(255) NULL, `date_of_onboarding` datetime NOT NULL, `is_active_student` tinyint(1) NOT NULL, `has_completed_onboarding` tinyint(1) NOT NULL);

CREATE TABLE `finance_fundsource` (`id` INT NOT NULL PRIMARY KEY AUTO_INCREMENT, `source_type` varchar(20) NOT NULL, `amount` decimal NOT NULL, `frequency` varchar(20) NOT NULL, `description` text NULL, `is_active` tinyint(1) NOT NULL, `created_at` datetime NOT NULL, `updated_at` datetime NOT NULL, `student_id` bigint NOT NULL REFERENCES `accounts_student` (`id`) );

SET FOREIGN_KEY_CHECKS=1;
