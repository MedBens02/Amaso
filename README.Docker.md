# Docker Setup for Amaso Application

This Docker setup allows you to run the entire Amaso application (Next.js frontend + Laravel backend + MySQL database) on any PC with Docker installed using **Git-based deployment**.

## 📋 Prerequisites

- Docker Desktop installed and running
- Git installed
- Internet connection

## 🚀 Quick Start (Git-Based Deployment)

### Automated Deployment (Recommended)

```bash
# Clone the repository
git clone https://github.com/MedBens02/Amaso.git
cd Amaso/local

# Run automated deployment script
./deploy.sh

# Choose your deployment mode when prompted:
# 1 = Production (stable, optimized)
# 2 = Development (hot reload, debug mode)
```

### Manual Deployment

```bash
# Clone the repository
git clone https://github.com/MedBens02/Amaso.git
cd Amaso/local

# Production Mode
docker-compose up -d --build

# Development Mode (with hot reload)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

## 🌐 Access Your Application

Once deployment completes (5-10 minutes):
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:8001  
- **Database**: localhost:3307

## ⚙️ How Git-Based Deployment Works

### Automatic Setup Process
1. **Repository Clone**: Docker automatically clones code from https://github.com/MedBens02/Amaso.git
2. **Database Import**: Automatically imports `amaso.sql` with all tables and data
3. **Dependencies**: Installs all PHP (Composer) and Node.js (NPM) dependencies  
4. **Configuration**: Generates Laravel app keys and optimizes configurations
5. **Service Start**: Starts frontend, backend, and database with health monitoring

### Environment Configuration

The deployment automatically configures different environments:

**Production** (uses `local/.env`):
```bash
REPO_URL=https://github.com/MedBens02/Amaso.git
BRANCH=main
MYSQL_ROOT_PASSWORD=root_password
MYSQL_PASSWORD=amaso_password
NODE_ENV=production
APP_ENV=production
```

**Development** (uses `local/.env.dev`):
```bash  
REPO_URL=https://github.com/MedBens02/Amaso.git
BRANCH=main
MYSQL_ROOT_PASSWORD=root
MYSQL_PASSWORD=password
NODE_ENV=development
APP_ENV=local
```

### Database Setup

The MySQL database is automatically configured and populated:

**Connection Details:**
- **Host:** localhost (or `db` from containers)
- **Port:** 3306
- **Database:** amaso
- **Username:** amaso_user  
- **Password:** amaso_password (production) / password (development)
- **Root Password:** root_password (production) / root (development)

**Data Import:** The `amaso.sql` file is automatically imported during first startup, including:
- All application tables
- Sample widow records and reference data
- User accounts and permissions
- Configuration settings

**Note:** Uses direct SQL import instead of Laravel migrations for faster setup.

## Available Services

| Service | Description | Port | URL |
|---------|-------------|------|-----|
| init | Repository cloning service | - | - |
| db | MySQL 8.0 database | 3307 | localhost:3307 |
| db_init | Database import service | - | - |
| backend | Laravel API server | 8001 | http://localhost:8001 |
| frontend | Next.js application | 3001 | http://localhost:3001 |

## Common Commands

```bash
# Start services (from local/ directory)
docker-compose up -d

# Stop services
docker-compose down

# Update to latest code and rebuild
docker-compose down && docker-compose up -d --build

# View logs
docker-compose logs -f [service-name]

# View all logs in real-time
docker-compose logs -f --tail=100

# Access container shells
docker exec -it amaso_backend bash
docker exec -it amaso_frontend sh
docker exec -it amaso_db mysql -u root -proot_password

# Run Laravel commands
docker exec -it amaso_backend php artisan cache:clear
docker exec -it amaso_backend php artisan config:cache
docker exec -it amaso_backend composer install

# Database backup
docker exec amaso_db mysqldump -u root -proot_password amaso > backup_$(date +%Y%m%d).sql

# Force repository update (removes cached data)
docker-compose down -v
docker-compose up -d --build
```

## Troubleshooting

### Common Issues & Solutions

#### 1. Port Conflicts
**Problem:** "Port already in use" errors  
**Solution:**
```bash
# Check what's using the ports
netstat -an | findstr :3000
netstat -an | findstr :8000
netstat -an | findstr :3306

# Stop conflicting services or modify ports in docker-compose.yml
```

#### 2. Repository Clone Issues
**Problem:** Git clone fails or repository not accessible  
**Solution:**
```bash
# Test repository access
docker run --rm alpine/git git ls-remote https://github.com/MedBens02/Amaso.git

# Check init service logs
docker-compose logs init
```

#### 3. Database Connection Issues
**Problem:** Database connection errors or import fails  
**Solution:**
```bash
# Check database status
docker exec -it amaso_db mysql -u root -proot_password -e "SHOW DATABASES;"

# Check database import logs
docker-compose logs db_init

# Reset database (WARNING: This removes all data)
docker-compose down -v
docker-compose up --build
```

#### 4. Service Startup Issues
**Problem:** Containers exit or restart repeatedly  
**Solution:**
```bash
# Check service health
docker-compose ps

# View service logs for errors
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db
```

#### 5. Permission Issues
**Problem:** File permission errors  
**Solution:**
```bash
# Fix Laravel storage permissions
docker exec -it amaso_backend chown -R www-data:www-data /var/www/storage
docker exec -it amaso_backend chmod -R 775 /var/www/storage
```

### Complete Reset
If all else fails:
```bash
cd Amaso/local
docker-compose down -v
docker system prune -f
docker volume prune -f
docker-compose up -d --build
```

## Migration to New PC

### Quick Migration Steps:
1. **Install Docker Desktop** on the new PC
2. **Clone the repository:**
   ```bash
   git clone https://github.com/MedBens02/Amaso.git
   cd Amaso/local
   ```
3. **Deploy automatically:**
   ```bash
   ./deploy.sh
   ```
4. **Access the application** at http://localhost:3000

### Manual Migration:
1. Install Docker Desktop
2. Copy only the `/local` directory to the new PC
3. Run `docker-compose up -d --build`
4. Wait for automatic setup (5-10 minutes)

## Data Persistence & Backup

### Automatic Persistence:
- **Database data:** Stored in Docker volumes, persists across restarts
- **Application files:** Automatically pulled from Git repository
- **User uploads:** Stored in backend storage volume

### Manual Backup:
```bash
# Database backup with timestamp
docker exec amaso_db mysqldump -u root -proot_password amaso > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
docker exec -i amaso_db mysql -u root -proot_password amaso < backup_file.sql
```

## Production Deployment Considerations

For production environments:
- ✅ Use environment variables for sensitive data
- ✅ Set up SSL certificates and reverse proxy
- ✅ Configure proper logging and monitoring
- ✅ Use production branch (`main`) instead of development
- ✅ Set up automated health checks
- ✅ Consider Docker Swarm or Kubernetes for scaling
- ✅ Regular database backups and monitoring