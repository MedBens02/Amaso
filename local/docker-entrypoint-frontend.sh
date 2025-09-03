#!/bin/bash
set -e

# Production entrypoint for Next.js Frontend (Git-based)

echo "Starting Next.js production setup from Git repository..."

# Wait for source files to be available
echo "Waiting for source files from git clone..."
while [ ! -f "/app/frontend/package.json" ]; do
    echo "Source files not ready, waiting 5 seconds..."
    sleep 5
done

echo "Source files detected! Setting up Next.js frontend..."

# Navigate to frontend directory
cd /app/frontend

# Install dependencies
echo "Installing Node.js dependencies..."
npm ci --only=production

# Build the application
echo "Building Next.js application..."
npm run build

echo "Next.js production setup complete!"

# Execute the main command
exec "$@"