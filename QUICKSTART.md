# Quick Start Guide

## Bắt đầu nhanh trong 5 phút

### Bước 1: Khởi động API Server ✅

API Server đã được khởi động thành công tại `http://localhost:3000`

**Thông tin đăng nhập mặc định:**
- Username: `admin`
- Password: `admin123`

⚠️ **LƯU Ý:** Hãy đổi password ngay lập tức!

### Bước 2: Cài đặt Mobile App

```bash
cd mobile-app
npm install
```

**Cấu hình API URL:**

Mở `mobile-app/src/services/api.js` và kiểm tra:
```javascript
const API_URL = 'http://localhost:3000';
```

**Cấu hình Expo Project:**

1. Đăng ký tài khoản tại: https://expo.dev
2. Tạo project mới
3. Copy Project ID
4. Mở `mobile-app/app.json` và thay `your-project-id`
5. Mở `mobile-app/src/services/notification.js` và thay `your-project-id`

**Chạy app:**
```bash
npx expo start
```

Quét QR code bằng Expo Go app trên điện thoại.

### Bước 3: Test hệ thống

**Test API bằng curl:**

```bash
# 1. Health check
curl http://localhost:3000/health

# 2. Đăng ký push token (KHÔNG cần authentication)
curl -X POST http://localhost:3000/api/tokens/login \
  -H "Content-Type: application/json" \
  -d '{
    "username":"testuser",
    "token":"ExponentPushToken[test-token-123]"
  }'

# 3. Lấy tokens của user
curl -X GET "http://localhost:3000/api/tokens/my-tokens?username=testuser"

# 4. Lấy tokens cho users (dành cho Zabbix)
curl -X GET "http://localhost:3000/api/tokens/get-tokens-for-users?users=testuser" \
  -H "x-api-key: your-secret-api-key-change-this-in-production"
```

### Bước 4: Tích hợp Zabbix

**Copy script:**
```bash
sudo cp zabbix-scripts/zabbix_to_expo.sh /usr/lib/zabbix/alertscripts/
sudo chmod +x /usr/lib/zabbix/alertscripts/zabbix_to_expo.sh
```

**Cấu hình script:**

Mở `/usr/lib/zabbix/alertscripts/zabbix_to_expo.sh` và chỉnh sửa:
```bash
API_SERVER_URL="http://localhost:3000"
API_SECRET_KEY="your-secret-api-key-change-this-in-production"
```

**Test script:**
```bash
sudo -u zabbix /usr/lib/zabbix/alertscripts/zabbix_to_expo.sh \
  "admin" \
  "Test Alert" \
  "This is a test"
```

### Kiểm tra log:

```bash
# API Server logs
tail -f api-server/logs/combined.log

# Zabbix script logs
sudo tail -f /var/log/zabbix/expo_push.log
```

---

## Luồng hoạt động hoàn chỉnh

### 📱 Luồng 1: Admin Đăng nhập

1. Admin mở mobile app
2. Nhập username/password: `admin` / `admin123`
3. App tự động lấy ExpoPushToken
4. Token được gửi về API server
5. Server lưu token vào database

**Kiểm tra:**
```bash
sqlite3 api-server/data/database.sqlite "SELECT * FROM PushTokens;"
```

### 🔔 Luồng 2: Nhận Thông báo

1. Zabbix trigger được kích hoạt
2. Zabbix gọi script `zabbix_to_expo.sh`
3. Script lấy danh sách tokens từ API
4. Gửi notification qua Expo Push Service
5. Admin nhận thông báo trên điện thoại

### 🚪 Luồng 3: Đăng xuất

1. Admin bấm "Đăng xuất" trong app
2. Token bị xóa khỏi database
3. Không còn nhận thông báo

---

## Cấu trúc Dự án

```
ReactNative_Notifi/
├── api-server/              # Node.js API Server
│   ├── src/
│   │   ├── config/          # Database config
│   │   ├── middleware/      # Auth middleware
│   │   ├── routes/          # API routes
│   │   ├── utils/           # Logger, helpers
│   │   ├── server.js        # Main server
│   │   └── init-db.js       # DB initialization
│   ├── data/                # SQLite database
│   ├── logs/                # Log files
│   ├── package.json
│   └── .env                 # Configuration
│
├── mobile-app/              # Expo React Native App
│   ├── src/
│   │   ├── contexts/        # Auth context
│   │   ├── navigation/      # Navigation
│   │   ├── screens/         # Screens (Login, Home, Profile)
│   │   └── services/        # API, Storage, Notification services
│   ├── App.js
│   ├── app.json             # Expo config
│   └── package.json
│
├── zabbix-scripts/          # Zabbix integration
│   ├── zabbix_to_expo.sh    # Main script
│   └── README.md
│
├── README.md                # Main documentation
├── INSTALLATION.md          # Detailed installation guide
├── API_TESTING.md           # API testing guide
└── QUICKSTART.md           # This file
```

---

## Troubleshooting

### 1. API Server không khởi động

```bash
# Kiểm tra port 3000 có bị chiếm không
lsof -i :3000

# Đổi port trong .env
PORT=3001
```

### 2. Mobile app không kết nối được

- Đảm bảo API_URL đúng
- Nếu dùng thiết bị thật, dùng IP thay vì localhost:
  ```javascript
  const API_URL = 'http://192.168.1.100:3000';
  ```

### 3. Không nhận được notification

- Chỉ hoạt động trên thiết bị thật
- Kiểm tra quyền notification
- Kiểm tra token đã được đăng ký:
  ```bash
  curl -H "Authorization: Bearer TOKEN" \
    http://localhost:3000/api/tokens/my-tokens
  ```

---

## Các Lệnh Hữu ích

### API Server

```bash
# Khởi động dev mode
npm run dev

# Khởi động production
npm start

# Khởi tạo lại database
npm run init-db

# Xem logs
tail -f logs/combined.log
```

### Mobile App

```bash
# Khởi động Expo
npx expo start

# Chạy trên iOS simulator
npx expo start --ios

# Chạy trên Android emulator
npx expo start --android

# Clear cache
npx expo start -c
```

### Database

```bash
# Mở database
sqlite3 api-server/data/database.sqlite

# Xem users
sqlite3 api-server/data/database.sqlite "SELECT * FROM Users;"

# Xem push tokens
sqlite3 api-server/data/database.sqlite "SELECT * FROM PushTokens;"

# Xem notification history
sqlite3 api-server/data/database.sqlite "SELECT * FROM NotificationHistory;"
```

---

## Tiếp theo?

1. **Đổi password admin:**
   - Đăng nhập vào app
   - Hoặc tạo user mới qua API

2. **Cấu hình Zabbix:**
   - Tạo Media Type
   - Thêm Media cho Users
   - Tạo Actions

3. **Deploy lên Production:**
   - Cấu hình domain
   - Cài đặt SSL
   - Sử dụng PM2 cho API server
   - Build mobile app với EAS

4. **Bảo mật:**
   - Đổi API_SECRET_KEY
   - Đổi JWT_SECRET
   - Cấu hình firewall
   - Enable HTTPS

---

## Tài liệu tham khảo

- [Installation Guide](INSTALLATION.md) - Hướng dẫn cài đặt chi tiết
- [API Testing](API_TESTING.md) - Hướng dẫn test API
- [Zabbix Integration](zabbix-scripts/README.md) - Tích hợp Zabbix

---

**Chúc bạn thành công! 🎉**

Nếu gặp vấn đề, hãy kiểm tra logs và phần Troubleshooting.
