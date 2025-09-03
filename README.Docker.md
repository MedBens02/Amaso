# Docker Setup for Amaso Application

This Docker setup allows you to run the entire Amaso application (Next.js frontend + Laravel backend + MySQL database) on any PC with Docker installed.

## Prerequisites

- Docker Desktop installed
- Docker Compose v3.8 or higher

## Quick Start

### 1. Development Mode (with hot reload)

```bash
# Clone/copy the application to your new PC
# Navigate to the app directory
cd /path/to/amaso/app

# Start development environment
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# Database: localhost:3306
```

### 2. Production Mode

```bash
# Start production environment
docker-compose up --build -d

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# Nginx (if enabled): http://localhost:80
```

## Configuration

### Environment Variables

1. **For Development:**
   - Copy `.env.docker.dev` to `backend/.env`
   - Run `docker exec -it amaso_backend php artisan key:generate`

2. **For Production:**
   - Copy `.env.docker` to `backend/.env`
   - Run `docker exec -it amaso_backend php artisan key:generate`

### Database

The MySQL database will be automatically created and populated with data from `amaso.sql` on first run. The SQL file is automatically imported during database initialization - no migrations or seeders needed.

**Default Database Credentials:**
- **Database:** amaso
- **Username:** amaso_user  
- **Password:** amaso_password (production) / password (development)
- **Root Password:** root_password (production) / root (development)

**Note:** The application uses direct SQL import instead of Laravel migrations/seeders. All your existing data in `amaso.sql` will be automatically imported when the database container starts for the first time.

## Available Services

| Service | Description | Port | URL |
|---------|-------------|------|-----|
| frontend | Next.js application | 3000 | http://localhost:3000 |
| backend | Laravel API | 8000 | http://localhost:8000 |
| db | MySQL database | 3306 | localhost:3306 |
| nginx | Reverse proxy (production only) | 80 | http://localhost:80 |

## Common Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Rebuild containers
docker-compose up --build

# View logs
docker-compose logs -f [service-name]

# Access container shell
docker exec -it amaso_backend bash
docker exec -it amaso_frontend sh

# Run Laravel commands
docker exec -it amaso_backend php artisan cache:clear
docker exec -it amaso_backend php artisan config:cache

# Run database backup
docker exec amaso_db mysqldump -u root -proot_password amaso > backup.sql
```

## Troubleshooting

### Port Conflicts
If ports 3000, 8000, or 3306 are already in use:

1. Stop the conflicting services
2. Or modify ports in `docker-compose.yml`:
   ```yaml
   ports:
     - "3001:3000"  # Change 3000 to 3001
   ```

### Database Connection Issues
```bash
# Check database status
docker exec -it amaso_db mysql -u root -p -e "SHOW DATABASES;"

# Reset database
docker-compose down -v  # WARNING: This removes all data
docker-compose up --build
```

### Permission Issues
```bash
# Fix Laravel permissions
docker exec -it amaso_backend chown -R www-data:www-data /var/www/storage
docker exec -it amaso_backend chmod -R 775 /var/www/storage
```

## Migration to New PC

1. Copy the entire application directory
2. Install Docker Desktop on the new PC
3. Run `docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build`
4. The application will automatically set up and be ready to use

## Data Persistence

- Database data is stored in Docker volumes and persists across restarts
- To backup data: Use the mysqldump command above
- To restore data: Copy the SQL file to the container and import it

## Production Deployment

For production deployment, consider:
- Using environment variables for secrets
- Setting up SSL certificates
- Configuring proper logging
- Setting up monitoring and health checks
- Using Docker Swarm or Kubernetes for scaling