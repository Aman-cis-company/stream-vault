-- Age Restriction Content Management System — SQL Schema
-- Run after the existing StreamVault schema.

-- 1. Add age fields to users
ALTER TABLE users
  ADD COLUMN date_of_birth DATE NULL AFTER reset_token_expiry,
  ADD COLUMN age_verified TINYINT(1) NOT NULL DEFAULT 0 AFTER date_of_birth,
  ADD COLUMN verified_at DATETIME NULL AFTER age_verified;

-- 2. Add age fields to categories
ALTER TABLE categories
  ADD COLUMN is_age_restricted TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN minimum_age TINYINT UNSIGNED NULL COMMENT 'Minimum age in years';

-- 3. Add age + language fields to movies
ALTER TABLE movies
  ADD COLUMN language VARCHAR(100) NULL,
  ADD COLUMN content_rating ENUM('G','PG','PG-13','16+','18+','21+') NULL,
  ADD COLUMN is_age_restricted TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN minimum_age TINYINT UNSIGNED NULL COMMENT 'Minimum age in years',
  ADD COLUMN warning_flags_json JSON NULL COMMENT 'Array: violence, strong_language, mature_themes, nudity';

-- 4. Create user_age_verifications table
CREATE TABLE IF NOT EXISTS user_age_verifications (
  id           INT UNSIGNED      NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id      INT UNSIGNED      NOT NULL,
  date_of_birth DATE             NOT NULL,
  verified_age TINYINT UNSIGNED  NOT NULL COMMENT 'Age at time of verification',
  ip_address   VARCHAR(45)       NULL,
  user_agent   VARCHAR(500)      NULL,
  created_at   DATETIME          NOT NULL,
  updated_at   DATETIME          NOT NULL,
  INDEX idx_uav_user (user_id),
  CONSTRAINT fk_uav_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Create parental_controls table
CREATE TABLE IF NOT EXISTS parental_controls (
  id                      INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id                 INT UNSIGNED NOT NULL UNIQUE,
  pin_enabled             TINYINT(1)   NOT NULL DEFAULT 0,
  pin_hash                VARCHAR(255) NULL,
  hide_restricted_content TINYINT(1)   NOT NULL DEFAULT 0,
  max_rating              ENUM('G','PG','PG-13','16+','18+','21+') NULL COMMENT 'NULL = no restriction',
  created_at              DATETIME     NOT NULL,
  updated_at              DATETIME     NOT NULL,
  INDEX idx_pc_user (user_id),
  CONSTRAINT fk_pc_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
