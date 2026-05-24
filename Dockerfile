FROM python:3.12-slim

WORKDIR /app

# Install dependencies first (layer cache)
COPY jagakl/backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source and data — preserve relative paths so
# Path(__file__).parent.parent.parent / "data" resolves to /app/jagakl/data
COPY jagakl/backend/ jagakl/backend/
COPY jagakl/data/    jagakl/data/

WORKDIR /app/jagakl/backend

EXPOSE 8000

# Railway injects $PORT; default to 8000 locally
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
