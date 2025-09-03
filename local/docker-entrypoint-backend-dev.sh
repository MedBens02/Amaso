#!/bin/bash
set -e

# Development entrypoint for Laravel Backend (Git-based)

echo "Starting Laravel development setup from Git repository..."

# Wait for source files to be available
echo "Waiting for source files from git clone..."
while [ ! -f "/var/www/backend/artisan" ]; do
    echo "Source files not ready, waiting 5 seconds..."
    sleep 5
done

echo "Source files detected! Setting up Laravel backend..."

# Navigate to backend directory
cd /var/www/backend

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp /var/www/.env.docker.dev .env
fi

# Generate app key if not set
if ! grep -q "APP_KEY=base64:" .env || grep -q "APP_KEY=base64:GENERATE" .env; then
    echo "Generating application key..."
    php artisan key:generate
fi

# Install composer dependencies (including dev)
echo "Installing PHP dependencies (with dev packages)..."
composer install

# Install npm dependencies (including dev)
echo "Installing Node.js dependencies (with dev packages)..."
npm install

# Wait for database to be ready
echo "Waiting for database connection..."
until mysql -h"$DB_HOST" -u"$DB_USERNAME" -p"$DB_PASSWORD" -e "SELECT 1" >/dev/null 2>&1; do
    echo "Database not ready, waiting 5 seconds..."
    sleep 5
done

echo "Database connection established!"

# Clear caches for development
echo "Clearing caches for development..."
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear

# Set proper permissions
echo "Setting permissions..."
chmod -R 775 storage bootstrap/cache

echo "Laravel development setup complete!"

# Start both Laravel serve and Vite in background for development
if [ "$1" = "php" ] && [ "$2" = "artisan" ] && [ "$3" = "serve" ]; then
    echo "Starting Laravel development server and Vite..."
    # Start Vite in background
    npm run dev &
    # Start Laravel server in foreground
    exec "$@"
else
    # Execute the main command as-is
    exec "$@"
fi