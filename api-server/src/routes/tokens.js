const express = require('express');
const logger = require('../utils/logger');
const dbManager = require('../config/database');
const { authenticateJWT, authenticateApiKey } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/tokens/login
 * Đăng ký ExpoPushToken cho user (từ mobile app)
 * Luồng 1: Admin Đăng nhập và Đăng ký Thiết bị
 */
router.post('/login', authenticateJWT, (req, res) => {
  try {
    const { token, deviceInfo } = req.body;
    const username = req.user.username; // Lấy từ JWT

    if (!token) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Push token is required' 
      });
    }

    // Validate Expo push token format
    if (!token.startsWith('ExponentPushToken[') && !token.startsWith('ExpoPushToken[')) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Invalid Expo push token format' 
      });
    }

    const db = dbManager.getDatabase();

    // Bước 1: Dọn dẹp - Xóa token này nếu đã được gán cho user khác
    const deleteStmt = db.prepare('DELETE FROM PushTokens WHERE token = ? AND username != ?');
    const deleteResult = deleteStmt.run(token, username);
    
    if (deleteResult.changes > 0) {
      logger.info(`Removed token from previous user assignment: ${token}`);
    }

    // Bước 2: Thêm hoặc cập nhật token cho user hiện tại
    const upsertStmt = db.prepare(`
      INSERT INTO PushTokens (username, token, device_info, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(username, token) 
      DO UPDATE SET 
        device_info = excluded.device_info,
        updated_at = CURRENT_TIMESTAMP
    `);

    upsertStmt.run(username, token, deviceInfo ? JSON.stringify(deviceInfo) : null);

    logger.info(`[INFO] Registered new token for user '${username}'`);

    res.status(201).json({ 
      message: 'Push token registered successfully',
      username,
      token
    });
  } catch (error) {
    logger.error('Token registration error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to register push token' 
    });
  }
});

/**
 * POST /api/tokens/logout
 * Hủy đăng ký ExpoPushToken (từ mobile app)
 * Luồng 3: Admin Đăng xuất
 */
router.post('/logout', authenticateJWT, (req, res) => {
  try {
    const { token } = req.body;
    const username = req.user.username;

    if (!token) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Push token is required' 
      });
    }

    const db = dbManager.getDatabase();

    // Xóa token của user này
    const stmt = db.prepare('DELETE FROM PushTokens WHERE token = ? AND username = ?');
    const result = stmt.run(token, username);

    if (result.changes > 0) {
      logger.info(`[INFO] Deregistered token for user '${username}': ${token}`);
      res.json({ 
        message: 'Push token deregistered successfully' 
      });
    } else {
      logger.warn(`Logout attempt with non-existent token for user '${username}'`);
      res.status(404).json({ 
        error: 'Not Found',
        message: 'Token not found for this user' 
      });
    }
  } catch (error) {
    logger.error('Token deregistration error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to deregister push token' 
    });
  }
});

/**
 * GET /api/tokens/get-tokens-for-users
 * Lấy danh sách tokens cho các users (từ Zabbix script)
 * Luồng 2: Zabbix Kích hoạt và Gửi Cảnh báo
 */
router.get('/get-tokens-for-users', authenticateApiKey, (req, res) => {
  try {
    const { users } = req.query;

    if (!users) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Users parameter is required' 
      });
    }

    // Parse danh sách users
    const userList = users.split(',').map(u => u.trim()).filter(u => u);

    if (userList.length === 0) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'At least one user is required' 
      });
    }

    const db = dbManager.getDatabase();

    // Tạo placeholders cho SQL IN clause
    const placeholders = userList.map(() => '?').join(',');
    const query = `SELECT token FROM PushTokens WHERE username IN (${placeholders})`;
    
    const stmt = db.prepare(query);
    const tokens = stmt.all(...userList);

    if (tokens.length === 0) {
      logger.warn(`No tokens found for users: ${users}`);
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'No tokens found for specified users' 
      });
    }

    // Trả về danh sách tokens, mỗi token trên một dòng
    const tokenList = tokens.map(row => row.token).join('\n');
    
    logger.info(`Retrieved ${tokens.length} tokens for users: ${users}`);

    res.type('text/plain').send(tokenList);
  } catch (error) {
    logger.error('Token retrieval error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to retrieve tokens' 
    });
  }
});

/**
 * GET /api/tokens/my-tokens
 * Lấy danh sách tokens của user hiện tại (từ mobile app)
 */
router.get('/my-tokens', authenticateJWT, (req, res) => {
  try {
    const username = req.user.username;
    const db = dbManager.getDatabase();

    const stmt = db.prepare(`
      SELECT token, device_info, created_at, updated_at 
      FROM PushTokens 
      WHERE username = ?
      ORDER BY updated_at DESC
    `);
    
    const tokens = stmt.all(username);

    res.json({ 
      username,
      tokens: tokens.map(t => ({
        token: t.token,
        deviceInfo: t.device_info ? JSON.parse(t.device_info) : null,
        createdAt: t.created_at,
        updatedAt: t.updated_at
      }))
    });
  } catch (error) {
    logger.error('My tokens retrieval error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to retrieve tokens' 
    });
  }
});

/**
 * DELETE /api/tokens/cleanup
 * Xóa tokens cũ không hoạt động (admin endpoint)
 */
router.delete('/cleanup', authenticateApiKey, (req, res) => {
  try {
    const { days = 30 } = req.query;
    const db = dbManager.getDatabase();

    const stmt = db.prepare(`
      DELETE FROM PushTokens 
      WHERE updated_at < datetime('now', '-' || ? || ' days')
    `);
    
    const result = stmt.run(days);

    logger.info(`Cleaned up ${result.changes} old tokens (older than ${days} days)`);

    res.json({ 
      message: 'Cleanup completed',
      tokensRemoved: result.changes
    });
  } catch (error) {
    logger.error('Token cleanup error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to cleanup tokens' 
    });
  }
});

module.exports = router;
