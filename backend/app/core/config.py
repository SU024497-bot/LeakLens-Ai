import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent.parent
TEMP_UPLOADS_DIR = BASE_DIR / "temp_uploads"
TEMP_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

class Settings(BaseModel):
    PROJECT_NAME: str = "LeakLens AI"
    VERSION: str = "1.0.0"
    TEAM_NAME: str = "Neural Nexus"
    TEAM_MEMBERS: list[str] = ["Aayush Varshney", "Sonali"]
    
    # Limits for local 8GB RAM environment
    MAX_FILE_SIZE_BYTES: int = 50 * 1024 * 1024  # 50 MB
    MAX_ROWS: int = 250_000
    MAX_COLUMNS: int = 500
    MAX_PROCESSING_TIMEOUT_SECONDS: int = 60
    
    # Storage
    TEMP_DIR: Path = TEMP_UPLOADS_DIR
    
    # CORS
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    
    # Brand
    COLOR_PRIMARY_INDIGO: str = "#282B4A"
    COLOR_VANILLA: str = "#EEEBDA"

settings = Settings()
