# Hướng Dẫn Cài Đặt Hoàn Chỉnh

## Mục lục

1. [Cài đặt API Server](#1-cài-đặt-api-server)
2. [Cài đặt Mobile App](#2-cài-đặt-mobile-app)
3. [Cài đặt Zabbix Integration](#3-cài-đặt-zabbix-integration)
4. [Test hệ thống](#4-test-hệ-thống)

---

## 1. Cài đặt API Server

### Yêu cầu
- Node.js >= 16.x
- npm hoặc yarn

### Các bước

#### Bước 1: Cài đặt dependencies

```bash
cd api-server
npm install
```

#### Bước 2: Cấu hình môi trường

```bash
cp .env.example .env
```

Chỉnh sửa file `.env`:

```env
PORT=3000
NODE_ENV=production

# Thay đổi các giá trị này!
API_SECRET_KEY=your-very-secure-api-key-here
JWT_SECRET=your-very-secure-jwt-secret-here

DB_PATH=./data/database.sqlite
LOG_DIR=./logs

# Nếu chạy trên server public
ALLOWED_ORIGINS=http://localhost:19006,http://localhost:8081,https://your-domain.com
```

#### Bước 3: Khởi tạo database

```bash
npm run init-db
```

Output sẽ hiển thị:
```
===============================================
Default admin user created:
  Username: admin
  Password: admin123
  ⚠️  PLEASE CHANGE THE PASSWORD IMMEDIATELY!
===============================================
```

#### Bước 4: Khởi động server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Server sẽ chạy tại: `http://localhost:3000`

#### Bước 5: Chạy server bằng PM2 (Production)

```bash
# Cài đặt PM2
npm install -g pm2

# Khởi động server
pm2 start src/server.js --name zabbix-notifi-api

# Lưu cấu hình
pm2 save

# Tự động khởi động khi reboot
pm2 startup
```

#### Bước 6: Cấu hình Nginx Reverse Proxy (Optional)

Tạo file `/etc/nginx/sites-available/zabbix-notifi`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/zabbix-notifi /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Cài đặt SSL với Let's Encrypt:
```bash
sudo certbot --nginx -d your-domain.com
```

---

## 2. Cài đặt Mobile App

### Yêu cầu
- Node.js >= 16.x
- Expo CLI
- Điện thoại có app Expo Go (cho development)

### Các bước

#### Bước 1: Cài đặt dependencies

```bash
cd mobile-app
npm install
```

#### Bước 2: Cài đặt Expo CLI

```bash
npm install -g expo-cli
```

#### Bước 3: Cấu hình API URL

Mở `src/services/api.js` và thay đổi:

```javascript
const API_URL = 'https://your-domain.com'; // URL của API server
```

#### Bước 4: Tạo Expo Project

1. Đăng ký tài khoản tại: https://expo.dev
2. Tạo project mới
3. Copy Project ID
4. Mở `app.json` và thay đổi:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "your-expo-project-id-here"
      }
    }
  }
}
```

5. Mở `src/services/notification.js` và thay đổi:

```javascript
token = (await Notifications.getExpoPushTokenAsync({
  projectId: 'your-expo-project-id-here',
})).data;
```

#### Bước 5: Chạy app (Development)

```bash
npx expo start
```

Quét QR code bằng:
- **iOS**: Camera app
- **Android**: Expo Go app

#### Bước 6: Build app (Production)

**Cài đặt EAS CLI:**
```bash
npm install -g eas-cli
```

**Login:**
```bash
eas login
```

**Cấu hình build:**
```bash
eas build:configure
```

**Build Android APK:**
```bash
eas build --platform android --profile production
```

**Build iOS:**
```bash
eas build --platform ios --profile production
```

---

## 3. Cài đặt Zabbix Integration

### Yêu cầu
- Zabbix Server >= 5.0
- curl
- jq

### Các bước

#### Bước 1: Cài đặt dependencies

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install curl jq

# CentOS/RHEL
sudo yum install curl jq
```

#### Bước 2: Copy script

```bash
sudo cp zabbix-scripts/zabbix_to_expo.sh /usr/lib/zabbix/alertscripts/
sudo chmod +x /usr/lib/zabbix/alertscripts/zabbix_to_expo.sh
sudo chown zabbix:zabbix /usr/lib/zabbix/alertscripts/zabbix_to_expo.sh
```

#### Bước 3: Cấu hình script

Mở `/usr/lib/zabbix/alertscripts/zabbix_to_expo.sh` và chỉnh sửa:

```bash
API_SERVER_URL="https://your-domain.com"
API_SECRET_KEY="your-api-secret-key"
```

#### Bước 4: Tạo log directory

```bash
sudo mkdir -p /var/log/zabbix
sudo chown zabbix:zabbix /var/log/zabbix
sudo chmod 755 /var/log/zabbix
```

#### Bước 5: Test script

```bash
sudo -u zabbix /usr/lib/zabbix/alertscripts/zabbix_to_expo.sh \
  "admin" \
  "Test Alert" \
  "This is a test notification from Zabbix"
```

Kiểm tra log:
```bash
sudo tail -f /var/log/zabbix/expo_push.log
```

#### Bước 6: Cấu hình Zabbix

**A. Tạo Media Type:**

1. Vào **Administration** → **Media types**
2. Click **Create media type**
3. Cấu hình:
   - **Name**: `Expo Push Notification`
   - **Type**: `Script`
   - **Script name**: `zabbix_to_expo.sh`
   - **Script parameters**:
     1. `{ALERT.SENDTO}`
     2. `{ALERT.SUBJECT}`
     3. `{ALERT.MESSAGE}`
4. Click **Add**

**B. Thêm Media cho User:**

1. Vào **Administration** → **Users**
2. Chọn user (ví dụ: Admin)
3. Tab **Media** → Click **Add**
4. Cấu hình:
   - **Type**: `Expo Push Notification`
   - **Send to**: `admin` (username trong app)
   - **When active**: `1-7,00:00-24:00`
   - **Use if severity**: Chọn tất cả
   - **Status**: `Enabled`
5. Click **Add**, sau đó **Update**

**C. Tạo Action:**

1. Vào **Configuration** → **Actions** → **Trigger actions**
2. Click **Create action**
3. Tab **Action**:
   - **Name**: `Send Expo Push Notifications`
   - **Conditions**:
     - Add: `Trigger severity >= Warning`
4. Tab **Operations**:
   - Click **Add** trong phần Operations
   - **Send to users**: Chọn users
   - **Send only to**: `Expo Push Notification`
   - **Custom message**: Bật
   - **Subject**: `{TRIGGER.STATUS}: {TRIGGER.NAME}`
   - **Message**:
     ```
     Problem: {TRIGGER.NAME}
     Host: {HOST.NAME}
     Severity: {TRIGGER.SEVERITY}
     Time: {EVENT.DATE} {EVENT.TIME}
     
     Original problem ID: {EVENT.ID}
     ```
5. Click **Add**, sau đó **Add** action

---

## 4. Test Hệ Thống

### Test 1: API Server

```bash
# Health check
curl http://localhost:3000/health

# Đăng ký user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123"}'

# Đăng nhập
curl -X POST http://localhost:3000/api/auth/login-auth \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123"}'
```

### Test 2: Mobile App

1. Mở app trên điện thoại
2. Đăng nhập bằng username/password
3. Kiểm tra console log để thấy ExpoPushToken
4. Bấm "Gửi thông báo test" trên màn hình Home

### Test 3: Zabbix Integration

```bash
# Test script
sudo -u zabbix /usr/lib/zabbix/alertscripts/zabbix_to_expo.sh \
  "testuser" \
  "Test from Zabbix" \
  "This is a test message"

# Kiểm tra log
sudo tail -f /var/log/zabbix/expo_push.log
```

### Test 4: End-to-End

1. Tạo một trigger test trong Zabbix
2. Kích hoạt trigger (ví dụ: tắt một service)
3. Kiểm tra log Zabbix:
   ```bash
   sudo tail -f /var/log/zabbix/zabbix_server.log
   ```
4. Kiểm tra log script:
   ```bash
   sudo tail -f /var/log/zabbix/expo_push.log
   ```
5. Kiểm tra điện thoại nhận thông báo

---

## Troubleshooting

### Vấn đề 1: API Server không khởi động

**Triệu chứng:**
```
Error: Cannot find module 'express'
```

**Giải pháp:**
```bash
cd api-server
npm install
```

### Vấn đề 2: Mobile app không kết nối được API

**Triệu chứng:**
```
Network Error
```

**Giải pháp:**
1. Kiểm tra API_URL trong `src/services/api.js`
2. Nếu test trên thiết bị thật, đảm bảo:
   - Điện thoại và máy chủ cùng mạng (nếu dùng localhost)
   - Hoặc sử dụng domain public
3. Kiểm tra CORS trong API server

### Vấn đề 3: Không nhận được push notification

**Triệu chứng:**
App không rung khi có notification

**Giải pháp:**
1. Kiểm tra quyền notification trong Settings
2. Đảm bảo đang test trên thiết bị thật (không phải emulator)
3. Kiểm tra ExpoPushToken đã được đăng ký:
   ```bash
   sqlite3 api-server/data/database.sqlite "SELECT * FROM PushTokens;"
   ```

### Vấn đề 4: Zabbix script lỗi 401

**Triệu chứng:**
```
Failed to fetch tokens. HTTP Code: 401
```

**Giải pháp:**
1. Kiểm tra `API_SECRET_KEY` trong script
2. Đảm bảo khớp với `.env` của API server
3. Test bằng curl:
   ```bash
   curl -H "x-api-key: your-api-key" \
     http://localhost:3000/api/tokens/get-tokens-for-users?users=admin
   ```

---

## Bảo mật

### Checklist Bảo mật

- [ ] Đổi `API_SECRET_KEY` trong `.env`
- [ ] Đổi `JWT_SECRET` trong `.env`
- [ ] Đổi password admin mặc định
- [ ] Enable HTTPS với SSL certificate
- [ ] Cấu hình firewall chỉ cho phép IP Zabbix truy cập API
- [ ] Backup database định kỳ
- [ ] Enable log rotation
- [ ] Cập nhật dependencies thường xuyên

### Cấu hình Firewall

```bash
# Chỉ cho phép Zabbix server
sudo ufw allow from <zabbix-server-ip> to any port 3000

# Hoặc dùng iptables
sudo iptables -A INPUT -p tcp -s <zabbix-server-ip> --dport 3000 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 3000 -j DROP
```

---

## Backup

### Backup Database

```bash
# Tạo backup
cp api-server/data/database.sqlite api-server/data/database-backup-$(date +%Y%m%d).sqlite

# Script backup tự động
cat > /usr/local/bin/backup-zabbix-notifi.sh << 'EOF'
#!/bin/bash
BACKUP_DIR=/backup/zabbix-notifi
DB_PATH=/path/to/api-server/data/database.sqlite
DATE=$(date +%Y%m%d-%H%M%S)

mkdir -p $BACKUP_DIR
cp $DB_PATH $BACKUP_DIR/database-$DATE.sqlite

# Xóa backup cũ hơn 30 ngày
find $BACKUP_DIR -name "database-*.sqlite" -mtime +30 -delete
EOF

chmod +x /usr/local/bin/backup-zabbix-notifi.sh

# Thêm vào crontab
crontab -e
# 0 2 * * * /usr/local/bin/backup-zabbix-notifi.sh
```

---

## Monitoring

### Kiểm tra trạng thái

```bash
# API Server
curl http://localhost:3000/health

# PM2 status
pm2 status

# Logs
pm2 logs zabbix-notifi-api

# Database size
du -h api-server/data/database.sqlite

# Token count
sqlite3 api-server/data/database.sqlite "SELECT COUNT(*) FROM PushTokens;"
```

---

## Liên hệ và Hỗ trợ

Nếu gặp vấn đề, hãy:
1. Kiểm tra logs
2. Xem phần Troubleshooting
3. Tạo issue trên GitHub (nếu có)

Chúc bạn thành công! 🎉
