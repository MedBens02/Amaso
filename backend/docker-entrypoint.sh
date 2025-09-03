#!/bin/bash
set -e

# Production entrypoint for Laravel

echo "Starting Laravel production setup..."

# Wait for database to be ready
echo "Waiting for database connection..."
until mysql -h"$DB_HOST" -u"$DB_USERNAME" -p"$DB_PASSWORD" -e "SELECT 1" >/dev/null 2>&1; do
    echo "Database not ready, waiting 5 seconds..."
    sleep 5
done

echo "Database connection established!"

# Clear and cache config for production
echo "Optimizing Laravel for production..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Set proper permissions
echo "Setting permissions..."
chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache
chmod -R 775 /var/www/storage /var/www/bootstrap/cache

echo "Laravel production setup complete!"

# Execute the main command
exec "$@"