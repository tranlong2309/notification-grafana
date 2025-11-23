#!/bin/bash

###############################################################################
# Zabbix to Expo Push Notification Script
# 
# Script này được gọi bởi Zabbix khi có alert được trigger.
# Nó sẽ lấy danh sách tokens từ API Server và gửi notification qua Expo.
#
# Tham số:
#   $1 - RECIPIENTS: Danh sách username phân cách bởi dấu phẩy (vd: admin,devops_team)
#   $2 - SUBJECT: Tiêu đề thông báo
#   $3 - MESSAGE: Nội dung thông báo
#
# Yêu cầu:
#   - curl phải được cài đặt
#   - jq phải được cài đặt (để xử lý JSON)
#
###############################################################################

# Cấu hình
API_SERVER_URL="${API_SERVER_URL:-http://localhost:3000}"
API_SECRET_KEY="${API_SECRET_KEY:-your-secret-api-key-change-this-in-production}"
EXPO_PUSH_URL="https://exp.host/--/api/v2/push/send"
LOG_FILE="/var/log/zabbix/expo_push.log"
CHUNK_SIZE=100  # Expo cho phép tối đa 100 notifications mỗi request

# Tạo thư mục log nếu chưa tồn tại
LOG_DIR=$(dirname "$LOG_FILE")
if [ ! -d "$LOG_DIR" ]; then
    mkdir -p "$LOG_DIR"
    chmod 755 "$LOG_DIR"
fi

# Hàm ghi log
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Hàm ghi log error
log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] $1" >> "$LOG_FILE"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] $1" >&2
}

# Kiểm tra tham số
if [ $# -lt 3 ]; then
    log_error "Missing required parameters. Usage: $0 <recipients> <subject> <message>"
    exit 1
fi

RECIPIENTS="$1"
SUBJECT="$2"
MESSAGE="$3"

log "=== New notification request ==="
log "Recipients: $RECIPIENTS"
log "Subject: $SUBJECT"
log "Message: $MESSAGE"

# Kiểm tra curl
if ! command -v curl &> /dev/null; then
    log_error "curl is not installed. Please install curl first."
    exit 1
fi

# Kiểm tra jq
if ! command -v jq &> /dev/null; then
    log_error "jq is not installed. Please install jq first."
    exit 1
fi

# Bước 1: Lấy danh sách tokens từ API Server
log "Fetching tokens from API server..."

RESPONSE=$(curl -s -w "\n%{http_code}" \
    -H "x-api-key: $API_SECRET_KEY" \
    "$API_SERVER_URL/api/tokens/get-tokens-for-users?users=$RECIPIENTS")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" != "200" ]; then
    log_error "Failed to fetch tokens. HTTP Code: $HTTP_CODE"
    log_error "Response: $BODY"
    exit 1
fi

# Đọc tokens vào mảng
mapfile -t TOKENS <<< "$BODY"

# Loại bỏ dòng trống
TOKENS=("${TOKENS[@]}" | grep -v '^$')

TOKEN_COUNT=${#TOKENS[@]}

if [ "$TOKEN_COUNT" -eq 0 ]; then
    log_error "No tokens found for recipients: $RECIPIENTS"
    exit 1
fi

log "Found $TOKEN_COUNT tokens"

# Bước 2: Tạo messages payload cho Expo
# Expo yêu cầu format:
# [
#   {
#     "to": "ExponentPushToken[...]",
#     "sound": "default",
#     "title": "Subject",
#     "body": "Message",
#     "priority": "high"
#   }
# ]

# Hàm tạo JSON message cho một token
create_message() {
    local token="$1"
    local subject="$2"
    local message="$3"
    
    jq -n \
        --arg to "$token" \
        --arg title "$subject" \
        --arg body "$message" \
        '{
            to: $to,
            sound: "default",
            title: $title,
            body: $body,
            priority: "high",
            channelId: "default"
        }'
}

# Bước 3: Chia tokens thành các chunks và gửi
log "Sending notifications in chunks of $CHUNK_SIZE..."

TOTAL_SENT=0
TOTAL_ERRORS=0
CHUNK_NUM=0

for ((i=0; i<TOKEN_COUNT; i+=CHUNK_SIZE)); do
    CHUNK_NUM=$((CHUNK_NUM + 1))
    CHUNK_END=$((i + CHUNK_SIZE))
    
    if [ $CHUNK_END -gt $TOKEN_COUNT ]; then
        CHUNK_END=$TOKEN_COUNT
    fi
    
    log "Processing chunk $CHUNK_NUM: tokens $((i+1)) to $CHUNK_END"
    
    # Tạo JSON array cho chunk này
    MESSAGES="["
    FIRST=true
    
    for ((j=i; j<CHUNK_END; j++)); do
        if [ "$FIRST" = true ]; then
            FIRST=false
        else
            MESSAGES="$MESSAGES,"
        fi
        
        TOKEN="${TOKENS[$j]}"
        MSG=$(create_message "$TOKEN" "$SUBJECT" "$MESSAGE")
        MESSAGES="$MESSAGES$MSG"
    done
    
    MESSAGES="$MESSAGES]"
    
    # Gửi đến Expo
    EXPO_RESPONSE=$(curl -s -w "\n%{http_code}" \
        -H "Accept: application/json" \
        -H "Content-Type: application/json" \
        -d "$MESSAGES" \
        "$EXPO_PUSH_URL")
    
    EXPO_HTTP_CODE=$(echo "$EXPO_RESPONSE" | tail -n1)
    EXPO_BODY=$(echo "$EXPO_RESPONSE" | sed '$d')
    
    if [ "$EXPO_HTTP_CODE" != "200" ]; then
        log_error "Expo API error for chunk $CHUNK_NUM. HTTP Code: $EXPO_HTTP_CODE"
        log_error "Response: $EXPO_BODY"
        TOTAL_ERRORS=$((TOTAL_ERRORS + (CHUNK_END - i)))
    else
        log "Chunk $CHUNK_NUM sent successfully"
        log "Expo response: $EXPO_BODY"
        
        # Parse response để đếm successful/failed
        SUCCESS_COUNT=$(echo "$EXPO_BODY" | jq '[.data[] | select(.status == "ok")] | length')
        ERROR_COUNT=$(echo "$EXPO_BODY" | jq '[.data[] | select(.status == "error")] | length')
        
        log "Chunk $CHUNK_NUM: $SUCCESS_COUNT successful, $ERROR_COUNT errors"
        
        TOTAL_SENT=$((TOTAL_SENT + SUCCESS_COUNT))
        TOTAL_ERRORS=$((TOTAL_ERRORS + ERROR_COUNT))
    fi
    
    # Ngủ ngắn giữa các chunks để tránh rate limiting
    if [ $CHUNK_END -lt $TOKEN_COUNT ]; then
        sleep 0.5
    fi
done

# Tổng kết
log "=== Notification sending completed ==="
log "Total tokens: $TOKEN_COUNT"
log "Successfully sent: $TOTAL_SENT"
log "Errors: $TOTAL_ERRORS"
log "======================================="

if [ $TOTAL_ERRORS -gt 0 ]; then
    exit 1
fi

exit 0
