#!/bin/bash

###############################################################################
# Script tiện ích để quản lý API Server
###############################################################################

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$SCRIPT_DIR/api-server"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Menu
show_menu() {
    echo ""
    echo "==================================="
    echo "   Zabbix Notifi - API Manager"
    echo "==================================="
    echo "1. Start API Server"
    echo "2. Stop API Server"
    echo "3. Restart API Server"
    echo "4. View Logs"
    echo "5. Check Status"
    echo "6. Initialize Database"
    echo "7. Backup Database"
    echo "8. Test API"
    echo "9. View Users"
    echo "10. View Tokens"
    echo "0. Exit"
    echo "==================================="
}

# Start server
start_server() {
    print_info "Starting API Server..."
    cd "$API_DIR" || exit
    
    if command -v pm2 &> /dev/null; then
        pm2 start ecosystem.config.json
        print_success "Server started with PM2"
    else
        print_info "PM2 not found. Starting with npm..."
        npm start &
        print_success "Server started"
    fi
}

# Stop server
stop_server() {
    print_info "Stopping API Server..."
    
    if command -v pm2 &> /dev/null; then
        pm2 stop zabbix-notifi-api
        print_success "Server stopped"
    else
        pkill -f "node.*server.js"
        print_success "Server stopped"
    fi
}

# Restart server
restart_server() {
    print_info "Restarting API Server..."
    stop_server
    sleep 2
    start_server
}

# View logs
view_logs() {
    print_info "Viewing logs (Press Ctrl+C to exit)..."
    cd "$API_DIR" || exit
    
    if command -v pm2 &> /dev/null; then
        pm2 logs zabbix-notifi-api
    else
        tail -f logs/combined.log
    fi
}

# Check status
check_status() {
    print_info "Checking status..."
    
    if command -v pm2 &> /dev/null; then
        pm2 status zabbix-notifi-api
    else
        if pgrep -f "node.*server.js" > /dev/null; then
            print_success "Server is running"
            pgrep -f "node.*server.js" | xargs ps -p
        else
            print_error "Server is not running"
        fi
    fi
    
    # Test health endpoint
    print_info "Testing health endpoint..."
    if curl -s http://localhost:3000/health > /dev/null; then
        print_success "API is responding"
        curl -s http://localhost:3000/health | jq .
    else
        print_error "API is not responding"
    fi
}

# Initialize database
init_db() {
    print_info "Initializing database..."
    cd "$API_DIR" || exit
    npm run init-db
    print_success "Database initialized"
}

# Backup database
backup_db() {
    print_info "Backing up database..."
    cd "$API_DIR" || exit
    
    BACKUP_DIR="backups"
    mkdir -p "$BACKUP_DIR"
    
    DATE=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/database_$DATE.sqlite"
    
    cp data/database.sqlite "$BACKUP_FILE"
    print_success "Database backed up to: $BACKUP_FILE"
}

# Test API
test_api() {
    print_info "Testing API endpoints..."
    
    # Health check
    echo ""
    echo "1. Health Check:"
    curl -s http://localhost:3000/health | jq .
    
    # Login
    echo ""
    echo "2. Login Test:"
    TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login-auth \
        -H "Content-Type: application/json" \
        -d '{"username":"admin","password":"admin123"}' | jq -r .token)
    
    if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
        print_success "Login successful"
        echo "Token: ${TOKEN:0:20}..."
    else
        print_error "Login failed"
    fi
}

# View users
view_users() {
    print_info "Viewing users..."
    cd "$API_DIR" || exit
    sqlite3 data/database.sqlite "SELECT id, username, email, role, is_active FROM Users;"
}

# View tokens
view_tokens() {
    print_info "Viewing push tokens..."
    cd "$API_DIR" || exit
    sqlite3 data/database.sqlite "SELECT username, token, created_at FROM PushTokens;"
}

# Main loop
while true; do
    show_menu
    read -rp "Select option: " choice
    
    case $choice in
        1) start_server ;;
        2) stop_server ;;
        3) restart_server ;;
        4) view_logs ;;
        5) check_status ;;
        6) init_db ;;
        7) backup_db ;;
        8) test_api ;;
        9) view_users ;;
        10) view_tokens ;;
        0) 
            print_info "Goodbye!"
            exit 0
            ;;
        *)
            print_error "Invalid option"
            ;;
    esac
    
    echo ""
    read -rp "Press Enter to continue..."
done
