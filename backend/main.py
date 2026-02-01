from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os
import shutil
import uuid
from datetime import datetime, timedelta
from pathlib import Path
import asyncio
from typing import List
import aiofiles

# Storage configuration
# Use paths relative to the project root (one level up from backend/)
BASE_DIR = Path(__file__).parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

FRONTEND_DIR = BASE_DIR / "frontend"

# In-memory storage for file metadata and connected devices
# Why dict instead of database? Simple, fast, and we don't need persistence
files_storage = {}  # {file_id: {name, path, timestamp, size}}
connected_devices = {}  # {device_id: {name, ip, last_seen}}


# Lifespan context manager for startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("\n" + "="*50)
    print("🚀 File Sharer Server Starting")
    print("="*50)
    print(f"📂 Base Directory: {BASE_DIR.absolute()}")
    print(f"📂 Frontend Directory: {FRONTEND_DIR.absolute()}")
    print(f"📂 Upload Directory: {UPLOAD_DIR.absolute()}")
    print(f"✓ Frontend exists: {FRONTEND_DIR.exists()}")
    if FRONTEND_DIR.exists():
        print(f"✓ Frontend files: {list(FRONTEND_DIR.iterdir())}")
    print("="*50 + "\n")
    
    yield
    
    # Shutdown (cleanup if needed)
    print("\n🛑 Server shutting down...")


# Create FastAPI app with lifespan
app = FastAPI(title="File Sharer", lifespan=lifespan)

# CORS configuration - allows requests from any local network device
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, you'd restrict this to local IPs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.post("/api/register-device")
async def register_device(device_info: dict):
    """
    Register a device on the network
    Device sends: {name: str, ip: str}
    
    Why separate registration? Allows us to track devices even when
    they're not actively transferring files
    """
    device_id = str(uuid.uuid4())
    connected_devices[device_id] = {
        "id": device_id,
        "name": device_info.get("name", "Unknown Device"),
        "ip": device_info.get("ip", "Unknown"),
        "last_seen": datetime.now()
    }
    return {"device_id": device_id, "status": "registered"}


@app.get("/api/devices")
async def get_devices():
    """
    Get list of all registered devices
    
    Automatically removes devices not seen in last 5 minutes
    (indicates they disconnected or went offline)
    """
    current_time = datetime.now()
    # Clean up old devices
    devices_to_remove = [
        dev_id for dev_id, dev in connected_devices.items()
        if (current_time - dev["last_seen"]).seconds > 300  # 5 minutes
    ]
    for dev_id in devices_to_remove:
        del connected_devices[dev_id]
    
    return {"devices": list(connected_devices.values())}


@app.post("/api/heartbeat/{device_id}")
async def heartbeat(device_id: str):
    """
    Keep device connection alive
    Devices should call this every 60 seconds to stay in the device list
    """
    if device_id in connected_devices:
        connected_devices[device_id]["last_seen"] = datetime.now()
        return {"status": "ok"}
    return {"status": "device_not_found"}


@app.post("/api/upload")
async def upload_files(
    files: List[UploadFile] = File(...),
    target_device: str = None,
    background_tasks: BackgroundTasks = None
):
    """
    Handle multi-file upload
    
    Why async file operations? Prevents blocking the server during large uploads
    Files are saved with UUID names to avoid conflicts
    """
    uploaded_files = []
    
    for file in files:
        file_id = str(uuid.uuid4())
        file_extension = Path(file.filename).suffix
        safe_filename = f"{file_id}{file_extension}"
        file_path = UPLOAD_DIR / safe_filename
        
        # Async file writing - won't block other requests
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        # Store metadata
        files_storage[file_id] = {
            "id": file_id,
            "original_name": file.filename,
            "path": str(file_path),
            "timestamp": datetime.now(),
            "size": len(content),
            "target_device": target_device
        }
        
        uploaded_files.append({
            "file_id": file_id,
            "name": file.filename,
            "size": len(content)
        })
        
        # Schedule deletion after 48 hours
        if background_tasks:
            background_tasks.add_task(
                schedule_deletion, 
                file_id, 
                file_path, 
                hours=48
            )
    
    return {
        "status": "success",
        "files": uploaded_files,
        "message": f"Uploaded {len(uploaded_files)} file(s)"
    }


@app.get("/api/files")
async def list_files():
    """Get all available files (not yet auto-deleted)"""
    # Clean up expired files first
    current_time = datetime.now()
    expired = [
        fid for fid, fdata in files_storage.items()
        if (current_time - fdata["timestamp"]) > timedelta(hours=48)
    ]
    for fid in expired:
        cleanup_file(fid)
    
    return {"files": list(files_storage.values())}


@app.get("/api/download/{file_id}")
async def download_file(file_id: str, background_tasks: BackgroundTasks):
    """
    Download a file by ID
    
    After successful download, schedule immediate deletion
    Why immediate? User requested one-time transfer, file no longer needed
    """
    if file_id not in files_storage:
        raise HTTPException(status_code=404, detail="File not found")
    
    file_info = files_storage[file_id]
    file_path = Path(file_info["path"])
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    # Schedule cleanup after download completes
    background_tasks.add_task(cleanup_file, file_id)
    
    return FileResponse(
        path=file_path,
        filename=file_info["original_name"],
        media_type="application/octet-stream"
    )


@app.delete("/api/delete/{file_id}")
async def delete_file(file_id: str):
    """Manual file deletion endpoint"""
    cleanup_file(file_id)
    return {"status": "deleted"}


def cleanup_file(file_id: str):
    """
    Remove file from disk and memory
    
    Why separate function? Called from multiple places:
    - After download (immediate cleanup)
    - After 48 hours (scheduled cleanup)
    - Manual deletion
    """
    if file_id in files_storage:
        file_path = Path(files_storage[file_id]["path"])
        if file_path.exists():
            file_path.unlink()
        del files_storage[file_id]


async def schedule_deletion(file_id: str, file_path: Path, hours: int):
    """
    Background task for scheduled file deletion
    
    Waits 48 hours then deletes file if still present
    Why async sleep? Doesn't block the server while waiting
    """
    await asyncio.sleep(hours * 3600)
    cleanup_file(file_id)


# Server info endpoint
@app.get("/api/info")
async def server_info():
    """Provides server status and stats"""
    return {
        "status": "running",
        "files_count": len(files_storage),
        "devices_count": len(connected_devices),
        "upload_dir": str(UPLOAD_DIR.absolute())
    }


# Serve the main HTML page
@app.get("/")
async def root():
    """Serve the main HTML page"""
    return FileResponse(str(FRONTEND_DIR / "index.html"))


# Mount static files LAST (after all routes)
# This ensures /api routes take precedence over static file serving
app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")


if __name__ == "__main__":
    import uvicorn
    # Only bind to all interfaces (0.0.0.0) so other devices can connect
    # Port 8000 is standard for dev servers
    uvicorn.run(app, host="0.0.0.0", port=8000)