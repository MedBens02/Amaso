# Amaso Docker Deployment Guide

## Quick Start - Ready to Deploy! 🚀

Your Amaso application is now configured for Git-based Docker deployment using:
- **Repository**: https://github.com/MedBens02/Amaso.git
- **Branch**: main

## Deployment on New PC

### Prerequisites
- Install Docker Desktop
- Ensure Docker is running

### Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/MedBens02/Amaso.git
   cd Amaso/local
   ```

2. **Quick deployment (recommended):**
   ```bash
   ./deploy.sh
   ```
   The script will:
   - Check prerequisites
   - Set up environment
   - Ask production vs development mode
   - Deploy automatically

3. **Manual deployment:**
   ```bash
   # For production
   docker-compose up -d --build
   
   # For development (with hot reload)
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
   ```

### What Happens During Deployment

1. **Repository Clone**: Docker automatically clones your code
2. **Database Setup**: MySQL with `amaso.sql` imported automatically  
3. **Dependencies**: All PHP and Node.js dependencies installed
4. **Services Started**: Frontend, Backend, and Database all running

### Access Your Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000  
- **Database**: localhost:3306

### Environment Configuration

The deployment uses these default settings:

**Production** (`.env`)
```bash
REPO_URL=https://github.com/MedBens02/Amaso.git
BRANCH=main
MYSQL_ROOT_PASSWORD=root_password
MYSQL_PASSWORD=amaso_password
```

**Development** (`.env.dev`)
```bash
REPO_URL=https://github.com/MedBens02/Amaso.git
BRANCH=main
MYSQL_ROOT_PASSWORD=root
MYSQL_PASSWORD=password
```

## Updates and Maintenance

### Update Application
```bash
# Push changes to GitHub
git push origin main

# On deployment server
docker-compose down
docker-compose up -d --build
```

### View Logs
```bash
docker-compose logs -f [service-name]
```

### Database Backup
```bash
docker exec amaso_db mysqldump -u root -proot_password amaso > backup.sql
```

## Troubleshooting

### Common Issues
1. **Port conflicts**: Stop local services on ports 3000, 8000, 3306
2. **Docker not running**: Start Docker Desktop
3. **Permission errors**: Run as administrator/sudo

### Reset Everything
```bash
docker-compose down -v
docker system prune -f
docker-compose up -d --build
```

## Benefits

✅ **No manual setup** - Everything automated  
✅ **Always up-to-date** - Deploys from Git repository  
✅ **Cross-platform** - Works on Windows, Mac, Linux  
✅ **Isolated environment** - No conflicts with local software  
✅ **Easy updates** - Just push to Git and redeploy  
✅ **Database included** - MySQL with data pre-loaded  

---

**Ready to deploy!** 🎉

Just clone the repository and run `./deploy.sh` on any PC with Docker installed.