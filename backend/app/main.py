import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.core.config import settings
from backend.app.api.endpoints import router as api_router
from backend.app.services.cleanup import cleanup_stale_temp_files

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("leaklens.app")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Clean up any stale temporary files from previous runs
    logger.info("Initializing LeakLens AI Backend...")
    cleaned = cleanup_stale_temp_files(max_age_seconds=1800)
    logger.info(f"Startup maintenance: removed {cleaned} stale temporary files.")
    yield
    # Shutdown: Clean up remaining temp files
    logger.info("Shutting down LeakLens AI Backend...")
    cleanup_stale_temp_files(max_age_seconds=0)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Automated dataset quality auditing and potential machine-learning data leakage detection.",
    lifespan=lifespan
)

# CORS Configuration for local frontend origins only
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes
app.include_router(api_router, prefix="/api")

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled error on {request.url.path}")
    return JSONResponse(
        status_code=500,
        content={
            "error_code": "INTERNAL_SERVER_ERROR",
            "detail": "An unexpected error occurred while processing the request."
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
