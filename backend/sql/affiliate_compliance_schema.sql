-- Affiliate Program + 2257 Compliance Schema
-- Run after the existing StreamVault schema.

-- 1. Affiliate codes (one per user, auto-generated)
CREATE TABLE IF NOT EXISTS affiliate_codes (
  id           INT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id      INT UNSIGNED  NOT NULL UNIQUE,
  code         VARCHAR(60)   NOT NULL UNIQUE COMMENT 'e.g. sv-abc12345',
  total_clicks INT UNSIGNED  NOT NULL DEFAULT 0,
  created_at   DATETIME      NOT NULL,
  updated_at   DATETIME      NOT NULL,
  INDEX idx_ac_code (code),
  CONSTRAINT fk_ac_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Referral conversions (one per referred user)
CREATE TABLE IF NOT EXISTS referral_conversions (
  id                 INT UNSIGNED          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  affiliate_code_id  INT UNSIGNED          NOT NULL,
  referred_user_id   INT UNSIGNED          NOT NULL UNIQUE COMMENT 'A user can only be referred once',
  payment_id         INT UNSIGNED          NULL,
  commission_amount  DECIMAL(10,2)         NOT NULL DEFAULT 0.00,
  commission_rate    DECIMAL(5,4)          NOT NULL DEFAULT 0.1000,
  status             ENUM('pending','confirmed','paid') NOT NULL DEFAULT 'pending',
  created_at         DATETIME              NOT NULL,
  updated_at         DATETIME              NOT NULL,
  INDEX idx_rc_code (affiliate_code_id),
  INDEX idx_rc_status (status),
  CONSTRAINT fk_rc_code FOREIGN KEY (affiliate_code_id) REFERENCES affiliate_codes (id) ON DELETE CASCADE,
  CONSTRAINT fk_rc_user FOREIGN KEY (referred_user_id)  REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_rc_payment FOREIGN KEY (payment_id)     REFERENCES payments (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Content compliance records (§ 2257 performer records)
CREATE TABLE IF NOT EXISTS content_compliance_records (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  movie_id          INT UNSIGNED NULL,
  episode_id        INT UNSIGNED NULL,
  performer_name    VARCHAR(255) NOT NULL,
  stage_names       TEXT         NULL COMMENT 'Comma-separated aliases',
  date_of_birth     DATE         NOT NULL,
  id_document_type  VARCHAR(100) NOT NULL COMMENT 'e.g. Passport, Aadhaar, Driver License',
  id_document_ref   VARCHAR(255) NOT NULL COMMENT 'Document reference/number',
  verified_by       VARCHAR(255) NOT NULL COMMENT 'Name of verifying staff member',
  verified_at       DATETIME     NOT NULL,
  custodian_name    VARCHAR(255) NOT NULL,
  custodian_address TEXT         NOT NULL,
  notes             TEXT         NULL,
  created_at        DATETIME     NOT NULL,
  updated_at        DATETIME     NOT NULL,
  INDEX idx_ccr_movie   (movie_id),
  INDEX idx_ccr_episode (episode_id),
  CONSTRAINT fk_ccr_movie   FOREIGN KEY (movie_id)   REFERENCES movies   (id) ON DELETE SET NULL,
  CONSTRAINT fk_ccr_episode FOREIGN KEY (episode_id) REFERENCES episodes (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
