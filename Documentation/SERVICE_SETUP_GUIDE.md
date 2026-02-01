# 🔧 Systemd Service & Desktop Entry Setup

## Files Included

1. **`file-sharer.service`** - Systemd service for auto-start on boot
2. **`file-sharer.desktop`** - Desktop entry for applications menu

---

## 📄 file-sharer.service

**Location in project:** `file-sharer/file-sharer.service`

**Content:**
```ini
[Unit]
Description=File Sharer - Local Network File Sharing
After=network.target

[Service]
Type=simple
User=%YOUR_USERNAME%
WorkingDirectory=/home/%YOUR_USERNAME%/file-sharer
ExecStart=/usr/bin/python3 /home/%YOUR_USERNAME%/file-sharer/backend/main.py
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal

# Environment variables
Environment="PYTHONUNBUFFERED=1"

[Install]
WantedBy=multi-user.target
```

### How to Install:

```bash
# Navigate to project directory
cd ~/file-sharer

# Replace %YOUR_USERNAME% with your actual username
sed -i "s/%YOUR_USERNAME%/$USER/g" file-sharer.service

# Copy to systemd directory
sudo cp file-sharer.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable (auto-start on boot)
sudo systemctl enable file-sharer.service

# Start now
sudo systemctl start file-sharer.service

# Check status
sudo systemctl status file-sharer.service
```

### What It Does:
- ✅ Starts File Sharer automatically when Ubuntu boots
- ✅ Restarts the service if it crashes
- ✅ Runs in the background (no terminal needed)
- ✅ Logs to system journal

### Service Commands:
```bash
sudo systemctl start file-sharer     # Start the service
sudo systemctl stop file-sharer      # Stop the service
sudo systemctl restart file-sharer   # Restart the service
sudo systemctl status file-sharer    # Check status
sudo systemctl enable file-sharer    # Enable auto-start
sudo systemctl disable file-sharer   # Disable auto-start
journalctl -u file-sharer -f         # View logs in real-time
```

---

## 📄 file-sharer.desktop

**Location in project:** `file-sharer/file-sharer.desktop`

**Content:**
```ini
[Desktop Entry]
Version=1.0
Type=Application
Name=File Sharer
Comment=Share files across your local network
Exec=/home/%YOUR_USERNAME%/file-sharer/file-sharer.AppImage
Icon=/home/%YOUR_USERNAME%/file-sharer/electron/icon.png
Terminal=false
Categories=Utility;Network;FileTransfer;
StartupNotify=true
```

### How to Install:

```bash
# Navigate to project directory
cd ~/file-sharer

# Replace %YOUR_USERNAME% with your actual username
sed -i "s/%YOUR_USERNAME%/$USER/g" file-sharer.desktop

# Create applications directory if it doesn't exist
mkdir -p ~/.local/share/applications

# Copy desktop file
cp file-sharer.desktop ~/.local/share/applications/

# Make it executable
chmod +x ~/.local/share/applications/file-sharer.desktop

# Update desktop database
update-desktop-database ~/.local/share/applications/ 2>/dev/null || true
```

### What It Does:
- ✅ Adds File Sharer to your applications menu
- ✅ Shows up in application search
- ✅ Can pin to favorites/dock
- ✅ Launches with icon

### Where to Find It:
- **GNOME:** Activities → Search "File Sharer"
- **KDE:** Application Launcher → Utilities → File Sharer
- **XFCE:** Applications Menu → Network → File Sharer

---

## 🎯 Quick Setup - Copy & Paste

### For Systemd Service (Auto-start on Boot):

```bash
cd ~/file-sharer
sed -i "s/%YOUR_USERNAME%/$USER/g" file-sharer.service
sudo cp file-sharer.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable file-sharer.service
sudo systemctl start file-sharer.service
echo "✅ Service installed and started!"
sudo systemctl status file-sharer.service
```

### For Desktop Entry (Application Menu):

```bash
cd ~/file-sharer
sed -i "s/%YOUR_USERNAME%/$USER/g" file-sharer.desktop
mkdir -p ~/.local/share/applications
cp file-sharer.desktop ~/.local/share/applications/
chmod +x ~/.local/share/applications/file-sharer.desktop
update-desktop-database ~/.local/share/applications/ 2>/dev/null || true
echo "✅ Desktop entry installed!"
```

---

## 🔍 Verification

### Check if Service is Running:
```bash
sudo systemctl status file-sharer.service
```

**Expected output:**
```
● file-sharer.service - File Sharer - Local Network File Sharing
     Loaded: loaded (/etc/systemd/system/file-sharer.service; enabled; vendor preset: enabled)
     Active: active (running) since ...
```

### Check if Desktop Entry Works:
1. Open application menu
2. Search for "File Sharer"
3. Click the icon
4. App should launch

### Test Auto-Start:
```bash
# Reboot the system
sudo reboot

# After reboot, check service status
sudo systemctl status file-sharer.service

# Should show "active (running)"
```

---

## 📝 Customization

### Change Installation Path

If you install File Sharer somewhere other than `~/file-sharer`, update the paths:

**In file-sharer.service:**
```ini
WorkingDirectory=/path/to/your/file-sharer
ExecStart=/usr/bin/python3 /path/to/your/file-sharer/backend/main.py
```

**In file-sharer.desktop:**
```ini
Exec=/path/to/your/file-sharer.AppImage
Icon=/path/to/your/file-sharer/electron/icon.png
```

### Change Port

Edit `backend/main.py` line ~277:
```python
uvicorn.run(app, host="0.0.0.0", port=8080)  # Change 8000 to 8080
```

Then restart the service:
```bash
sudo systemctl restart file-sharer.service
```

---

## 🐛 Troubleshooting

### Service Won't Start

**Check logs:**
```bash
journalctl -u file-sharer.service -n 50
```

**Common issues:**
- Python not found: Install with `sudo apt install python3`
- Permission denied: Check file permissions
- Port in use: Another service using port 8000

**Manual test:**
```bash
cd ~/file-sharer
python3 backend/main.py
```

### Desktop Entry Doesn't Appear

**Refresh desktop database:**
```bash
update-desktop-database ~/.local/share/applications/
```

**Check file location:**
```bash
ls -la ~/.local/share/applications/file-sharer.desktop
```

**Verify syntax:**
```bash
desktop-file-validate ~/.local/share/applications/file-sharer.desktop
```

---

## 📚 Additional Resources

- [Systemd Service Documentation](https://www.freedesktop.org/software/systemd/man/systemd.service.html)
- [Desktop Entry Specification](https://specifications.freedesktop.org/desktop-entry-spec/latest/)
- Project README: `README.md`
- Full deployment guide: `DEPLOYMENT.md`

---

**Both methods work independently:**
- Use **systemd service** for headless/server setups
- Use **desktop entry** for desktop/GUI usage
- Use **both** for maximum convenience!
