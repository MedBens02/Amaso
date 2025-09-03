#!/bin/bash
set -e

# Production entrypoint for Laravel Backend (Git-based)

echo "Starting Laravel production setup from Git repository..."

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
    cp /var/www/.env.docker .env
fi

# Generate app key if not set
if ! grep -q "APP_KEY=base64:" .env || grep -q "APP_KEY=base64:GENERATE" .env; then
    echo "Generating application key..."
    php artisan key:generate
fi

# Install composer dependencies
echo "Installing PHP dependencies..."
composer install --no-dev --optimize-autoloader

# Install npm dependencies
echo "Installing Node.js dependencies..."
npm ci --only=production

# Wait for database to be ready
echo "Waiting for database connection..."
until mysql -h"$DB_HOST" -u"$DB_USERNAME" -p"$DB_PASSWORD" -e "SELECT 1" >/dev/null 2>&1; do
    echo "Database not ready, waiting 5 seconds..."
    sleep 5
done

echo "Database connection established!"

# Build assets
echo "Building production assets..."
npm run build

# Clear and cache config for production
echo "Optimizing Laravel for production..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Set proper permissions
echo "Setting permissions..."
chmod -R 775 storage bootstrap/cache

echo "Laravel production setup complete!"

# Execute the main command
exec "$@"