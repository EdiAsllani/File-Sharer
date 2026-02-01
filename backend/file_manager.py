import os
from pathlib import Path
from typing import List

class FileManager:
    """
    Utility class for file operations
    """
    
    MAX_FILE_SIZE = 2*1024*1024*1024
    # Empty list = allow all
    ALLOWED_EXTENSIONS = []     # add restriction if needed: ['.pdf', '.png'...]
    
    @staticmethod
    def validate_file(filename: str, size: int) -> tuple[bool, str]:
        """ Validate file before upload """
        
        if size > FileManager.MAX_FILE_SIZE:
            return False, f"File too large. Max size: {FileManager.MAX_FILE_SIZE / (1024**3):.1f}GB"
        
        if FileManager.ALLOWED_EXTENSIONS:
            ext = Path(filename).suffix.lower()
            if ext not in FileManager.ALLOWED_EXTENSIONS:
                return False, f"File type not allowed. Allowed: {', '.join(FileManager.ALLOWED_EXTENSIONS)}"
            
        return True, ""


    @staticmethod
    def format_size(size_bytes: int) -> str:
        """ Convert bytes to readable format """
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size_bytes < 1024.0:
                return f"{size_bytes:.1f} {unit}"
            size_bytes /= 1024.0
        return f"{size_bytes:.1f} TB"
    
    
    @staticmethod
    def clean_directory(directory: Path, max_age_hours: int = 48):
        """ Clean up old files from directory """
        from datetime import datetime, timedelta
        
        if not directory.exists():
            return
        
        cutoff_time = datetime.now() - timedelta(hours=max_age_hours)
        
        for file_path in directory.iterdir():
            if file_path.is_file():
                file_time = datetime.fromtimestamp(file_path.stat().st_mtime)
                if file_time < cutoff_time:
                    try:
                        file_path.unlink()
                        print(f"Deleted old file: {file_path.name}")
                    except Exception as e:
                        print(f"Error deleting {file_path.name}: {e}")
                        
                        
    @staticmethod
    def get_safe_filename(filename: str) -> str:
        """ Sanitize filename to prevent directory traversal attacks """
        safe_name = Path(filename).name
        safe_name = safe_name.replace("..", "").replace("/", "").replace("\\", "")
        return safe_name or "unnamed_file"