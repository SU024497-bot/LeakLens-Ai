from pathlib import Path
from backend.app.services.cleanup import temporary_upload_file, cleanup_stale_temp_files
from backend.app.core.config import settings

def test_temporary_upload_file_cleanup_on_success():
    created_path = None
    with temporary_upload_file(".csv") as path:
        created_path = path
        path.write_text("temporary data", encoding="utf-8")
        assert path.exists()
        
    # After exiting with block, file must be unconditionally deleted
    assert not created_path.exists()

def test_temporary_upload_file_cleanup_on_exception():
    created_path = None
    try:
        with temporary_upload_file(".xlsx") as path:
            created_path = path
            path.write_text("temporary data", encoding="utf-8")
            assert path.exists()
            raise ValueError("Simulated parsing crash")
    except ValueError:
        pass
        
    # After exception, file must still be guaranteed deleted
    assert not created_path.exists()

def test_cleanup_stale_files(tmp_path):
    settings.TEMP_DIR = tmp_path
    stale_file = tmp_path / "upload_old.tmp"
    stale_file.write_text("old", encoding="utf-8")
    
    # Run cleanup with 0 seconds threshold (cleans all existing)
    cleaned = cleanup_stale_temp_files(max_age_seconds=0)
    assert cleaned >= 1
    assert not stale_file.exists()
