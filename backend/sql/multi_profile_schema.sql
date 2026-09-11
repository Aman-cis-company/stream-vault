-- Multi-Profile & Kids Profile Schema Update SQL
-- StreamVault Database Enhancement

CREATE TABLE IF NOT EXISTS `user_profiles` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `avatar` VARCHAR(255) NOT NULL DEFAULT 'avatar_1',
  `profile_type` ENUM('adult', 'teen', 'kids') NOT NULL DEFAULT 'adult',
  `is_kids` TINYINT(1) NOT NULL DEFAULT 0,
  `max_rating` ENUM('G', 'PG', 'PG-13', '16+', '18+', '21+') NOT NULL DEFAULT '21+',
  `pin_hash` VARCHAR(255) NULL,
  `is_default` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_profiles_user_id` (`user_id`),
  CONSTRAINT `fk_user_profiles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add profile_id column to watch_history if not present
SET @dbname = DATABASE();
SET @tablename = "watch_history";
SET @columnname = "profile_id";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) > 0,
  "SELECT 1",
  "ALTER TABLE `watch_history` ADD COLUMN `profile_id` INT UNSIGNED NULL, ADD CONSTRAINT `fk_watch_history_profile` FOREIGN KEY (`profile_id`) REFERENCES `user_profiles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add profile_id column to user_interactions if not present
SET @tablename = "user_interactions";
SET @columnname = "profile_id";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) > 0,
  "SELECT 1",
  "ALTER TABLE `user_interactions` ADD COLUMN `profile_id` INT UNSIGNED NULL, ADD CONSTRAINT `fk_user_interactions_profile` FOREIGN KEY (`profile_id`) REFERENCES `user_profiles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
