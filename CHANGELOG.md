# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2024-11-23

### Added
- ✨ API Server (Node.js + Express + SQLite)
  - User authentication with JWT
  - Push token management
  - Secure API endpoints
  - Logging with Winston
  - Rate limiting
  - CORS support

- 📱 Mobile App (Expo React Native)
  - Login/Register screens
  - Home screen with notification history
  - Profile screen
  - Push notification integration
  - Automatic token registration
  - Local storage management

- 🔧 Zabbix Integration
  - Bash script for sending notifications
  - Support for multiple recipients
  - Chunking for large recipient lists
  - Error handling and logging

- 📚 Documentation
  - Installation guide
  - Quick start guide
  - API testing guide
  - Zabbix integration guide

### Security
- JWT authentication for mobile app
- API key authentication for Zabbix
- Password hashing with bcryptjs
- Rate limiting to prevent abuse
- Helmet.js for security headers

### Infrastructure
- SQLite database with proper indexing
- Automatic database initialization
- Log rotation support
- PM2 configuration for production
- Nginx reverse proxy configuration

## Future Releases

### [1.1.0] - Planned
- [ ] Push notification delivery status tracking
- [ ] Notification categories and priorities
- [ ] User groups management
- [ ] Web dashboard for monitoring
- [ ] Email notifications as backup
- [ ] Multiple language support

### [1.2.0] - Planned
- [ ] Notification scheduling
- [ ] Custom notification sounds
- [ ] Rich notifications with images
- [ ] Notification statistics
- [ ] Export/Import configuration
- [ ] Webhook support

### [2.0.0] - Future
- [ ] PostgreSQL/MySQL support
- [ ] Redis caching
- [ ] WebSocket for real-time updates
- [ ] Advanced analytics
- [ ] Multi-tenant support
- [ ] Mobile app for iOS/Android native
