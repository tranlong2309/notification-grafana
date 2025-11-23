const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

class DatabaseManager {
  constructor() {
    this.db = null;
  }

  initialize() {
    try {
      const dbPath = process.env.DB_PATH || './data/database.sqlite';
      const dbDir = path.dirname(dbPath);

      // Tạo thư mục nếu chưa tồn tại
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
        logger.info(`Created database directory: ${dbDir}`);
      }

      // Khởi tạo database
      this.db = new Database(dbPath, { verbose: logger.debug });
      logger.info(`Database connected: ${dbPath}`);

      // Tạo bảng
      this.createTables();
      
      return this.db;
    } catch (error) {
      logger.error('Failed to initialize database:', error);
      throw error;
    }
  }

  createTables() {
    try {
      // Bảng lưu trữ Push Tokens
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS PushTokens (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL,
          token TEXT NOT NULL UNIQUE,
          device_info TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(username, token)
        )
      `);

      // Bảng lưu trữ Users (cho xác thực)
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS Users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          email TEXT,
          role TEXT DEFAULT 'admin',
          is_active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Bảng lưu trữ Notification History
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS NotificationHistory (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          recipients TEXT NOT NULL,
          subject TEXT NOT NULL,
          message TEXT NOT NULL,
          tokens_sent INTEGER DEFAULT 0,
          status TEXT DEFAULT 'pending',
          expo_response TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Index để tăng tốc độ truy vấn
      this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_pushtokens_username ON PushTokens(username);
        CREATE INDEX IF NOT EXISTS idx_pushtokens_token ON PushTokens(token);
        CREATE INDEX IF NOT EXISTS idx_users_username ON Users(username);
        CREATE INDEX IF NOT EXISTS idx_notification_history_created ON NotificationHistory(created_at);
      `);

      logger.info('Database tables created successfully');
    } catch (error) {
      logger.error('Failed to create tables:', error);
      throw error;
    }
  }

  getDatabase() {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  close() {
    if (this.db) {
      this.db.close();
      logger.info('Database connection closed');
    }
  }
}

// Singleton instance
const dbManager = new DatabaseManager();

module.exports = dbManager;
