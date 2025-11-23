require('dotenv').config();
const bcrypt = require('bcryptjs');
const dbManager = require('./config/database');
const logger = require('./utils/logger');

/**
 * Script để khởi tạo database và tạo user admin mặc định
 */
async function initDatabase() {
  try {
    logger.info('Initializing database...');
    
    // Khởi tạo database
    const db = dbManager.initialize();
    
    // Tạo admin user mặc định
    const defaultUsername = 'admin';
    const defaultPassword = 'admin123';
    
    // Kiểm tra xem admin đã tồn tại chưa
    const existingAdmin = db.prepare('SELECT * FROM Users WHERE username = ?').get(defaultUsername);
    
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash(defaultPassword, 10);
      
      const stmt = db.prepare(`
        INSERT INTO Users (username, password_hash, email, role)
        VALUES (?, ?, ?, ?)
      `);
      
      stmt.run(defaultUsername, passwordHash, 'admin@example.com', 'admin');
      
      logger.info('===============================================');
      logger.info('Default admin user created:');
      logger.info(`  Username: ${defaultUsername}`);
      logger.info(`  Password: ${defaultPassword}`);
      logger.info('  ⚠️  PLEASE CHANGE THE PASSWORD IMMEDIATELY!');
      logger.info('===============================================');
    } else {
      logger.info('Admin user already exists. Skipping creation.');
    }
    
    // Hiển thị thông tin database
    const userCount = db.prepare('SELECT COUNT(*) as count FROM Users').get();
    const tokenCount = db.prepare('SELECT COUNT(*) as count FROM PushTokens').get();
    
    logger.info('Database initialized successfully!');
    logger.info(`Total users: ${userCount.count}`);
    logger.info(`Total push tokens: ${tokenCount.count}`);
    
    dbManager.close();
    
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

// Chạy initialization
initDatabase();
