# Quick Start Guide - Complete Workflow

From development to deployment in 4 steps.

## Step 1: Build the Desktop App

### On Your Arch PC

```bash
cd ~/Documents/Projects/File-Sharer-App

# Install Electron dependencies
cd electron
npm install

# Build the AppImage
npm run build:appimage

# Build DEB package
npm run build:deb

# Files will be in: electron/dist/
```

You'll get:

- `File-Sharer-1.0.0.AppImage` - Universal Linux package
- `file-sharer_1.0.0_amd64.deb` - Ubuntu/Debian package

---

## Step 2: Push to GitHub

### First Time Setup

```bash
cd ~/Documents/Projects/File-Sharer-App

# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Create repository on GitHub
# Go to https://github.com/new
# Name: file-sharer
# Don't initialize with README

# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/file-sharer.git

# Push
git branch -M main
git push -u origin main
```

### Create a Release

```bash
# Tag the release
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

Then on GitHub:

1. Go to your repo → Releases → "Draft a new release"
2. Choose tag: `v1.0.0`
3. Upload the AppImage and DEB files from `electron/dist/`
4. Publish release

---

## Step 3: Install on Ubuntu Laptop

### Method A: Automated Installation

```bash
# On Ubuntu laptop
wget https://raw.githubusercontent.com/YOUR_USERNAME/file-sharer/main/install-ubuntu.sh
chmod +x install-ubuntu.sh
./install-ubuntu.sh
```

Answer the prompts:

- Install as system service? **Y** (for auto-start on boot)
- Add to applications menu? **Y**
- Configure firewall? **Y**

### Method B: Manual Installation

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/file-sharer.git
cd file-sharer

# Install Python dependencies
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Test it works
./start_server.sh
```

Visit `http://localhost:8000` to verify.

---

## Step 4: Configure Auto-Start

### Option 1: Systemd Service (Background)

```bash
cd ~/file-sharer

# Edit service file with your username
sed -i "s/%YOUR_USERNAME%/$USER/g" file-sharer.service

# Install service
sudo cp file-sharer.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable file-sharer.service
sudo systemctl start file-sharer.service

# Verify it's running
sudo systemctl status file-sharer.service
```

**Service starts automatically on boot!**

Control commands:

```bash
sudo systemctl start file-sharer    # Start
sudo systemctl stop file-sharer     # Stop
sudo systemctl restart file-sharer  # Restart
sudo systemctl status file-sharer   # Check status
journalctl -u file-sharer -f        # View logs
```

### Option 2: Desktop App (GUI)

```bash
# Download AppImage from GitHub releases
# Or use the one you built

chmod +x File-Sharer-1.0.0.AppImage

# Install to system
sudo mv File-Sharer-1.0.0.AppImage /usr/local/bin/file-sharer

# Create desktop entry
sed -i "s/%YOUR_USERNAME%/$USER/g" file-sharer.desktop
mkdir -p ~/.local/share/applications
cp file-sharer.desktop ~/.local/share/applications/
```

**Launch from:** Applications menu → Utilities → File Sharer

### Option 3: Command Line Alias

Add to `~/.bashrc`:

```bash
alias filesharer='cd ~/file-sharer && ./start_server.sh'
```

Then just run: `filesharer`

---

## Summary Checklist

### Development (Arch PC)

- [x] Build AppImage: `cd electron && npm run build:appimage`
- [x] Build DEB: `npm run build:deb`
- [x] Test builds locally

### GitHub

- [x] Create repository
- [x] Push code: `git push origin main`
- [x] Create tag: `git tag v1.0.0`
- [x] Create release with binaries

### Ubuntu Laptop

- [x] Clone repository
- [x] Install dependencies
- [x] Test server: `./start_server.sh`
- [x] Install systemd service
- [x] Enable auto-start: `systemctl enable file-sharer`
- [x] Configure firewall: `ufw allow 8000`

### Verification

- [x] Service starts on boot
- [x] Can access from laptop: `http://localhost:8000`
- [x] Can access from phone: `http://LAPTOP_IP:8000`
- [x] Files transfer successfully
- [x] Desktop entry works (if installed)

---

## Quick Commands Reference

### On Arch PC (Development)

```bash
# Build desktop app
cd electron && npm run build:appimage

# Push to GitHub
git add . && git commit -m "Update" && git push
```

### On Ubuntu Laptop (Production)

```bash
# Start service
sudo systemctl start file-sharer

# Stop service
sudo systemctl stop file-sharer

# View logs
journalctl -u file-sharer -f

# Manual start
cd ~/file-sharer && ./start_server.sh

# Update from GitHub
cd ~/file-sharer && git pull && sudo systemctl restart file-sharer
```

### From Any Device

```
http://LAPTOP_IP:8000
```

---

## What You Get

✅ **Desktop app** - Native application with system tray
✅ **GitHub repository** - Version control and distribution
✅ **Auto-start on boot** - Systemd service starts automatically
✅ **Manual start option** - Launch from app menu or terminal
✅ **Cross-device access** - Phone, tablet, other PCs can connect
✅ **Easy updates** - Pull from GitHub and restart
