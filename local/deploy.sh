#!/bin/bash

# Quick deployment script for Amaso Git-based Docker setup

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Amaso Git-Based Docker Deployment${NC}"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

if ! command_exists docker; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

if ! command_exists docker-compose; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker and Docker Compose are installed${NC}"

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found${NC}"
    echo -e "${BLUE}Creating .env file from template...${NC}"
    
    if [ -f .env.example ]; then
        cp .env.example .env
    else
        cp .env .env
    fi
    
    echo -e "${YELLOW}📝 Please edit .env file and set your REPO_URL:${NC}"
    echo "   REPO_URL=https://github.com/yourusername/amaso.git"
    echo ""
    read -p "Press Enter after editing .env file..."
fi

# Load environment variables
source .env

# Validate REPO_URL
if [[ $REPO_URL == *"yourusername"* ]] || [ -z "$REPO_URL" ]; then
    echo -e "${RED}❌ Please set a valid REPO_URL in .env file${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Configuration validated${NC}"

# Ask for deployment mode
echo ""
echo -e "${BLUE}🎯 Select deployment mode:${NC}"
echo "1) Production (stable, optimized)"
echo "2) Development (hot reload, debug)"
echo ""
read -p "Enter choice (1 or 2): " mode

case $mode in
    1)
        echo -e "${BLUE}🏭 Starting production deployment...${NC}"
        COMPOSE_FILE="docker-compose.yml"
        ;;
    2)
        echo -e "${BLUE}🔧 Starting development deployment...${NC}"
        COMPOSE_FILE="docker-compose.yml -f docker-compose.dev.yml"
        ;;
    *)
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac

# Clean up previous deployment if requested
echo ""
read -p "🧹 Clean up previous deployment? (y/N): " cleanup

if [[ $cleanup =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🧹 Cleaning up previous deployment...${NC}"
    docker-compose down -v 2>/dev/null || true
    docker system prune -f >/dev/null 2>&1 || true
fi

# Start deployment
echo ""
echo -e "${BLUE}🚀 Starting deployment...${NC}"
echo "Repository: $REPO_URL"
echo "Branch: ${BRANCH:-main}"
echo ""

# Run docker-compose
if eval "docker-compose $COMPOSE_FILE up -d --build"; then
    echo ""
    echo -e "${GREEN}🎉 Deployment successful!${NC}"
    echo ""
    echo -e "${BLUE}📍 Access your application:${NC}"
    echo "   Frontend:  http://localhost:3000"
    echo "   Backend:   http://localhost:8000"
    echo "   Database:  localhost:3306"
    echo ""
    echo -e "${BLUE}📊 Monitor deployment:${NC}"
    echo "   docker-compose logs -f"
    echo "   docker-compose ps"
    echo ""
    
    # Wait for services to be healthy
    echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
    sleep 10
    
    # Check service status
    if docker-compose ps | grep -q "Up"; then
        echo -e "${GREEN}✅ Services are running!${NC}"
        
        # Optional: Open browser
        read -p "🌐 Open application in browser? (y/N): " open_browser
        if [[ $open_browser =~ ^[Yy]$ ]]; then
            if command_exists xdg-open; then
                xdg-open http://localhost:3000
            elif command_exists open; then
                open http://localhost:3000
            elif command_exists start; then
                start http://localhost:3000
            else
                echo "Please open http://localhost:3000 in your browser"
            fi
        fi
    else
        echo -e "${YELLOW}⚠️  Some services may still be starting up${NC}"
        echo "Run 'docker-compose logs -f' to monitor progress"
    fi
    
else
    echo ""
    echo -e "${RED}❌ Deployment failed${NC}"
    echo "Check the logs with: docker-compose logs"
    exit 1
fi