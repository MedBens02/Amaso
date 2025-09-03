#!/bin/bash

# Docker Setup Validation Script for Amaso Application

echo "=== Docker Setup Validation for Amaso Application ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
    fi
}

# Check if Docker is installed
echo "1. Checking Docker installation..."
docker --version > /dev/null 2>&1
print_status $? "Docker is installed"

# Check if Docker Compose is installed
echo ""
echo "2. Checking Docker Compose installation..."
docker-compose --version > /dev/null 2>&1
print_status $? "Docker Compose is installed"

# Check if required files exist
echo ""
echo "3. Checking required Docker files..."

files=(
    "docker-compose.yml"
    "docker-compose.dev.yml"
    "backend/Dockerfile"
    "backend/Dockerfile.dev"
    "frontend/Dockerfile" 
    "frontend/Dockerfile.dev"
    "backend/docker-entrypoint.sh"
    "backend/docker-entrypoint.dev.sh"
    "amaso.sql"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        print_status 0 "$file exists"
    else
        print_status 1 "$file missing"
    fi
done

# Check if ports are available
echo ""
echo "4. Checking port availability..."

check_port() {
    (echo >/dev/tcp/localhost/$1) >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        print_status 1 "Port $1 is already in use"
        return 1
    else
        print_status 0 "Port $1 is available"
        return 0
    fi
}

check_port 3000  # Frontend
check_port 8000  # Backend
check_port 3306  # Database

# Check directory structure
echo ""
echo "5. Checking directory structure..."

dirs=(
    "frontend"
    "backend"
    "backend/app"
    "backend/database"
    "frontend/components"
)

for dir in "${dirs[@]}"; do
    if [ -d "$dir" ]; then
        print_status 0 "$dir directory exists"
    else
        print_status 1 "$dir directory missing"
    fi
done

# Check Laravel backend files
echo ""
echo "6. Checking Laravel backend files..."

laravel_files=(
    "backend/artisan"
    "backend/composer.json"
    "backend/app/Http/Controllers"
)

for file in "${laravel_files[@]}"; do
    if [ -e "$file" ]; then
        print_status 0 "$file exists"
    else
        print_status 1 "$file missing"
    fi
done

# Check Next.js frontend files  
echo ""
echo "7. Checking Next.js frontend files..."

nextjs_files=(
    "frontend/package.json"
    "frontend/next.config.mjs"
    "frontend/components"
)

for file in "${nextjs_files[@]}"; do
    if [ -e "$file" ]; then
        print_status 0 "$file exists"
    else
        print_status 1 "$file missing"
    fi
done

echo ""
echo "=== Validation Complete ==="
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. If all checks pass, run: docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build"
echo "2. Access frontend at: http://localhost:3000"
echo "3. Access backend API at: http://localhost:8000"
echo "4. For production: docker-compose up --build -d"
echo ""
echo -e "${YELLOW}Note:${NC} Make sure to copy .env.docker.dev to backend/.env before running!"