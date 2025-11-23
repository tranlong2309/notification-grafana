# Zabbix Integration Scripts

## Cài Đặt

### 1. Cài đặt dependencies

```bash
# Trên Ubuntu/Debian
sudo apt-get install curl jq

# Trên CentOS/RHEL
sudo yum install curl jq
```

### 2. Copy script vào Zabbix alertscripts directory

```bash
sudo cp zabbix_to_expo.sh /usr/lib/zabbix/alertscripts/
sudo chmod +x /usr/lib/zabbix/alertscripts/zabbix_to_expo.sh
sudo chown zabbix:zabbix /usr/lib/zabbix/alertscripts/zabbix_to_expo.sh
```

### 3. Tạo log directory

```bash
sudo mkdir -p /var/log/zabbix
sudo chown zabbix:zabbix /var/log/zabbix
sudo chmod 755 /var/log/zabbix
```

### 4. Cấu hình biến môi trường

Thêm vào `/etc/zabbix/zabbix_server.conf` hoặc tạo file `/etc/default/zabbix-server`:

```bash
export API_SERVER_URL="https://your-api-server.com"
export API_SECRET_KEY="your-secret-api-key"
```

Hoặc edit trực tiếp trong script `zabbix_to_expo.sh`.

### 5. Test script

```bash
sudo -u zabbix /usr/lib/zabbix/alertscripts/zabbix_to_expo.sh \
  "admin,devops_team" \
  "Test Alert" \
  "This is a test notification"
```

Kiểm tra log:
```bash
sudo tail -f /var/log/zabbix/expo_push.log
```

## Cấu Hình Zabbix

### 1. Tạo Media Type

1. Vào **Administration** → **Media types** → **Create media type**
2. Cấu hình:
   - **Name**: Expo Push Notification
   - **Type**: Script
   - **Script name**: zabbix_to_expo.sh
   - **Script parameters**:
     1. `{ALERT.SENDTO}`
     2. `{ALERT.SUBJECT}`
     3. `{ALERT.MESSAGE}`

### 2. Thêm Media cho User

1. Vào **Administration** → **Users**
2. Chọn user (ví dụ: Admin)
3. Tab **Media** → **Add**
4. Cấu hình:
   - **Type**: Expo Push Notification
   - **Send to**: admin (username trong database)
   - **When active**: 1-7,00:00-24:00
   - **Use if severity**: Chọn các mức severity cần nhận
   - **Status**: Enabled

### 3. Tạo Action

1. Vào **Configuration** → **Actions** → **Create action**
2. Tab **Action**:
   - **Name**: Send Expo Push Notifications
   - **Conditions**: Thêm điều kiện (ví dụ: Problem)
3. Tab **Operations**:
   - **Send to users**: Chọn users
   - **Send only to**: Expo Push Notification
   - **Custom message**:
     - **Subject**: `{TRIGGER.STATUS}: {TRIGGER.NAME}`
     - **Message**:
       ```
       Problem: {TRIGGER.NAME}
       Host: {HOST.NAME}
       Severity: {TRIGGER.SEVERITY}
       Time: {EVENT.DATE} {EVENT.TIME}
       
       {TRIGGER.DESCRIPTION}
       ```

## Troubleshooting

### Kiểm tra log

```bash
# Xem log script
sudo tail -f /var/log/zabbix/expo_push.log

# Xem log Zabbix server
sudo tail -f /var/log/zabbix/zabbix_server.log
```

### Lỗi thường gặp

1. **"curl: command not found"**
   - Cài đặt curl: `sudo apt-get install curl`

2. **"jq: command not found"**
   - Cài đặt jq: `sudo apt-get install jq`

3. **"Permission denied"**
   - Kiểm tra quyền: `ls -la /usr/lib/zabbix/alertscripts/`
   - Thay đổi owner: `sudo chown zabbix:zabbix /usr/lib/zabbix/alertscripts/zabbix_to_expo.sh`

4. **"Failed to fetch tokens. HTTP Code: 401"**
   - Kiểm tra API_SECRET_KEY trong script
   - Đảm bảo API server đang chạy

5. **"No tokens found for recipients"**
   - Kiểm tra username trong Zabbix user media
   - Đảm bảo user đã đăng nhập vào mobile app

## Monitoring

### Theo dõi log rotation

Tạo file `/etc/logrotate.d/zabbix-expo`:

```
/var/log/zabbix/expo_push.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 zabbix zabbix
}
```

### Test log rotation

```bash
sudo logrotate -f /etc/logrotate.d/zabbix-expo
```
