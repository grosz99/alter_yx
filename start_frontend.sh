#!/bin/bash

# Alter-thon Frontend Startup Script
# This starts the React + Vite development server

echo "========================================"
echo "  ALTER-THON - Starting Frontend Server"
echo "========================================"
echo ""

# Check if we're in the right directory
if [ ! -f "frontend/package.json" ]; then
    echo "❌ Error: Must be run from the alter_yx directory"
    exit 1
fi

# Check if .env exists
if [ ! -f "frontend/.env" ]; then
    echo "⚠️  Creating frontend/.env with default backend URL..."
    echo "VITE_API_URL=http://localhost:8000" > frontend/.env
fi

echo "✓ Configuration files found"
echo ""

# Check if node_modules exists
if [ ! -d "frontend/node_modules" ]; then
    echo "⚠️  node_modules not found. Installing dependencies..."
    cd frontend
    npm install
    cd ..
fi

echo "✓ Dependencies ready"
echo ""
echo "Starting Vite development server on http://localhost:5173"
echo ""
echo "⚠️  IMPORTANT: Make sure the backend is running on http://localhost:8000"
echo "   (Run ./start_backend.sh in another terminal)"
echo ""
echo "Press Ctrl+C to stop the server"
echo "========================================"
echo ""

cd frontend
npm run dev
