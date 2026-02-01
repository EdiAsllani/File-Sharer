# Deployment & Build Guide

Complete guide for building, packaging, and deploying the File Sharer app.

## Building the Desktop App

### Prerequisites

```bash
# Install Node.js and npm (if not already installed)
sudo apt install nodejs npm  # Ubuntu/Debian
# or download from nodejs.org

# Navigate to electron directory
cd file-sharer/electron

# Install dependencies
npm install
```

### Build Options

#### 1. AppImage (Recommended for Linux)

```bash
npm run build:appimage
```

**Output:** `electron/dist/File-Sharer-*.AppImage`

**Advantages:**

- ✅ Runs on all Linux distros
- ✅ No installation needed
- ✅ Portable
- ✅ Self-contained

**Usage:**

```bash
chmod +x File-Sharer-*.AppImage
./File-Sharer-*.AppImage
```

#### 2. DEB Package (Ubuntu/Debian)

```bash
npm run build:deb
```

**Output:** `electron/dist/file-sharer_*.deb`

**Advantages:**

- ✅ Integrates with system package manager
- ✅ Auto-creates menu entries
- ✅ Easy updates via apt

**Install:**

```bash
sudo dpkg -i file-sharer_*.deb
sudo apt-get install -f  # Fix dependencies if needed
```

#### 3. Windows Build (Cross-compile from Linux or build on Windows)

```bash
npm run build:win
```

**Output:** `electron/dist/File-Sharer-Setup-*.exe`

#### 4. Build All Formats

```bash
npm run build:all
```

Builds both Linux and Windows versions.

---

## GitHub Setup

### 1. Initialize Git Repository

```bash
cd file-sharer

# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: File Sharer v1.0.0"
```

### 2. Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `file-sharer`
3. Description: "Local network file sharing application"
4. Public or Private (your choice)
5. **Don't** initialize with README (we already have one)
6. Click "Create repository"

### 3. Push to GitHub

```bash
# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/file-sharer.git

# Rename branch to main (if needed)
git branch -M main

# Push code
git push -u origin main
```

### 4. Rename README for GitHub

```bash
# Replace the local README with the GitHub-optimized one
mv README.md README_LOCAL.md
mv README_GITHUB.md README.md

# Commit and push
git add .
git commit -m "Update README for GitHub"
git push
```

---

## Creating a Release on GitHub

### 1. Build All Packages

```bash
cd electron
npm run build:appimage
npm run build:deb
# If on Windows or have Windows build tools:
# npm run build:win
```

### 2. Create Git Tag

```bash
cd ..
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

### 3. Create GitHub Release

1. Go to your repository on GitHub
2. Click "Releases" → "Draft a new release"
3. Tag version: `v1.0.0`
4. Release title: `File Sharer v1.0.0`
5. Description:

   ```markdown
   ## File Sharer v1.0.0

   First stable release! 🎉

   ### Features

   - Multi-file upload support
   - Auto device discovery
   - Desktop app for Linux and Windows
   - Auto-cleanup after 48 hours

   ### Downloads

   - **Linux (AppImage)**: Universal, runs on all distros
   - **Linux (DEB)**: For Ubuntu/Debian systems
   - **Windows**: Installer for Windows 10/11

   ### Installation

   See the [README](https://github.com/YOUR_USERNAME/file-sharer#readme) for installation instructions.
   ```

6. Attach files:
   - Drag & drop `electron/dist/File-Sharer-*.AppImage`
   - Drag & drop `electron/dist/file-sharer_*.deb`
   - (Optional) Windows `.exe` if built

7. Click "Publish release"

---

## Ubuntu LTS Installation (From GitHub)

### Installation Script

Create this as `install-ubuntu.sh` for easy installation:

```bash
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
git clone https://github.com/YOUR_USERNAME/file-sharer.git "$INSTALL_DIR"

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
fi

# Create desktop entry
echo ""
read -p "Add to applications menu? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    sed -i "s/%YOUR_USERNAME%/$USER/g" file-sharer.desktop
    mkdir -p ~/.local/share/applications
    cp file-sharer.desktop ~/.local/share/applications/
    chmod +x ~/.local/share/applications/file-sharer.desktop
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
echo "  • Network: http://$LOCAL_IP:8000"
echo ""
echo "Start manually:"
echo "  cd $INSTALL_DIR && ./start_server.sh"
echo ""
echo "View service status:"
echo "  sudo systemctl status file-sharer.service"
echo ""
```

Save this to `install-ubuntu.sh` and run:

```bash
chmod +x install-ubuntu.sh
./install-ubuntu.sh
```

---

## Auto-Start Configuration

### Method 1: Systemd Service (Recommended for Server)

**Pros:** Starts on boot, restarts on failure, runs in background

```bash
# Edit service file with your username
sed -i "s/%YOUR_USERNAME%/$USER/g" file-sharer.service

# Install service
sudo cp file-sharer.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable file-sharer.service
sudo systemctl start file-sharer.service

# Check status
sudo systemctl status file-sharer.service

# View logs
journalctl -u file-sharer.service -f
```

**Control:**

```bash
sudo systemctl start file-sharer    # Start
sudo systemctl stop file-sharer     # Stop
sudo systemctl restart file-sharer  # Restart
sudo systemctl disable file-sharer  # Disable auto-start
```

### Method 2: Desktop Autostart (For Desktop Environment)

**Pros:** Starts when user logs in, shows GUI

```bash
# Create autostart directory
mkdir -p ~/.config/autostart

# Copy desktop file
cp file-sharer.desktop ~/.config/autostart/

# Edit to run the AppImage instead
sed -i 's/Exec=.*/Exec=\/usr\/local\/bin\/file-sharer/' ~/.config/autostart/file-sharer.desktop
```

### Method 3: Cron Job (Alternative)

```bash
# Edit crontab
crontab -e

# Add this line:
@reboot cd /home/YOUR_USERNAME/file-sharer && ./start_server.sh
```

---

## Connecting Devices

### From Phone/Tablet

1. Connect to same WiFi network as server
2. Open browser (Safari, Chrome, etc.)
3. Navigate to: `http://SERVER_IP:8000`
4. Bookmark for easy access

### From Another PC

1. Open browser
2. Navigate to: `http://SERVER_IP:8000`
3. Or install the desktop app and point it to the server

---

## Troubleshooting

### Build Errors

**Problem:** `electron-builder` fails

**Solution:**

```bash
cd electron
rm -rf node_modules package-lock.json
npm install
npm run build:appimage
```

**Problem:** Python dependencies fail

**Solution:**

```bash
sudo apt install python3-dev build-essential
pip install --upgrade pip
pip install -r requirements.txt
```

### Service Won't Start

**Check status:**

```bash
sudo systemctl status file-sharer.service
```

**View detailed logs:**

```bash
journalctl -u file-sharer.service -n 50
```

**Common fixes:**

```bash
# Fix permissions
chmod +x ~/file-sharer/backend/main.py

# Check Python path
which python3

# Manually test
cd ~/file-sharer
python3 backend/main.py
```

### Port Already in Use

```bash
# Find what's using port 8000
sudo lsof -i :8000

# Kill the process
sudo kill -9 <PID>

# Or change the port in backend/main.py
```

---

## Monitoring

### Check if Service is Running

```bash
sudo systemctl is-active file-sharer.service
```

### View Real-Time Logs

```bash
journalctl -u file-sharer.service -f
```

### Check Resource Usage

```bash
# CPU and memory
ps aux | grep "python3.*main.py"

# Detailed system stats
htop  # Press F4, type: main.py
```

---

## Updates

### Update from GitHub

```bash
cd ~/file-sharer

# Pull latest changes
git pull origin main

# Update dependencies
source venv/bin/activate
pip install -r requirements.txt --upgrade

# Restart service
sudo systemctl restart file-sharer.service
```

### Update Desktop App

1. Download new AppImage from GitHub Releases
2. Replace old one:
   ```bash
   sudo mv File-Sharer-NEW.AppImage /usr/local/bin/file-sharer
   chmod +x /usr/local/bin/file-sharer
   ```

---

## Checklist for Deployment

- [ ] Build AppImage and DEB packages
- [ ] Test packages on clean Ubuntu VM
- [ ] Create Git tag for release
- [ ] Push tag to GitHub
- [ ] Create GitHub release with binaries
- [ ] Write release notes
- [ ] Update README with installation instructions
- [ ] Test installation script
- [ ] Test systemd service
- [ ] Verify firewall configuration
- [ ] Test from multiple devices
- [ ] Document any issues

---

**Need help?** Open an issue on GitHub or check the main README.
