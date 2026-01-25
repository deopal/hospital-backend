#!/bin/bash

#############################################
# CareSync Backend - Oracle Cloud VM Setup
# Run this script on a fresh Ubuntu 22.04 VM
#############################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_header() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN} $1${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Please don't run as root. Run as ubuntu user with sudo access."
    exit 1
fi

print_header "CareSync Backend Deployment Script"

#############################################
# Step 1: System Update
#############################################
print_header "Step 1: Updating System"

sudo apt update && sudo apt upgrade -y
print_status "System updated"

#############################################
# Step 2: Install Node.js 20
#############################################
print_header "Step 2: Installing Node.js 20"

if command -v node &> /dev/null; then
    print_warning "Node.js already installed: $(node -v)"
else
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
    print_status "Node.js installed: $(node -v)"
fi

#############################################
# Step 3: Install PM2
#############################################
print_header "Step 3: Installing PM2"

if command -v pm2 &> /dev/null; then
    print_warning "PM2 already installed"
else
    sudo npm install -g pm2
    print_status "PM2 installed"
fi

#############################################
# Step 4: Install Git & Nginx
#############################################
print_header "Step 4: Installing Git & Nginx"

sudo apt install -y git nginx
print_status "Git and Nginx installed"

#############################################
# Step 5: Configure Firewall
#############################################
print_header "Step 5: Configuring Firewall"

# Oracle Cloud uses iptables
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 22 -j ACCEPT 2>/dev/null || true
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT 2>/dev/null || true
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT 2>/dev/null || true
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 2000 -j ACCEPT 2>/dev/null || true

# Save iptables rules
sudo apt install -y iptables-persistent
sudo netfilter-persistent save
print_status "Firewall configured (ports 22, 80, 443, 2000)"

#############################################
# Step 6: Clone/Setup Application
#############################################
print_header "Step 6: Setting Up Application"

APP_DIR="$HOME/caresync-backend"

if [ -d "$APP_DIR" ]; then
    print_warning "Application directory exists. Pulling latest changes..."
    cd "$APP_DIR"
    git pull origin main || git pull origin master || true
else
    print_warning "Please clone your repository manually:"
    echo ""
    echo "  git clone https://github.com/YOUR_USERNAME/hospital.git $APP_DIR"
    echo ""
    echo "Or upload your files using SCP:"
    echo ""
    echo "  scp -r ./hospital-backend ubuntu@YOUR_IP:~/caresync-backend"
    echo ""

    # Create directory for manual upload
    mkdir -p "$APP_DIR"
    print_status "Created directory: $APP_DIR"
fi

#############################################
# Step 7: Create .env Template
#############################################
print_header "Step 7: Creating .env Template"

ENV_FILE="$APP_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
    cat > "$ENV_FILE" << 'EOF'
# Server Configuration
PORT=2000
NODE_ENV=production

# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/caresync?retryWrites=true&w=majority

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this

# Frontend URL (for CORS)
FRONTEND_URL=https://your-frontend-domain.com

# Email Configuration (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Firebase Configuration (if needed)
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=
EOF
    print_status "Created .env template at $ENV_FILE"
    print_warning "IMPORTANT: Edit the .env file with your actual values!"
    echo ""
    echo "  nano $ENV_FILE"
    echo ""
else
    print_warning ".env file already exists"
fi

#############################################
# Step 8: Configure Nginx
#############################################
print_header "Step 8: Configuring Nginx"

NGINX_CONF="/etc/nginx/sites-available/caresync"

sudo tee "$NGINX_CONF" > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;  # Replace with your domain or leave as _ for IP access

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Increase max body size for file uploads
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:2000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # WebSocket support (for Socket.io)
        proxy_read_timeout 86400;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:2000/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
EOF

# Enable site
sudo ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/caresync

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
sudo nginx -t && sudo systemctl restart nginx
print_status "Nginx configured"

#############################################
# Step 9: Create PM2 Ecosystem File
#############################################
print_header "Step 9: Creating PM2 Configuration"

PM2_CONFIG="$APP_DIR/ecosystem.config.cjs"

cat > "$PM2_CONFIG" << 'EOF'
module.exports = {
  apps: [{
    name: 'caresync-backend',
    script: 'index.server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 2000
    },
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# Create logs directory
mkdir -p "$APP_DIR/logs"

print_status "PM2 ecosystem file created"

#############################################
# Step 10: Create Helper Scripts
#############################################
print_header "Step 10: Creating Helper Scripts"

# Start script
cat > "$APP_DIR/start.sh" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
pm2 start ecosystem.config.cjs
pm2 save
echo "CareSync backend started!"
EOF
chmod +x "$APP_DIR/start.sh"

# Stop script
cat > "$APP_DIR/stop.sh" << 'EOF'
#!/bin/bash
pm2 stop caresync-backend
echo "CareSync backend stopped!"
EOF
chmod +x "$APP_DIR/stop.sh"

# Restart script
cat > "$APP_DIR/restart.sh" << 'EOF'
#!/bin/bash
pm2 restart caresync-backend
echo "CareSync backend restarted!"
EOF
chmod +x "$APP_DIR/restart.sh"

# Deploy/Update script
cat > "$APP_DIR/update.sh" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "Pulling latest changes..."
git pull origin main || git pull origin master
echo "Installing dependencies..."
npm install --production
echo "Restarting application..."
pm2 restart caresync-backend
echo "Update complete!"
EOF
chmod +x "$APP_DIR/update.sh"

# Logs script
cat > "$APP_DIR/logs.sh" << 'EOF'
#!/bin/bash
pm2 logs caresync-backend --lines 100
EOF
chmod +x "$APP_DIR/logs.sh"

print_status "Helper scripts created (start.sh, stop.sh, restart.sh, update.sh, logs.sh)"

#############################################
# Step 11: Setup PM2 Startup
#############################################
print_header "Step 11: Configuring PM2 Startup"

pm2 startup systemd -u $USER --hp $HOME | tail -1 | sudo bash
print_status "PM2 configured to start on boot"

#############################################
# Summary
#############################################
print_header "Deployment Setup Complete!"

PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || echo "YOUR_IP")

echo -e "${GREEN}Next Steps:${NC}"
echo ""
echo "1. Upload your backend code to: $APP_DIR"
echo "   scp -r ./hospital-backend/* ubuntu@$PUBLIC_IP:~/caresync-backend/"
echo ""
echo "2. Edit your .env file:"
echo "   nano $APP_DIR/.env"
echo ""
echo "3. Install dependencies:"
echo "   cd $APP_DIR && npm install --production"
echo ""
echo "4. Start the application:"
echo "   cd $APP_DIR && ./start.sh"
echo ""
echo "5. Update MongoDB Atlas whitelist with IP: $PUBLIC_IP"
echo ""
echo "6. (Optional) Setup SSL with Let's Encrypt:"
echo "   sudo apt install certbot python3-certbot-nginx"
echo "   sudo certbot --nginx -d your-domain.com"
echo ""
echo -e "${GREEN}Useful Commands:${NC}"
echo "  ./start.sh    - Start the server"
echo "  ./stop.sh     - Stop the server"
echo "  ./restart.sh  - Restart the server"
echo "  ./update.sh   - Pull & deploy updates"
echo "  ./logs.sh     - View logs"
echo "  pm2 status    - Check status"
echo ""
echo -e "${GREEN}Your API will be available at:${NC}"
echo "  http://$PUBLIC_IP"
echo "  http://$PUBLIC_IP/health (health check)"
echo ""
print_status "Setup complete! Happy deploying!"
