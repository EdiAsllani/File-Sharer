#!/bin/bash

set -e

echo "📁 File Sharer - Ubuntu Installation"
echo "===================================="
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "Installing git..."
    sudo apt update
    sudo apt install -y git
fi

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "Installing Python 3..."
    sudo apt install -y python3 python3-venv python3-pip
fi

# Clone repository
INSTALL_DIR="$HOME/file-sharer"

if [ -d "$INSTALL_DIR" ]; then
    echo "⚠️  Directory $INSTALL_DIR already exists."
    read -p "Remove and reinstall? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$INSTALL_DIR"
    else
        echo "Installation cancelled."
        exit 1
    fi
fi

echo "Cloning repository..."
read -p "Enter GitHub username (or press Enter for default): " GITHUB_USER
if [ -z "$GITHUB_USER" ]; then
    GITHUB_USER="YOUR_USERNAME"  # Replace with actual username before distributing
fi

git clone "https://github.com/$GITHUB_USER/file-sharer.git" "$INSTALL_DIR"

cd "$INSTALL_DIR"

# Create virtual environment
echo "Creating Python virtual environment..."
python3 -m venv venv

# Activate and install dependencies
echo "Installing Python dependencies..."
source venv/bin/activate
pip install -r requirements.txt

# Install systemd service
echo ""
read -p "Install as system service (auto-start on boot)? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    sed -i "s/%YOUR_USERNAME%/$USER/g" file-sharer.service
    sudo cp file-sharer.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable file-sharer.service
    sudo systemctl start file-sharer.service
    echo "✅ Service installed and started"
    SERVICE_INSTALLED=true
fi

# Create desktop entry
echo ""
read -p "Add to applications menu? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    sed -i "s|%YOUR_USERNAME%|$USER|g" file-sharer.desktop
    sed -i "s|Exec=.*|Exec=$INSTALL_DIR/start_server.sh|g" file-sharer.desktop
    mkdir -p ~/.local/share/applications
    cp file-sharer.desktop ~/.local/share/applications/
    chmod +x ~/.local/share/applications/file-sharer.desktop
    update-desktop-database ~/.local/share/applications/ 2>/dev/null || true
    echo "✅ Desktop entry created"
fi

# Configure firewall
echo ""
read -p "Configure firewall (allow port 8000)? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v ufw &> /dev/null; then
        sudo ufw allow 8000/tcp
        echo "✅ UFW configured"
    elif command -v firewall-cmd &> /dev/null; then
        sudo firewall-cmd --add-port=8000/tcp --permanent
        sudo firewall-cmd --reload
        echo "✅ Firewalld configured"
    else
        echo "⚠️  No firewall detected (ufw or firewalld)"
        echo "   You may need to manually allow port 8000"
    fi
fi

# Get local IP
LOCAL_IP=$(ip addr show | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}' | cut -d/ -f1)

echo ""
echo "===================================="
echo "✅ Installation Complete!"
echo "===================================="
echo ""
echo "Access the app:"
echo "  • Local:   http://localhost:8000"
if [ -n "$LOCAL_IP" ]; then
    echo "  • Network: http://$LOCAL_IP:8000"
fi
echo ""

if [ "$SERVICE_INSTALLED" = true ]; then
    echo "Service is running in the background."
    echo ""
    echo "Service commands:"
    echo "  • Check status:  sudo systemctl status file-sharer"
    echo "  • View logs:     journalctl -u file-sharer -f"
    echo "  • Stop service:  sudo systemctl stop file-sharer"
    echo "  • Restart:       sudo systemctl restart file-sharer"
else
    echo "Start manually:"
    echo "  cd $INSTALL_DIR && ./start_server.sh"
fi
echo ""