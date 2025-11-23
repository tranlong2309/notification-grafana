const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const dbManager = require('../config/database');

const router = express.Router();

/**
 * POST /api/auth/register
 * Đăng ký user mới (chỉ dùng để setup ban đầu)
 */
router.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Username and password are required' 
      });
    }

    const db = dbManager.getDatabase();

    // Kiểm tra username đã tồn tại
    const existingUser = db.prepare('SELECT * FROM Users WHERE username = ?').get(username);
    if (existingUser) {
      return res.status(409).json({ 
        error: 'Conflict',
        message: 'Username already exists' 
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Thêm user vào database
    const stmt = db.prepare(`
      INSERT INTO Users (username, password_hash, email)
      VALUES (?, ?, ?)
    `);
    
    const result = stmt.run(username, passwordHash, email || null);

    logger.info(`New user registered: ${username}`);

    res.status(201).json({ 
      message: 'User registered successfully',
      userId: result.lastInsertRowid
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to register user' 
    });
  }
});

/**
 * POST /api/auth/login
 * Đăng nhập và nhận JWT token
 */
router.post('/login-auth', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Username and password are required' 
      });
    }

    const db = dbManager.getDatabase();

    // Tìm user
    const user = db.prepare('SELECT * FROM Users WHERE username = ? AND is_active = 1').get(username);
    
    if (!user) {
      logger.warn(`Login attempt for non-existent user: ${username}`);
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid username or password' 
      });
    }

    // Kiểm tra password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      logger.warn(`Failed login attempt for user: ${username}`);
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid username or password' 
      });
    }

    // Tạo JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    logger.info(`User logged in successfully: ${username}`);

    res.json({ 
      message: 'Login successful',
      token,
      user: {
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to login' 
    });
  }
});

module.exports = router;
