# Hệ Thống Thông Báo Zabbix qua Expo Push Notification

## Tổng Quan Hệ Thống

Hệ thống này cho phép Zabbix gửi cảnh báo đến điện thoại của các admin thông qua Expo Push Notifications.

### Các Thành Phần

1. **Expo React Native App** (`/mobile-app`): Ứng dụng cho admin
2. **API Server** (`/api-server`): Node.js server trung gian
3. **Zabbix Scripts** (`/zabbix-scripts`): Scripts tích hợp với Zabbix

## Cài Đặt

### 1. API Server

```bash
cd api-server
npm install
cp .env.example .env
# Chỉnh sửa file .env với thông tin của bạn
npm start
```

### 2. Mobile App

```bash
cd mobile-app
npm install
npx expo start
```

### 3. Zabbix Scripts

```bash
cd zabbix-scripts
chmod +x zabbix_to_expo.sh
sudo cp zabbix_to_expo.sh /usr/lib/zabbix/alertscripts/
```

## Luồng Hoạt Động

### Luồng 1: Đăng nhập và Đăng ký Thiết bị
- Admin mở app và đăng nhập
- App lấy ExpoPushToken
- Gửi token về API Server
- Server lưu token vào database

### Luồng 2: Zabbix Gửi Cảnh Báo
- Zabbix trigger được kích hoạt
- Script lấy danh sách token từ API
- Gửi notification qua Expo Push Service
- Admin nhận thông báo trên điện thoại

### Luồng 3: Đăng xuất
- Admin đăng xuất khỏi app
- Token bị xóa khỏi database
- Ngừng nhận thông báo

## Bảo Mật

- API key cho requests từ Zabbix
- JWT authentication cho mobile app
- HTTPS cho tất cả connections

## Log Files

- API Server: `/var/log/zabbix-notifi/api.log`
- Zabbix Script: `/var/log/zabbix/expo_push.log`
