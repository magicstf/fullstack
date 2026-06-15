-- 创建数据库（若不存在）
CREATE DATABASE IF NOT EXISTS `fullstack_chat`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `fullstack_chat`;

-- 会话表
CREATE TABLE IF NOT EXISTS `session` (
  `id` VARCHAR(64) NOT NULL COMMENT '会话ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会话表';

-- 消息表
CREATE TABLE IF NOT EXISTS `message` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '消息ID',
  `session_id` VARCHAR(64) NOT NULL COMMENT '关联会话',
  `role` VARCHAR(20) NOT NULL COMMENT '角色: user/assistant/system',
  `content` TEXT NOT NULL COMMENT '消息内容',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_message_session_id` (`session_id`),
  CONSTRAINT `fk_message_session`
    FOREIGN KEY (`session_id`) REFERENCES `session` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息表';
