#!/bin/bash
set -e

# Development entrypoint for Laravel

echo "Starting Laravel development setup..."

# Generate app key if not exists
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
fi

# Generate application key if it doesn't exist
if ! grep -q "APP_KEY=base64:" .env; then
    echo "Generating application key..."
    php artisan key:generate
fi

# Wait for database to be ready
echo "Waiting for database connection..."
until mysql -h"$DB_HOST" -u"$DB_USERNAME" -p"$DB_PASSWORD" -e "SELECT 1" >/dev/null 2>&1; do
    echo "Database not ready, waiting 5 seconds..."
    sleep 5
done

echo "Database connection established!"

# Install/update composer dependencies if needed
if [ ! -d "vendor" ] || [ composer.json -nt vendor/autoload.php ]; then
    echo "Installing/updating composer dependencies..."
    composer install
fi

# Install/update npm dependencies if needed
if [ ! -d "node_modules" ] || [ package.json -nt node_modules/.package-lock.json ]; then
    echo "Installing/updating npm dependencies..."
    npm install
fi

# Clear caches for development
echo "Clearing caches for development..."
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear

# Set proper permissions
echo "Setting permissions..."
chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache
chmod -R 775 /var/www/storage /var/www/bootstrap/cache

echo "Laravel development setup complete!"

# Execute the main command
exec "$@"