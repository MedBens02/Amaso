#!/bin/bash
set -e

# Development entrypoint for Next.js Frontend (Git-based)

echo "Starting Next.js development setup from Git repository..."

# Wait for source files to be available
echo "Waiting for source files from git clone..."
while [ ! -f "/app/frontend/package.json" ]; do
    echo "Source files not ready, waiting 5 seconds..."
    sleep 5
done

echo "Source files detected! Setting up Next.js frontend..."

# Navigate to frontend directory
cd /app/frontend

# Install dependencies (including dev dependencies)
echo "Installing Node.js dependencies (with dev packages)..."
npm install

echo "Next.js development setup complete!"

# Execute the main command
exec "$@"