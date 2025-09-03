# 🚀 Amaso Application Setup Guide

## Complete Steps to Run Amaso on a New PC

This guide will help you deploy the Amaso application (Next.js + Laravel + MySQL) on any new PC using Docker containers.

## 📋 Prerequisites

### 1. Install Docker Desktop
- **Download**: https://www.docker.com/products/docker-desktop/
- **Install** Docker Desktop for your operating system
- **Start** Docker Desktop and ensure it's running
- **Verify**: Check Docker is running (look for Docker icon in system tray/menu bar)

### 2. Basic Requirements
- **Git** (usually pre-installed on Mac/Linux, download for Windows)
- **Terminal/Command Prompt** access
- **Internet connection** for downloading dependencies

## 🎯 Deployment Options

### Option 1: Automated Deployment (⭐ Recommended)

#### Steps:
1. **Clone the repository:**
   ```bash
   git clone https://github.com/MedBens02/Amaso.git
   cd Amaso/local
   ```

2. **Run the automated deployment script:**
   ```bash
   # On Windows (Git Bash or WSL)
   ./deploy.sh
   
   # On Mac/Linux
   ./deploy.sh
   ```

3. **Follow the interactive prompts:**
   - Choose deployment mode:
     - `1` = Production (stable, optimized)
     - `2` = Development (with hot reload, debug mode)
   - Choose whether to clean up previous deployment
   - Wait for automatic setup (5-10 minutes)

### Option 2: Manual Deployment

#### Steps:
1. **Clone the repository:**
   ```bash
   git clone https://github.com/MedBens02/Amaso.git
   cd Amaso/local
   ```

2. **Configure environment (optional):**
   ```bash
   # Copy environment template (has good defaults)
   cp .env .env.local
   
   # Or for development
   cp .env.dev .env.local
   ```

3. **Start the application:**
   ```bash
   # Production deployment
   docker-compose up -d --build
   
   # Development deployment (with hot reload)
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
   ```

## 🔄 What Happens During Deployment

The Docker setup automatically handles:

1. **📥 Code Retrieval**
   - Clones latest code from GitHub: `https://github.com/MedBens02/Amaso.git`
   - Uses the `main` branch

2. **🗄️ Database Setup**
   - Creates MySQL 8.0 container
   - Automatically imports `amaso.sql` with all data
   - Sets up database: `amaso` with user credentials

3. **🏗️ Backend Setup (Laravel)**
   - Installs PHP 8.2 and extensions
   - Runs `composer install` for PHP dependencies
   - Runs `npm install` for Node.js dependencies
   - Generates application key
   - Builds assets with Vite
   - Starts Laravel server on port 8000

4. **🎨 Frontend Setup (Next.js)**
   - Installs Node.js 20 and dependencies
   - Runs `npm install`
   - Builds Next.js application (production) or starts dev server
   - Starts frontend on port 3000

5. **🔗 Service Orchestration**
   - Sets up networking between containers
   - Configures health checks
   - Ensures proper startup order

## 🌐 Accessing Your Application

Once deployment completes (usually 5-10 minutes):

### Application URLs:
- **🖥️ Main Application (Frontend)**: http://localhost:3000
- **🔌 API Backend**: http://localhost:8000
- **🗄️ Database**: localhost:3306

### Test the Application:
1. Open http://localhost:3000 in your browser
2. You should see the Amaso login page
3. Try logging in and navigating the application
4. Test creating/viewing widow records
5. Access the references management section

## ✅ Verification Steps

### 1. Check Container Status
```bash
docker-compose ps
```
**Expected Output:** All services should show "Up" or "running" status:
- `amaso_frontend` - Up
- `amaso_backend` - Up  
- `amaso_db` - Up (healthy)

### 2. View Service Logs
```bash
# View all service logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f db
```

### 3. Test Database Connection
```bash
# Connect to database
docker exec -it amaso_db mysql -u amaso_user -pamaso_password amaso

# Inside MySQL, run:
SHOW TABLES;
SELECT COUNT(*) FROM widows;
exit
```

## 🗄️ Database Information

The MySQL database is automatically configured with:

### Connection Details:
- **Host**: localhost (or `db` from within containers)
- **Port**: 3306
- **Database Name**: `amaso`
- **Username**: `amaso_user`
- **Password**: `amaso_password` (production) / `password` (development)
- **Root Password**: `root_password` (production) / `root` (development)

### Included Data:
- ✅ All application tables created
- ✅ Sample widow records
- ✅ Reference data (skills, illnesses, partners, etc.)
- ✅ User accounts and permissions
- ✅ Configuration settings

## 🔄 Managing the Application

### Starting/Stopping Services
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart services
docker-compose restart

# View running containers
docker-compose ps
```

### Updating the Application
When new code is pushed to GitHub:

```bash
# Navigate to deployment directory
cd Amaso/local

# Stop current deployment
docker-compose down

# Pull latest changes and rebuild
docker-compose up -d --build
```

### Database Backup
```bash
# Create backup
docker exec amaso_db mysqldump -u root -proot_password amaso > backup_$(date +%Y%m%d).sql

# Restore from backup
docker exec -i amaso_db mysql -u root -proot_password amaso < backup_file.sql
```

## 🛠️ Troubleshooting

### Common Issues & Solutions

#### 1. Port Conflicts
**Problem**: "Port already in use" errors
**Solution**:
```bash
# Check what's using the ports
netstat -an | findstr :3000
netstat -an | findstr :8000
netstat -an | findstr :3306

# Stop conflicting services or modify ports in docker-compose.yml
```

#### 2. Docker Not Running
**Problem**: "Cannot connect to Docker daemon"
**Solution**:
- Start Docker Desktop application
- Wait for Docker to fully initialize
- Check Docker icon in system tray

#### 3. Permission Issues (Linux/Mac)
**Problem**: Permission denied errors
**Solution**:
```bash
sudo docker-compose up -d --build
# Or fix Docker permissions:
sudo usermod -aG docker $USER
```

#### 4. Memory/Space Issues
**Problem**: Out of disk space or memory
**Solution**:
```bash
# Clean up Docker
docker system prune -f
docker volume prune -f

# Or complete reset
docker-compose down -v
docker system prune -a -f
```

#### 5. Git Clone Issues
**Problem**: Cannot clone repository
**Solutions**:
- Check internet connection
- Verify repository URL: https://github.com/MedBens02/Amaso.git
- Use HTTPS instead of SSH if behind firewall

#### 6. Services Not Starting
**Problem**: Containers exit or restart
**Solution**:
```bash
# Check logs for specific errors
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db

# Rebuild from scratch
docker-compose down -v
docker-compose up --build
```

### Reset Everything
If nothing works, complete reset:
```bash
cd Amaso/local
docker-compose down -v
docker system prune -f
docker volume prune -f
docker-compose up -d --build
```

## 📁 File Structure After Setup

After cloning, your directory structure will be:

```
Amaso/
├── 📁 local/                    # ← Docker deployment files
│   ├── 🐳 docker-compose.yml   # Production configuration
│   ├── 🐳 docker-compose.dev.yml # Development overrides
│   ├── 🚀 deploy.sh            # Automated deployment script
│   ├── ⚙️ .env                # Production environment
│   ├── ⚙️ .env.dev            # Development environment
│   ├── 🐳 Dockerfile.*        # Container definitions
│   ├── 📝 README.md           # Detailed documentation
│   └── 📋 DEPLOYMENT.md       # Quick reference
├── 🎨 frontend/                 # Next.js application
│   ├── 📱 components/
│   ├── 🎯 app/
│   ├── 📦 package.json
│   └── ⚙️ next.config.mjs
├── 🔧 backend/                  # Laravel application  
│   ├── 📱 app/
│   ├── 🗃️ database/
│   ├── 📦 composer.json
│   └── ⚙️ artisan
├── 🗄️ amaso.sql               # Database dump
└── 📋 README.md               # Project documentation
```

## 🚀 Quick Start Summary

**For someone completely new to the project:**

1. **Install Docker Desktop** and ensure it's running
2. **Open terminal** and run these commands:
   ```bash
   git clone https://github.com/MedBens02/Amaso.git
   cd Amaso/local
   ./deploy.sh
   ```
3. **Choose option 1** (Production) when prompted
4. **Wait 5-10 minutes** for automatic setup
5. **Open http://localhost:3000** in your browser
6. **Start using the application!** 🎉

## 🆘 Getting Help

### Check Application Status
```bash
# Quick health check
curl http://localhost:3000  # Should return HTML
curl http://localhost:8000  # Should return Laravel response
```

### View Real-time Logs
```bash
# Watch all logs
docker-compose logs -f --tail=100

# Watch specific service
docker-compose logs -f frontend --tail=50
```

### Access Container Shell
```bash
# Backend container
docker exec -it amaso_backend bash

# Database container  
docker exec -it amaso_db mysql -u root -proot_password
```

---

## ✨ Features of This Setup

✅ **Zero Manual Configuration** - Everything automated  
✅ **Cross-Platform** - Works on Windows, Mac, Linux  
✅ **Always Up-to-Date** - Pulls latest code from Git  
✅ **Isolated Environment** - No conflicts with other software  
✅ **Complete Stack** - Frontend, Backend, Database included  
✅ **Production Ready** - Optimized builds and configurations  
✅ **Easy Updates** - Just push to Git and redeploy  
✅ **Database Included** - All data pre-loaded  
✅ **Development Mode** - Hot reload for development  
✅ **Health Checks** - Monitors service status  

---

**🎯 Final Result**: A fully functional Amaso application running in Docker containers, accessible at http://localhost:3000, with all features working exactly as intended!

**⏱️ Total Time**: 5-10 minutes from start to finish

**🔧 Maintenance**: Minimal - just update via Git pushes