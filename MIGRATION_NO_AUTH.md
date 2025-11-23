# Migration Guide: Loại bỏ JWT Authentication

## Tổng quan thay đổi

Hệ thống đã được cập nhật để **LOẠI BỎ** yêu cầu JWT authentication cho các token management endpoints. Bây giờ chỉ cần `username` để quản lý push tokens.

## Lý do thay đổi

- **Đơn giản hóa**: Không cần phải login và quản lý JWT tokens
- **Linh hoạt hơn**: Có thể đăng ký/hủy token chỉ với username
- **Phù hợp với use case**: Mobile app chỉ cần đăng ký device để nhận thông báo

## Endpoints đã thay đổi

### 1. Đăng ký Push Token

**TRƯỚC:**
```bash
# Cần JWT token
curl -X POST http://localhost:3000/api/tokens/login \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "token": "ExponentPushToken[xxx]",
    "deviceInfo": {...}
  }'
```

**SAU:**
```bash
# Chỉ cần username trong body
curl -X POST http://localhost:3000/api/tokens/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "token": "ExponentPushToken[xxx]",
    "deviceInfo": {...}
  }'
```

### 2. Hủy đăng ký Push Token

**TRƯỚC:**
```bash
# Cần JWT token
curl -X POST http://localhost:3000/api/tokens/logout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"token": "ExponentPushToken[xxx]"}'
```

**SAU:**
```bash
# Chỉ cần username trong body
curl -X POST http://localhost:3000/api/tokens/logout \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "token": "ExponentPushToken[xxx]"
  }'
```

### 3. Lấy Tokens của User

**TRƯỚC:**
```bash
# Cần JWT token
curl -X GET http://localhost:3000/api/tokens/my-tokens \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**SAU:**
```bash
# Username qua query parameter
curl -X GET "http://localhost:3000/api/tokens/my-tokens?username=admin"
```

## Endpoints KHÔNG thay đổi

Các endpoints sau vẫn giữ nguyên:

### Zabbix endpoints
- `GET /api/tokens/get-tokens-for-users` - Vẫn cần API key
- `DELETE /api/tokens/cleanup` - Vẫn cần API key

### Auth endpoints (optional)
- `POST /api/auth/register` - Vẫn có thể dùng nếu cần
- `POST /api/auth/login-auth` - Vẫn có thể dùng nếu cần

## Cập nhật Mobile App

Nếu mobile app của bạn đang sử dụng JWT, bạn cần cập nhật:

### Trước:
```javascript
// Cần login trước
const loginResponse = await axios.post('/api/auth/login-auth', {
  username, password
});
const token = loginResponse.data.token;

// Rồi mới register push token
await axios.post('/api/tokens/login', {
  token: expoPushToken,
  deviceInfo
}, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### Sau:
```javascript
// Chỉ cần username
await axios.post('/api/tokens/login', {
  username: 'admin',
  token: expoPushToken,
  deviceInfo
});
```

## Bảo mật

**LƯU Ý QUAN TRỌNG:**

Vì không có authentication, bất kỳ ai biết username cũng có thể:
- Đăng ký push token cho user đó
- Hủy đăng ký push token
- Xem danh sách tokens

**Khuyến nghị:**

1. **Trong môi trường production**, nên thêm một trong các giải pháp sau:
   - Basic authentication (username + password trong body)
   - IP whitelist cho mobile app servers
   - Rate limiting mạnh hơn
   - API key cho mobile app

2. **Hoặc** giữ nguyên JWT authentication và chỉ sử dụng phương pháp mới cho testing

3. **Nếu dùng trong nội bộ** (private network), có thể chấp nhận được

## Testing

Test các endpoints mới:

```bash
# 1. Đăng ký token
curl -X POST http://localhost:3000/api/tokens/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "token": "ExponentPushToken[test123]",
    "deviceInfo": {
      "brand": "Apple",
      "modelName": "iPhone 15"
    }
  }'

# 2. Lấy tokens
curl "http://localhost:3000/api/tokens/my-tokens?username=testuser"

# 3. Hủy đăng ký
curl -X POST http://localhost:3000/api/tokens/logout \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "token": "ExponentPushToken[test123]"
  }'
```

## Rollback

Nếu cần quay lại phiên bản có JWT:

```bash
git log --oneline  # Tìm commit trước khi thay đổi
git revert <commit-hash>  # Hoặc
git reset --hard <commit-hash>
```

## Hỗ trợ

Nếu có vấn đề gì, vui lòng:
1. Check logs: `tail -f /var/log/zabbix-notifi/api.log`
2. Test với curl commands ở trên
3. Kiểm tra API_TESTING.md để xem ví dụ đầy đủ
