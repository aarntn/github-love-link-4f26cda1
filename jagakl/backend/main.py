import logging
import os
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from webhook import router as webhook_router

app = FastAPI(
    title="JagaKL",
    description="WhatsApp-first AI triage for KL migrants, refugees, and B40 communities",
    version="0.1.0",
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
