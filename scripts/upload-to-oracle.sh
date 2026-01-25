#!/bin/bash

#############################################
# Upload CareSync Backend to Oracle Cloud VM
# Run this script from your LOCAL machine
#############################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN} CareSync - Upload to Oracle Cloud VM${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Get VM IP address
read -p "Enter your Oracle VM Public IP: " VM_IP

if [ -z "$VM_IP" ]; then
    echo -e "${RED}Error: IP address is required${NC}"
    exit 1
fi

# Get SSH user (default: ubuntu)
read -p "Enter SSH username [ubuntu]: " SSH_USER
SSH_USER=${SSH_USER:-ubuntu}

# Get SSH key path
read -p "Enter SSH key path [~/.ssh/id_rsa]: " SSH_KEY
SSH_KEY=${SSH_KEY:-~/.ssh/id_rsa}

# Expand tilde
SSH_KEY="${SSH_KEY/#\~/$HOME}"

if [ ! -f "$SSH_KEY" ]; then
    echo -e "${RED}Error: SSH key not found at $SSH_KEY${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Configuration:${NC}"
echo "  VM IP: $VM_IP"
echo "  User: $SSH_USER"
echo "  SSH Key: $SSH_KEY"
echo ""

read -p "Continue? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
    echo "Cancelled."
    exit 0
fi

# Get the script directory (hospital-backend/scripts)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"

echo ""
echo -e "${GREEN}[1/4]${NC} Creating remote directory..."
ssh -i "$SSH_KEY" "$SSH_USER@$VM_IP" "mkdir -p ~/caresync-backend"

echo -e "${GREEN}[2/4]${NC} Uploading backend files..."
rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude '.env' \
    --exclude 'uploads/*' \
    --exclude 'logs/*' \
    --exclude '.git' \
    -e "ssh -i $SSH_KEY" \
    "$BACKEND_DIR/" "$SSH_USER@$VM_IP:~/caresync-backend/"

echo -e "${GREEN}[3/4]${NC} Uploading deployment script..."
ssh -i "$SSH_KEY" "$SSH_USER@$VM_IP" "chmod +x ~/caresync-backend/scripts/deploy-oracle.sh"

echo -e "${GREEN}[4/4]${NC} Upload complete!"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN} Next Steps${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "1. SSH into your VM:"
echo "   ssh -i $SSH_KEY $SSH_USER@$VM_IP"
echo ""
echo "2. Run the deployment script:"
echo "   cd ~/caresync-backend/scripts"
echo "   ./deploy-oracle.sh"
echo ""
echo "3. Edit your .env file:"
echo "   nano ~/caresync-backend/.env"
echo ""
echo "4. Install dependencies and start:"
echo "   cd ~/caresync-backend"
echo "   npm install --production"
echo "   ./start.sh"
echo ""
