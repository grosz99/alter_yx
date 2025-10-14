#!/bin/bash

# Quick test script to verify local setup is ready

echo "========================================"
echo "  ALTERWISE - Local Setup Verification"
echo "========================================"
echo ""

ERRORS=0

# Test 1: Check Python
echo "1️⃣  Checking Python..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo "   ✅ $PYTHON_VERSION"
else
    echo "   ❌ Python 3 not found"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Test 2: Check Node.js
echo "2️⃣  Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "   ✅ Node.js $NODE_VERSION"
else
    echo "   ❌ Node.js not found"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Test 3: Check npm
echo "3️⃣  Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "   ✅ npm $NPM_VERSION"
else
    echo "   ❌ npm not found"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Test 4: Check backend .env
echo "4️⃣  Checking backend configuration..."
if [ -f "backend/.env" ]; then
    if grep -q "ANTHROPIC_API_KEY" backend/.env; then
        # Check if it has a real value (not placeholder)
        API_KEY=$(grep "ANTHROPIC_API_KEY" backend/.env | cut -d '=' -f 2)
        if [ ! -z "$API_KEY" ] && [ "$API_KEY" != "your_api_key_here" ]; then
            echo "   ✅ backend/.env exists with API key"
        else
            echo "   ⚠️  backend/.env exists but API key looks like placeholder"
            echo "      Update with real Anthropic API key"
        fi
    else
        echo "   ❌ backend/.env missing ANTHROPIC_API_KEY"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "   ❌ backend/.env not found"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Test 5: Check frontend .env
echo "5️⃣  Checking frontend configuration..."
if [ -f "frontend/.env" ]; then
    echo "   ✅ frontend/.env exists"
else
    echo "   ⚠️  frontend/.env not found (will be created on first run)"
fi
echo ""

# Test 6: Check Python dependencies
echo "6️⃣  Checking Python dependencies..."
cd backend
MISSING_DEPS=0
for dep in fastapi uvicorn anthropic pandas; do
    if ! python3 -c "import $dep" 2>/dev/null; then
        echo "   ❌ Missing: $dep"
        MISSING_DEPS=$((MISSING_DEPS + 1))
    fi
done

if [ $MISSING_DEPS -eq 0 ]; then
    echo "   ✅ All Python dependencies installed"
else
    echo "   ⚠️  Missing $MISSING_DEPS dependencies"
    echo "      Run: cd backend && pip install -r requirements.txt"
fi
cd ..
echo ""

# Test 7: Check Node dependencies
echo "7️⃣  Checking Node.js dependencies..."
if [ -d "frontend/node_modules" ]; then
    echo "   ✅ Node modules installed"
else
    echo "   ⚠️  Node modules not found"
    echo "      Run: cd frontend && npm install"
fi
echo ""

# Test 8: Check ports
echo "8️⃣  Checking port availability..."
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "   ⚠️  Port 8000 already in use (backend port)"
    echo "      Something may already be running on this port"
else
    echo "   ✅ Port 8000 available (backend)"
fi

if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "   ⚠️  Port 5173 already in use (frontend port)"
    echo "      Something may already be running on this port"
else
    echo "   ✅ Port 5173 available (frontend)"
fi
echo ""

# Test 9: Test backend API (if running)
echo "9️⃣  Testing backend health..."
if curl -s http://localhost:8000/api/health >/dev/null 2>&1; then
    echo "   ✅ Backend is running and healthy!"
else
    echo "   ℹ️  Backend not running (this is OK if you haven't started it yet)"
fi
echo ""

# Summary
echo "========================================"
echo "  SUMMARY"
echo "========================================"
if [ $ERRORS -eq 0 ]; then
    echo "✅ Setup looks good! Ready to start servers."
    echo ""
    echo "To start:"
    echo "  Terminal 1: ./start_backend.sh"
    echo "  Terminal 2: ./start_frontend.sh"
    echo ""
    echo "Then open: http://localhost:5173"
else
    echo "⚠️  Found $ERRORS issues. Please fix them before starting."
fi
echo "========================================"
