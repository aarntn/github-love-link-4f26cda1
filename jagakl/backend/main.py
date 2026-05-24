import asyncio
import logging
import os
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)

import httpx
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from webhook import router as webhook_router

logger = logging.getLogger(__name__)


async def _keep_warm():
    """Ping our own health endpoint every 5 minutes to prevent Railway cold starts."""
    port = os.getenv("PORT", "8000")
    url = f"http://localhost:{port}/"
    await asyncio.sleep(30)  # wait for server to fully start
    while True:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                await client.get(url)
        except Exception:
            pass
        await asyncio.sleep(300)  # every 5 minutes


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(_keep_warm())
    yield
    task.cancel()


app = FastAPI(
    title="JagaKL",
    description="WhatsApp-first AI triage for KL migrants, refugees, and B40 communities",
    version="0.1.0",
    lifespan=lifespan,
)

# Allow Lovable frontend (and any origin during development) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(webhook_router)


@app.get("/")
async def health_check():
    return {"status": "ok", "service": "JagaKL"}
