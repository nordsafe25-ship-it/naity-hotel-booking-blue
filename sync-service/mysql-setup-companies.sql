-- ═══════════════════════════════════════
-- MySQL Setup: Companies & Rooms for API Sync
-- Run this in phpMyAdmin on naitagfz_Naity_Booking
-- ═══════════════════════════════════════

-- 1. Companies table
CREATE TABLE IF NOT EXISTS companies (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    api_key    VARCHAR(100) UNIQUE NOT NULL,
    status     VARCHAR(20)  DEFAULT 'active',
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- 2. Insert ChamSoft
INSERT IGNORE INTO companies (name, api_key, status)
VALUES ('ChamSoft', 'sk_chamsoft_a3f9b1', 'active');

-- 3. Rooms table
CREATE TABLE IF NOT EXISTS rooms (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    HotelId             INT            NOT NULL,
    RoomId              INT            NOT NULL,
    Price               DECIMAL(10,2)  DEFAULT 0,
    Bed                 INT            DEFAULT 1,
    Status              VARCHAR(20)    DEFAULT 'Available',
    YesToDate           DATE           DEFAULT NULL,
    company_id          INT            DEFAULT NULL,
    synced_to_supabase  TINYINT        DEFAULT 0,
    created_at          TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- 4. Sync log table
CREATE TABLE IF NOT EXISTS sync_log (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    hotel_id   INT,
    room_id    INT,
    action     VARCHAR(50),
    status     VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
