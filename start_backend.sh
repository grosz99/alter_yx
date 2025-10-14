#!/bin/bash

# Alter-thon Backend Startup Script
# This starts the FastAPI backend server

echo "========================================"
echo "  ALTER-THON - Starting Backend Server"
echo "========================================"
echo ""

# Check if we're in the right directory
if [ ! -f "backend/api/generate.py" ]; then
    echo "❌ Error: Must be run from the alter_yx directory"
    exit 1
fi

# Check if .env exists
if [ ! -f "backend/.env" ]; then
    echo "❌ Error: backend/.env file not found"
    echo "Please create backend/.env with your ANTHROPIC_API_KEY"
    exit 1
fi

# Check for API key
if ! grep -q "ANTHROPIC_API_KEY" backend/.env; then
    echo "❌ Error: ANTHROPIC_API_KEY not found in backend/.env"
    exit 1
fi

echo "✓ Configuration files found"
echo ""

# Check if uvicorn is installed
if ! command -v uvicorn &> /dev/null; then
    echo "⚠️  uvicorn not found. Installing dependencies..."
    cd backend
    pip install -r requirements.txt
    cd ..
fi

echo "✓ Dependencies ready"
echo ""
echo "Starting FastAPI server on http://localhost:8000"
echo "API docs will be available at http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop the server"
echo "========================================"
echo ""

cd backend
uvicorn api.generate:app --reload --port 8000 --host 0.0.0.0
