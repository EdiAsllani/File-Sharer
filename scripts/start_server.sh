#!/bin/bash

# FILE SHARER -- LINUX STARTUP SCRIPT

echo "Starting File Sharer Server..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Virtual environment not found. Creating one..."
    python -m venv venv
fi

# Activate venv
source venv/bin/activate

# Install dependencies
if ! python -c "importing fastapi" 2>/dev/null; then
    echo "Installing dependencies..."
    pip install -r requirements.txt
fi

# Get local IP
LOCAL_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "Server starting on:"
echo "  • Local:    http://localhost:8000"
echo "  • Network:  http://$LOCAL_IP:8000"
echo ""
echo "Open this URL on any device in your local network"
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
python backend/main.py