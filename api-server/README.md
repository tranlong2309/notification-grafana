# API Server - Zabbix Notifi

Backend API server cho hệ thống thông báo Zabbix.

## Công Nghệ

- Node.js + Express.js
- SQLite database
- JWT authentication
- Winston logging
- Helmet.js security

## Cài Đặt

```bash
npm install
cp .env.example .env
npm run init-db
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký user
- `POST /api/auth/login-auth` - Đăng nhập

### Token Management
- `POST /api/tokens/login` - Đăng ký push token
- `POST /api/tokens/logout` - Hủy push token
- `GET /api/tokens/get-tokens-for-users` - Lấy tokens (Zabbix)
- `GET /api/tokens/my-tokens` - Xem tokens của mình

### Health
- `GET /health` - Health check

## Environment Variables

```env
PORT=3000
NODE_ENV=production
API_SECRET_KEY=your-secret-key
JWT_SECRET=your-jwt-secret
DB_PATH=./data/database.sqlite
LOG_DIR=./logs
```

## Database Schema

### Users Table
- id (INTEGER PRIMARY KEY)
- username (TEXT UNIQUE)
- password_hash (TEXT)
- email (TEXT)
- role (TEXT)
- is_active (INTEGER)
- created_at (DATETIME)
- updated_at (DATETIME)

### PushTokens Table
- id (INTEGER PRIMARY KEY)
- username (TEXT)
- token (TEXT UNIQUE)
- device_info (TEXT)
- created_at (DATETIME)
- updated_at (DATETIME)

### NotificationHistory Table
- id (INTEGER PRIMARY KEY)
- recipients (TEXT)
- subject (TEXT)
- message (TEXT)
- tokens_sent (INTEGER)
- status (TEXT)
- expo_response (TEXT)
- created_at (DATETIME)

## Logging

Logs được lưu trong `logs/`:
- `combined.log` - Tất cả logs
- `error.log` - Chỉ errors

## Security

- JWT tokens với expiry
- Password hashing với bcryptjs
- API key authentication cho Zabbix
- Rate limiting
- Helmet.js security headers
- CORS configuration

## Production Deployment

### Với PM2

```bash
npm install -g pm2
pm2 start ecosystem.config.json
pm2 save
pm2 startup
```

### Với systemd

Tạo file `/etc/systemd/system/zabbix-notifi.service`:

```ini
[Unit]
Description=Zabbix Notifi API Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/api-server
ExecStart=/usr/bin/node src/server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Enable và start:
```bash
sudo systemctl enable zabbix-notifi
sudo systemctl start zabbix-notifi
```

## Maintenance

### Backup Database

```bash
cp data/database.sqlite data/backup-$(date +%Y%m%d).sqlite
```

### View Database

```bash
sqlite3 data/database.sqlite
.tables
SELECT * FROM Users;
```

### Clear Old Tokens

```bash
curl -X DELETE "http://localhost:3000/api/tokens/cleanup?days=30" \
  -H "x-api-key: YOUR_API_KEY"
```

## Troubleshooting

### Port Already in Use

```bash
lsof -i :3000
kill -9 <PID>
```

### Database Locked

```bash
# Stop all processes using the database
fuser -k data/database.sqlite
```

### Reset Database

```bash
rm data/database.sqlite
npm run init-db
```
