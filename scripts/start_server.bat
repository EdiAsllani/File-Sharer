@echo off
REM File Sharer -- Windows Startup Script

echo Starting File Sharer Server...

REM Check if virtual environment exists
if not exist "venv\" (
    echo Virtual environment not found. Creating one...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install dependencies if needed
python -c "import fastapi" 2>nul
if errorlevel 1 (
    echo Installing dependencies...
    pip install -r requirements.txt
)

REM Get local IP (Windows command)
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findestr /c:"IPv4 Address"') do set LOCAL_IP=%%a

echo.
echo Server starting on:
echo   - Local:    http://localhost:8000
echo   - Network:  http://%LOCAL_IP:8000
echo.
echo Open this URL on any device in your local Network
echo Press Ctrl+C to stop the Server
echo.

REM Start the server
cd backend
python main.py

pause
