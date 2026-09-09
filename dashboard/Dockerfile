# Multi-stage Docker build for agy-company dashboard
# Stage 1: Build the TypeScript/React frontend using Node.js
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Install frontend dependencies
COPY frontend/package*.json ./
RUN npm install

# Build frontend production bundle
COPY frontend/ ./
RUN npm run build

# Stage 2: Production Python backend runner
FROM python:3.11-slim
WORKDIR /app

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=3000

# Install Python backend dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application source code
COPY backend/ ./backend
COPY __init__.py ./
COPY backend/__init__.py ./backend/

# Copy built frontend assets from Stage 1 into backend static directory
COPY --from=frontend-builder /app/frontend/dist ./backend/static

# Expose web server port
EXPOSE 3000

# Run FastAPI with Uvicorn
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "3000"]
