# Zabbix Notifi Mobile App

## Mô tả

Ứng dụng React Native (Expo) cho phép admin nhận thông báo từ hệ thống Zabbix.

## Cài đặt

### 1. Cài đặt dependencies

```bash
cd mobile-app
npm install
```

### 2. Cấu hình API Server

Mở file `src/services/api.js` và thay đổi `API_URL`:

```javascript
const API_URL = 'https://your-api-server.com'; // Thay đổi URL này
```

### 3. Cấu hình Expo Project ID

Mở file `app.json` và thay đổi `projectId`:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "your-expo-project-id"
      }
    }
  }
}
```

Sau đó mở file `src/services/notification.js` và thay đổi `projectId`:

```javascript
token = (await Notifications.getExpoPushTokenAsync({
  projectId: 'your-expo-project-id', // Thay đổi ID này
})).data;
```

## Chạy ứng dụng

### Development Mode

```bash
# Khởi động Expo Dev Server
npx expo start

# Hoặc
npm start
```

Sau đó quét QR code bằng:
- **iOS**: Camera app
- **Android**: Expo Go app

### Build cho Production

#### iOS

```bash
# Build APK
eas build --platform ios --profile production
```

#### Android

```bash
# Build APK
eas build --platform android --profile production
```

## Tính năng

### 1. Đăng nhập / Đăng ký
- Xác thực với API server
- Tự động lấy và đăng ký ExpoPushToken

### 2. Nhận thông báo
- Nhận push notifications từ Zabbix
- Hiển thị thông báo ngay cả khi app đóng
- Lưu lịch sử thông báo

### 3. Quản lý tài khoản
- Xem thông tin profile
- Đăng xuất (tự động hủy đăng ký push token)

## Cấu trúc thư mục

```
mobile-app/
├── src/
│   ├── contexts/
│   │   └── AuthContext.js       # Context quản lý authentication
│   ├── navigation/
│   │   └── index.js              # Navigation configuration
│   ├── screens/
│   │   ├── LoginScreen.js        # Màn hình đăng nhập
│   │   ├── RegisterScreen.js     # Màn hình đăng ký
│   │   ├── HomeScreen.js         # Màn hình chính (danh sách thông báo)
│   │   └── ProfileScreen.js      # Màn hình profile
│   └── services/
│       ├── api.js                # API service (Axios)
│       ├── storage.js            # AsyncStorage service
│       └── notification.js       # Notification service
├── App.js                        # Entry point
├── app.json                      # Expo configuration
└── package.json
```

## Luồng hoạt động

### Luồng 1: Đăng nhập và Đăng ký Thiết bị

1. User mở app và nhập username/password
2. App gọi API `/api/auth/login-auth` để xác thực
3. Nhận JWT token và lưu vào AsyncStorage
4. App lấy ExpoPushToken từ Expo
5. Gửi token về API server qua `/api/tokens/login`
6. Server lưu token vào database

### Luồng 2: Nhận Thông Báo

1. Zabbix trigger được kích hoạt
2. Zabbix script gọi API server để lấy tokens
3. Script gửi notification qua Expo Push Service
4. User nhận thông báo trên điện thoại
5. App lưu notification vào lịch sử

### Luồng 3: Đăng xuất

1. User bấm "Đăng xuất"
2. App lấy ExpoPushToken từ storage
3. Gọi API `/api/tokens/logout` để hủy đăng ký
4. Xóa tất cả dữ liệu local
5. Điều hướng về màn hình login

## Troubleshooting

### 1. Không nhận được thông báo

- Kiểm tra quyền notification trong Settings
- Đảm bảo app đã đăng nhập thành công
- Kiểm tra push token đã được đăng ký với server
- Xem log trên server để đảm bảo notification được gửi

### 2. Lỗi kết nối API

- Kiểm tra `API_URL` trong `src/services/api.js`
- Đảm bảo API server đang chạy
- Kiểm tra firewall/network configuration

### 3. Expo Push Token không được tạo

- Chỉ hoạt động trên thiết bị thật (không hoạt động trên simulator/emulator)
- Đảm bảo đã cấp quyền notification
- Kiểm tra `projectId` trong cấu hình

## Tài liệu tham khảo

- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [React Navigation](https://reactnavigation.org/)
- [Axios](https://axios-http.com/)
