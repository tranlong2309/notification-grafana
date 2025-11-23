# Test API Endpoints

Tài liệu này mô tả cách test các API endpoints.

## Base URL

```
Development: http://localhost:3000
Production: https://your-domain.com
```

## Authentication

### Đăng ký User

**Endpoint:** `POST /api/auth/register`

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123",
    "email": "admin@example.com"
  }'
```

**Response:**
```json
{
  "message": "User registered successfully",
  "userId": 1
}
```

### Đăng nhập

**Endpoint:** `POST /api/auth/login-auth`

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/login-auth \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

## Token Management

**LƯU Ý:** Token management endpoints KHÔNG cần JWT authentication. Chỉ cần gửi username trong request body hoặc query parameter.

### Đăng ký Push Token

**Endpoint:** `POST /api/tokens/login`

**Request:**
```bash
curl -X POST http://localhost:3000/api/tokens/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
    "deviceInfo": {
      "brand": "Apple",
      "modelName": "iPhone 13",
      "osName": "iOS",
      "osVersion": "15.0"
    }
  }'
```

**Response:**
```json
{
  "message": "Push token registered successfully",
  "username": "admin",
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
}
```

### Hủy đăng ký Push Token

**Endpoint:** `POST /api/tokens/logout`

**Request:**
```bash
curl -X POST http://localhost:3000/api/tokens/logout \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
  }'
```

**Response:**
```json
{
  "message": "Push token deregistered successfully"
}
```

### Lấy Tokens cho Users (Zabbix)

**Endpoint:** `GET /api/tokens/get-tokens-for-users`

**Headers:**
```
x-api-key: <API_SECRET_KEY>
```

**Request:**
```bash
curl -X GET "http://localhost:3000/api/tokens/get-tokens-for-users?users=admin,user2" \
  -H "x-api-key: your-secret-api-key-change-this-in-production"
```

**Response:**
```
ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
ExponentPushToken[yyyyyyyyyyyyyyyyyyyyyy]
```

### Lấy Tokens của User hiện tại

**Endpoint:** `GET /api/tokens/my-tokens`

**Request:**
```bash
curl -X GET "http://localhost:3000/api/tokens/my-tokens?username=admin"
```

**Response:**
```json
{
  "username": "admin",
  "tokens": [
    {
      "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
      "deviceInfo": {
        "brand": "Apple",
        "modelName": "iPhone 13",
        "osName": "iOS",
        "osVersion": "15.0"
      },
      "createdAt": "2024-01-01 10:00:00",
      "updatedAt": "2024-01-01 10:00:00"
    }
  ]
}
```

## Utility Endpoints

### Health Check

**Endpoint:** `GET /health`

**Request:**
```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T10:00:00.000Z",
  "uptime": 12345.67
}
```

### Cleanup Old Tokens

**Endpoint:** `DELETE /api/tokens/cleanup`

**Headers:**
```
x-api-key: <API_SECRET_KEY>
```

**Request:**
```bash
curl -X DELETE "http://localhost:3000/api/tokens/cleanup?days=30" \
  -H "x-api-key: your-secret-api-key-change-this-in-production"
```

**Response:**
```json
{
  "message": "Cleanup completed",
  "tokensRemoved": 5
}
```

## Testing với Postman

### Import Collection

Tạo file `postman_collection.json`:

```json
{
  "info": {
    "name": "Zabbix Notifi API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000"
    },
    {
      "key": "jwt_token",
      "value": ""
    },
    {
      "key": "api_key",
      "value": "your-secret-api-key-change-this-in-production"
    }
  ],
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"username\": \"testuser\",\n  \"password\": \"test123\",\n  \"email\": \"test@example.com\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{baseUrl}}/api/auth/register",
              "host": ["{{baseUrl}}"],
              "path": ["api", "auth", "register"]
            }
          }
        },
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"username\": \"admin\",\n  \"password\": \"admin123\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{baseUrl}}/api/auth/login-auth",
              "host": ["{{baseUrl}}"],
              "path": ["api", "auth", "login-auth"]
            }
          },
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "var jsonData = pm.response.json();",
                  "pm.collectionVariables.set(\"jwt_token\", jsonData.token);"
                ]
              }
            }
          ]
        }
      ]
    }
  ]
}
```

Import vào Postman và sử dụng.

## Error Codes

| Code | Description |
|------|-------------|
| 200  | Success |
| 201  | Created |
| 400  | Bad Request |
| 401  | Unauthorized |
| 404  | Not Found |
| 409  | Conflict |
| 500  | Internal Server Error |

## Rate Limiting

- Window: 15 minutes
- Max requests: 100 per IP
- Header: `X-RateLimit-Limit`, `X-RateLimit-Remaining`
