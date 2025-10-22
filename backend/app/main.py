from fastapi import FastAPI
from loguru import logger

# Configure logging
logger.add("logs/app.log", rotation="10 MB", level="INFO")

app = FastAPI(title="Video Programmer", version="0.1.0")

@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}