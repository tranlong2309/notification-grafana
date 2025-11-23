require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const dbManager = require('./config/database');

// Routes
const authRoutes = require('./routes/auth');
const tokenRoutes = require('./routes/tokens');

// Khởi tạo Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware bảo mật
app.use(helmet());

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:19006', 'http://localhost:8081'];

app.use(cors({
  origin: function(origin, callback) {
    // Cho phép requests không có origin (như mobile apps, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat, {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tokens', tokenRoutes);

// Legacy endpoints (để tương thích với yêu cầu ban đầu)
app.post('/login', require('./middleware/auth').authenticateJWT, (req, res, next) => {
  req.body.token = req.body.token || req.body.pushToken;
  next();
}, require('./routes/tokens').stack.find(r => r.route && r.route.path === '/login').route.stack[0].handle);

app.post('/logout', require('./middleware/auth').authenticateJWT, (req, res, next) => {
  req.body.token = req.body.token || req.body.pushToken;
  next();
}, require('./routes/tokens').stack.find(r => r.route && r.route.path === '/logout').route.stack[0].handle);

app.get('/get-tokens-for-users', require('./middleware/auth').authenticateApiKey, require('./routes/tokens').stack.find(r => r.route && r.route.path === '/get-tokens-for-users').route.stack[0].handle);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: 'The requested endpoint does not exist'
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  
  res.status(err.status || 500).json({ 
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred'
  });
});

// Khởi tạo database và start server
try {
  dbManager.initialize();
  
  const server = app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`Database: ${process.env.DB_PATH || './data/database.sqlite'}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      logger.info('HTTP server closed');
      dbManager.close();
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT signal received: closing HTTP server');
    server.close(() => {
      logger.info('HTTP server closed');
      dbManager.close();
      process.exit(0);
    });
  });

} catch (error) {
  logger.error('Failed to start server:', error);
  process.exit(1);
}

module.exports = app;
