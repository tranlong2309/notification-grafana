const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// Middleware xác thực API Key (cho Zabbix)
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.API_SECRET_KEY;

  if (!apiKey) {
    logger.warn('API request without API key');
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'API key is required' 
    });
  }

  if (apiKey !== expectedKey) {
    logger.warn(`Invalid API key attempt: ${apiKey.substring(0, 10)}...`);
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Invalid API key' 
    });
  }

  logger.debug('API key authenticated successfully');
  next();
};

// Middleware xác thực JWT Token (cho Mobile App)
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('JWT request without token');
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Authentication token is required' 
    });
  }

  const token = authHeader.substring(7); // Bỏ "Bearer "

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    logger.debug(`JWT authenticated for user: ${decoded.username}`);
    next();
  } catch (error) {
    logger.warn('Invalid JWT token:', error.message);
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Invalid or expired token' 
    });
  }
};

// Middleware tùy chọn: xác thực JWT hoặc bỏ qua nếu không có
const optionalJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    logger.debug(`Optional JWT authenticated for user: ${decoded.username}`);
  } catch (error) {
    logger.debug('Optional JWT verification failed:', error.message);
  }

  next();
};

module.exports = {
  authenticateApiKey,
  authenticateJWT,
  optionalJWT
};
