# ⚡ Start Here - Quick Reference

## 🚀 Khởi Động Nhanh (< 2 phút)

### API Server (✅ ĐÃ CHẠY)

```bash
cd api-server
npm start
```

**Test:** http://localhost:3000/health

### Mobile App

```bash
cd mobile-app
npm install          # Lần đầu
npx expo start       # Quét QR code
```

### Management Tool

```bash
./manage.sh          # Interactive menu
```

## 🔑 Thông Tin Đăng Nhập

**Admin Account:**
- Username: `admin`
- Password: `admin123`

**API Keys (trong .env):**
- API_SECRET_KEY: `your-secret-api-key-change-this-in-production`
- JWT_SECRET: `your-jwt-secret-change-this-in-production`

## 📱 Cấu Hình Mobile App

**Bước 1:** Update API URL
```javascript
// mobile-app/src/services/api.js
const API_URL = 'http://localhost:3000';  // Hoặc IP của máy
```

**Bước 2:** Expo Project Setup
1. Tạo account: https://expo.dev
2. Tạo project và copy Project ID
3. Update `app.json` và `src/services/notification.js`

**Bước 3:** Chạy
```bash
cd mobile-app
npm install
npx expo start
```

## 🔧 Test API

```bash
# Health Check
curl http://localhost:3000/health

# Login
curl -X POST http://localhost:3000/api/auth/login-auth \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## 🗄️ Database

**Location:** `api-server/data/database.sqlite`

**View:**
```bash
cd api-server
sqlite3 data/database.sqlite "SELECT * FROM Users;"
```

## 📊 Status Check

```bash
# Server running?
curl -s http://localhost:3000/health

# View logs
tail -f api-server/logs/combined.log

# View users
cd api-server && sqlite3 data/database.sqlite "SELECT username FROM Users;"
```

## 🛠️ Commands

| Action | Command |
|--------|---------|
| Start API | `cd api-server && npm start` |
| Stop API | `pkill -f "node.*server.js"` |
| Start Mobile | `cd mobile-app && npx expo start` |
| View Logs | `tail -f api-server/logs/combined.log` |
| Backup DB | `cp api-server/data/database.sqlite backup.sqlite` |
| Reset DB | `cd api-server && npm run init-db` |

## 📚 Docs

- [README.md](README.md) - Tổng quan
- [QUICKSTART.md](QUICKSTART.md) - Bắt đầu chi tiết
- [INSTALLATION.md](INSTALLATION.md) - Cài đặt đầy đủ
- [API_TESTING.md](API_TESTING.md) - Test API
- [PROJECT_COMPLETE.md](PROJECT_COMPLETE.md) - Tổng kết

## ⚠️ Important

1. Đổi password admin ngay!
2. Đổi API keys trong `.env` trước production
3. Backup database định kỳ
4. Sử dụng HTTPS trong production

## 🆘 Problems?

**API không chạy:**
```bash
cd api-server
npm install
npm start
```

**Port 3000 bị chiếm:**
```bash
# Trong .env
PORT=3001
```

**Mobile không connect:**
- Dùng IP thay localhost: `http://192.168.1.xxx:3000`
- Check firewall
- Check CORS trong .env

## ✅ Next Steps

1. [ ] Đổi password admin
2. [ ] Cài mobile app dependencies
3. [ ] Config Expo project
4. [ ] Test login trên mobile
5. [ ] Setup Zabbix integration
6. [ ] Deploy to production

---

**Need help?** Read [QUICKSTART.md](QUICKSTART.md) for detailed guide.
