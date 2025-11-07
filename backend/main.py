import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.hands import router as hands_router
from src.database.connection import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup."""
    # init_db()
    yield
    
app = FastAPI(title="Poker API", version="1.0.0", lifespan=lifespan)

#CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(hands_router, prefix="/api/hands", tags=["hands"])

@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "message": "Poker API is running"}
