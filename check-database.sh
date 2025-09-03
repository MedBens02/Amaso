#!/bin/bash

# Database Import Verification Script

echo "=== Checking Database Import Status ==="

# Check if containers are running
if ! docker ps | grep -q amaso_db; then
    echo "❌ Database container is not running. Please start with: docker-compose up"
    exit 1
fi

echo "✅ Database container is running"

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Check if database exists and has tables
echo "🔍 Checking database structure..."

# Connect to database and list tables
TABLES=$(docker exec amaso_db mysql -u amaso_user -ppassword amaso -e "SHOW TABLES;" 2>/dev/null | grep -v "Tables_in_amaso" | wc -l)

if [ $TABLES -gt 0 ]; then
    echo "✅ Database imported successfully! Found $TABLES tables."
    
    # Show some key tables
    echo ""
    echo "📋 Key tables found:"
    docker exec amaso_db mysql -u amaso_user -ppassword amaso -e "SHOW TABLES;" 2>/dev/null | grep -E "(partner_fields|widows|users|partners)" || true
    
    # Check partner_fields data (the one we were testing)
    echo ""
    echo "🔍 Partner fields data:"
    docker exec amaso_db mysql -u amaso_user -ppassword amaso -e "SELECT id, label FROM partner_fields LIMIT 5;" 2>/dev/null || echo "Could not query partner_fields"
    
else
    echo "❌ Database import failed or no tables found."
    echo "💡 The amaso.sql file should be automatically imported on first container start."
    echo "🔄 Try: docker-compose down -v && docker-compose up --build"
fi

echo ""
echo "=== Database Check Complete ==="