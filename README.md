# File Sharer

A local network file sharing application with desktop app support. Share files seamlessly between your devices (PC, laptop, phone, tablet) without internet or cloud services.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Linux%20%7C%20Windows-lightgrey.svg)

## Features

- **Multi-file uploads** - Send multiple files at once
- **Desktop App** - Native Electron application
- **Cross-platform** - Works on Windows, Linux, macOS, Android, iOS
- **No mobile installation** - Just open a browser
- **Auto-discovery** - See all connected devices automatically
- **Auto-cleanup** - Files deleted after transfer or 48 hours
- **Modern UI** - Clean, responsive interface
- **Boot on startup** - Optional systemd service for Linux

## Quick Start

### Option 1: Desktop App (Recommended)

#### Download

Go to [Releases](../../releases) and download the AppImage for Linux or installer for Windows.

#### Linux (AppImage)

```bash
chmod +x File-Sharer-*.AppImage
./File-Sharer-*.AppImage
```

#### Windows

Run the installer `.exe` file.

### Option 2: Run from Source

#### Prerequisites

- Python 3.11+
- Node.js 16+ (for desktop app)

#### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/file-sharer.git
cd file-sharer

# Install Python dependencies
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run the backend server
./start_server.sh  # On Windows: start_server.bat
```

Open `http://localhost:8000` in your browser.

## Usage

### Sending Files

1. Open the app on your device
2. Click **"Choose Files"** and select one or more files
3. Select the target device from the dropdown
4. Click **"Send Files"**

### Receiving Files

1. Open the app on your device
2. Check the **"Available Files"** section
3. Click **"Download"** on any file

Files are automatically deleted after download or after 48 hours.

## Desktop App Development

### Build from Source

```bash
cd electron
npm install
npm run build:appimage  # For AppImage
npm run build:deb       # For .deb package
npm run build:all       # For all Linux formats
```

Built files will be in `electron/dist/`

### Run in Development Mode

```bash
cd electron
npm install
npm start
```

## Ubuntu Installation & Auto-Start

### Install on Ubuntu LTS

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/file-sharer.git
cd file-sharer

# Install Python dependencies
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Install the desktop app (if using AppImage)
chmod +x File-Sharer-*.AppImage
sudo mv File-Sharer-*.AppImage /usr/local/bin/file-sharer
```

### Auto-Start on Boot (Systemd Service)

```bash
# Edit the service file with your username
sed -i "s/%YOUR_USERNAME%/$USER/g" file-sharer.service

# Copy service file
sudo cp file-sharer.service /etc/systemd/system/

# Enable and start the service
sudo systemctl enable file-sharer.service
sudo systemctl start file-sharer.service

# Check status
sudo systemctl status file-sharer.service
```

### Launch from Applications Menu

```bash
# Edit desktop file with your username
sed -i "s/%YOUR_USERNAME%/$USER/g" file-sharer.desktop

# Install desktop entry
mkdir -p ~/.local/share/applications
cp file-sharer.desktop ~/.local/share/applications/

# Make it executable
chmod +x ~/.local/share/applications/file-sharer.desktop
```

Now you can launch File Sharer from your applications menu!

### Start on Demand

```bash
# Using the script
cd ~/file-sharer
./start_server.sh

# Or using systemd
sudo systemctl start file-sharer.service

# Or using the AppImage
/usr/local/bin/file-sharer
```

## Network Setup

### Find Your Server IP

```bash
# Linux
ip addr show | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig

# Look for something like: 192.168.1.100
```

### Connect from Other Devices

On your phone/tablet, open a browser and go to:

```
http://YOUR_SERVER_IP:8000
```

Example: `http://192.168.0.26:8000`

### Firewall Configuration

**Linux (UFW):**

```bash
sudo ufw allow 8000/tcp
```

**Linux (Firewalld):**

```bash
sudo firewall-cmd --add-port=8000/tcp --permanent
sudo firewall-cmd --reload
```

**Windows:**
Go to Windows Defender Firewall → Allow an app → Add port 8000

## Security

This app is designed for **local network use only**.

**Built-in security:**

- ✅ Temporary file storage
- ✅ Auto-deletion after transfer
- ✅ Local network only (no internet exposure)

**⚠️ Do NOT expose to the internet** without adding:

- Authentication
- HTTPS/SSL
- Rate limiting

## Project Structure

```
file-sharer/
├── backend/              # Python FastAPI server
│   ├── main.py
│   ├── device_discovery.py
│   └── file_manager.py
├── frontend/             # Web interface
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── electron/             # Desktop app
│   ├── main.js
│   ├── package.json
│   └── error.html
├── uploads/              # Temporary file storage
├── file-sharer.service   # Systemd service file
├── file-sharer.desktop   # Desktop entry
├── requirements.txt      # Python dependencies
└── README.md
```

## Troubleshooting

### Can't connect from other devices

- Check firewall settings
- Ensure all devices are on the same WiFi network
- Verify server is running on `0.0.0.0:8000` not `127.0.0.1:8000`

### Desktop app won't start

- Ensure Python 3 is installed
- Check that port 8000 is available
- Run `python3 backend/main.py` manually to see errors

### Files not appearing

- Click the "Refresh" button
- Check browser console for errors (F12)
- Verify the `uploads/` directory exists

## Development

### Run Backend with Auto-Reload

```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Debug Mode

Press `Ctrl+Shift+I` in the desktop app to open DevTools.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [FastAPI](https://fastapi.tiangolo.com/)
- Desktop app powered by [Electron](https://www.electronjs.org/)
- UI inspired by modern web design principles
