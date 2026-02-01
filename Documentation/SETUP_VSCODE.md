# Quick Setup Guide for VSCode

## Step 1: Open Project in VSCode

```bash
cd file-sharer
code .
```

## Step 2: Set up Python Environment

Open VSCode terminal (`` Ctrl+` ``) and run:

```bash
# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate  # Linux/Mac
# OR
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt
```

## Step 3: Run the Server

### Option A: Use startup script (Recommended)

```bash
./start_server.sh  # Linux/Mac
# OR
start_server.bat  # Windows
```

### Option B: Manual start

```bash
cd backend
python main.py
```

## Step 4: Access the App

Open your browser and go to:

- **On this computer:** http://localhost:8000
- **On other devices:** http://YOUR_LOCAL_IP:8000

Find your IP with:

- Linux: `hostname -I`
- Windows: `ipconfig`

## VSCode Extensions (Optional but Helpful)

- **Python** - Microsoft's Python extension
- **Pylance** - Python language server
- **Live Server** - For frontend development

## Debugging in VSCode

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: FastAPI",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": ["main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"],
      "cwd": "${workspaceFolder}/backend",
      "jinja": true
    }
  ]
}
```

Then press F5 to debug!

## File Structure Overview

```
file-sharer/
├── backend/           # Python FastAPI server
├── frontend/          # HTML/CSS/JS interface
├── electron/          # Desktop app (optional)
├── uploads/           # Temporary file storage
└── venv/              # Python virtual environment
```

Happy coding! 🚀
