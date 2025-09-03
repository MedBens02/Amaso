# Git-Based Docker Deployment for Amaso

This directory contains Docker configuration files for deploying the Amaso application directly from a Git repository. Instead of copying files locally, the containers will clone the repository and set up the application automatically.

## 🚀 Quick Deployment

### Prerequisites
- Docker Desktop installed
- Git repository with your Amaso application
- Repository should be publicly accessible or you have authentication set up

### 1. Production Deployment

```bash
# Clone or copy just the /local directory to your deployment machine
git clone <your-repo-url>
cd amaso/local

# Configure the repository URL
cp .env.example .env
nano .env  # Edit REPO_URL to point to your repository

# Deploy the application
docker-compose up -d --build

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
```

### 2. Development Deployment

```bash
# Use development configuration
cp .env.dev.example .env
nano .env  # Edit REPO_URL and set BRANCH=develop

# Start development environment
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Access with hot reload enabled
# Frontend: http://localhost:3000 (with hot reload)
# Backend API: http://localhost:8000 (with hot reload)
```

## 📁 What Gets Deployed

The deployment process:

1. **Repository Clone**: Clones your Git repository into a shared Docker volume
2. **Database Setup**: Creates MySQL database and imports `amaso.sql` automatically
3. **Backend Setup**: Installs PHP/Composer dependencies, configures Laravel
4. **Frontend Setup**: Installs Node.js dependencies, builds Next.js application
5. **Service Start**: Starts all services with proper health checks

## 🔧 Configuration

### Environment Variables (.env file)

```bash
# Required: Your Git repository URL
REPO_URL=https://github.com/yourusername/amaso.git

# Branch to deploy (main/master for production, develop for development)
BRANCH=main

# Database passwords
MYSQL_ROOT_PASSWORD=root_password
MYSQL_PASSWORD=amaso_password

# Application environment
NODE_ENV=production
APP_ENV=production
```

### Repository Requirements

Your Git repository must contain:
- `/frontend` directory with Next.js application
- `/backend` directory with Laravel application  
- `/amaso.sql` file with database dump
- `/.env.docker` and `/.env.docker.dev` environment templates
- All Docker configuration files in `/local` directory

## 📦 Services

| Service | Description | Port |
|---------|-------------|------|
| init | Clones Git repository | - |
| db | MySQL 8.0 database | 3306 |
| db_init | Imports amaso.sql | - |
| backend | Laravel API server | 8000 |
| frontend | Next.js application | 3000 |

## 🛠 Management Commands

```bash
# View logs
docker-compose logs -f [service-name]

# Update to latest code
docker-compose down
docker-compose up -d --build

# Access container shell
docker exec -it amaso_backend bash
docker exec -it amaso_frontend sh

# Database operations
docker exec -it amaso_db mysql -u root -p

# Force repository update
docker-compose down
docker volume rm local_app_data
docker-compose up -d --build
```

## 🔄 Updates and Deployment

To update the application:

1. **Push changes to Git repository**
2. **Restart containers**:
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

The init service will pull the latest changes from your repository.

## 🚨 Troubleshooting

### Repository Clone Issues
```bash
# Check if repository is accessible
docker run --rm alpine/git git ls-remote https://github.com/yourusername/amaso.git

# Check init service logs
docker-compose logs init
```

### Database Import Issues
```bash
# Check database import logs
docker-compose logs db_init

# Manually trigger import
docker exec -it amaso_db mysql -u root -p amaso < /path/to/amaso.sql
```

### Service Startup Issues
```bash
# Check service health
docker-compose ps

# View service logs
docker-compose logs [service-name]
```

## 📋 Migration Checklist

To migrate to a new server:

- [ ] Install Docker Desktop
- [ ] Copy `/local` directory contents
- [ ] Update `.env` file with correct repository URL
- [ ] Run `docker-compose up -d --build`
- [ ] Verify all services are healthy
- [ ] Test application functionality

## 🔒 Security Notes

- Use private repositories for production deployments
- Set up Git authentication if using private repos
- Change default database passwords
- Use environment-specific branches (main/develop)
- Regularly update base Docker images

---

**Benefits of Git-Based Deployment:**
- ✅ No need to copy large project files
- ✅ Always deploys from source control
- ✅ Easy updates by pushing to Git
- ✅ Consistent deployments across environments
- ✅ Full audit trail of changes