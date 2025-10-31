-- CreatorChain MySQL 数据库初始化脚本

-- 创建数据库
CREATE DATABASE IF NOT EXISTS creatorchain CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE creatorchain;

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    address VARCHAR(42) NOT NULL UNIQUE,
    username VARCHAR(50),
    email VARCHAR(100),
    encrypted_email VARCHAR(500),
    avatar_url TEXT,
    bio TEXT,
    points BIGINT DEFAULT 1000,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP NULL,
    login_count BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_address (address),
    INDEX idx_email (email),
    INDEX idx_deleted_at (deleted_at)
);

-- 创建创作表
CREATE TABLE IF NOT EXISTS creations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    token_id BIGINT NOT NULL UNIQUE,
    creator_address VARCHAR(42) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    content_hash VARCHAR(64) NOT NULL,
    metadata_hash VARCHAR(64) NOT NULL,
    ai_model VARCHAR(100),
    prompt_text TEXT,
    contribution_score INT,
    price_in_points BIGINT,
    is_listed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_token_id (token_id),
    INDEX idx_creator_address (creator_address),
    INDEX idx_is_listed (is_listed),
    INDEX idx_deleted_at (deleted_at)
);

-- 创建交易表
CREATE TABLE IF NOT EXISTS transactions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tx_hash VARCHAR(66) NOT NULL UNIQUE,
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42) NOT NULL,
    token_id BIGINT NULL,
    amount VARCHAR(255),
    tx_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    block_number BIGINT NULL,
    gas_used BIGINT NULL,
    gas_price VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_tx_hash (tx_hash),
    INDEX idx_from_address (from_address),
    INDEX idx_to_address (to_address),
    INDEX idx_token_id (token_id),
    INDEX idx_status (status),
    INDEX idx_deleted_at (deleted_at)
);

-- 创建积分交易表
CREATE TABLE IF NOT EXISTS points_transactions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    from_address VARCHAR(42),
    to_address VARCHAR(42) NOT NULL,
    amount BIGINT NOT NULL,
    type VARCHAR(20) NOT NULL,
    description TEXT,
    creation_id BIGINT UNSIGNED NULL,
    tx_hash VARCHAR(66),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_from_address (from_address),
    INDEX idx_to_address (to_address),
    INDEX idx_type (type),
    INDEX idx_creation_id (creation_id),
    INDEX idx_deleted_at (deleted_at)
);

-- 创建用户收藏关联表
CREATE TABLE IF NOT EXISTS user_favorites (
    user_id BIGINT UNSIGNED NOT NULL,
    creation_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, creation_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (creation_id) REFERENCES creations(id) ON DELETE CASCADE
);

-- 插入示例数据
INSERT IGNORE INTO users (address, username, email, points) VALUES 
('0x1234567890123456789012345678901234567890', 'testuser', 'test@example.com', 1000);

-- 显示创建的表
SHOW TABLES;
