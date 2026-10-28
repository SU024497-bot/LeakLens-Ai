import os
import shutil
import time
import uuid
import logging
from pathlib import Path
from contextlib import contextmanager
from typing import Generator
from backend.app.core.config import settings

logger = logging.getLogger("leaklens.cleanup")

def ensure_temp_dir() -> Path:
    temp_dir = settings.TEMP_DIR
    temp_dir.mkdir(parents=True, exist_ok=True)
    return temp_dir

def cleanup_stale_temp_files(max_age_seconds: int = 3600) -> int:
    """Removes temporary files older than max_age_seconds during startup or periodic maintenance."""
    temp_dir = ensure_temp_dir()
    cleaned_count = 0
    now = time.time()
    
    try:
        for item in temp_dir.iterdir():
            try:
                if item.is_file():
                    age = now - item.stat().st_mtime
                    if age > max_age_seconds:
                        item.unlink(missing_ok=True)
                        cleaned_count += 1
                elif item.is_dir():
                    age = now - item.stat().st_mtime
                    if age > max_age_seconds:
                        shutil.rmtree(item, ignore_errors=True)
                        cleaned_count += 1
            except Exception as e:
                logger.warning(f"Failed to clean item {item}: {e}")
    except Exception as e:
        logger.error(f"Error accessing temp directory {temp_dir}: {e}")
        
    logger.info(f"Cleaned up {cleaned_count} stale temporary items on startup.")
    return cleaned_count

@contextmanager
def temporary_upload_file(file_extension: str = "") -> Generator[Path, None, None]:
    """
    Context manager that yields a securely generated local temporary path,
    and unconditionally guarantees deletion in finally block.
    """
    temp_dir = ensure_temp_dir()
    safe_filename = f"upload_{uuid.uuid4().hex[:16]}{file_extension}"
    safe_path = temp_dir / safe_filename
    
    try:
        yield safe_path
    finally:
        try:
            if safe_path.exists():
                safe_path.unlink(missing_ok=True)
                logger.debug(f"Securely deleted temporary file {safe_path.name}")
        except Exception as e:
            logger.warning(f"Could not remove temporary file {safe_path}: {e}")
