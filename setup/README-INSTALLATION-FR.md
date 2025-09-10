# 🏛️ Guide d'Installation - Système de Gestion Amaso
## نظام إدارة جمعية أماسو الخيرية - دليل التثبيت

---

## 📋 Présentation

Ce guide vous aidera à installer l'application Amaso sur un nouvel ordinateur. L'application se compose de deux parties :
- **Frontend** : Interface utilisateur (Next.js)
- **Backend** : Serveur et base de données (Laravel + MySQL)

---

## 🔧 Prérequis Système

### Configuration Minimale Requise :
- **Système d'exploitation** : Windows 10/11, macOS, ou Linux
- **RAM** : 4 GB minimum (8 GB recommandé)
- **Espace disque** : 2 GB d'espace libre
- **Connexion Internet** : Requise pour l'installation

### Logiciels à Installer :
- **Node.js** version 18 ou supérieure
- **PHP** version 8.2 ou supérieure  
- **Composer** (gestionnaire de paquets PHP)
- **MySQL** version 8.0 ou supérieure
- **Serveur web** (Apache ou Nginx)

---

## 🚀 Méthodes d'Installation

Vous avez deux options pour installer les composants nécessaires :

### 📦 Option A : Installation XAMPP (Recommandée pour les débutants)

**XAMPP** est un package tout-en-un qui contient Apache, MySQL, PHP et phpMyAdmin.

#### Avantages :
- ✅ Installation simple en un seul téléchargement
- ✅ Configuration automatique
- ✅ Interface graphique facile à utiliser
- ✅ phpMyAdmin inclus pour gérer MySQL
- ✅ Idéal pour le développement local

#### Étapes d'installation :

1. **Télécharger XAMPP**
   - Allez sur : https://www.apachefriends.org/
   - Téléchargez la version avec PHP 8.2+
   - Taille du fichier : environ 150-200 MB

2. **Installer XAMPP**
   - Exécutez le fichier téléchargé
   - Suivez l'assistant d'installation
   - Choisissez les composants : Apache, MySQL, PHP, phpMyAdmin
   - Installez dans le répertoire par défaut (C:\xampp sur Windows)

3. **Démarrer les services**
   - Ouvrez le "XAMPP Control Panel"
   - Cliquez sur "Start" à côté d'Apache
   - Cliquez sur "Start" à côté de MySQL
   - Les indicateurs doivent devenir verts

4. **Vérifier l'installation**
   - Ouvrez votre navigateur
   - Allez sur : http://localhost
   - Vous devriez voir la page d'accueil XAMPP
   - Testez phpMyAdmin : http://localhost/phpmyadmin

---

### 🔧 Option B : Installation Manuelle (Pour utilisateurs avancés)

#### Avantages :
- ✅ Plus de contrôle sur les versions
- ✅ Configuration personnalisée
- ✅ Meilleure performance pour la production
- ✅ Apprentissage approfondi du système

#### Étapes d'installation :

##### 1. Installer PHP
**Windows :**
- Téléchargez PHP 8.2+ depuis : https://windows.php.net/
- Extractez dans C:\php
- Ajoutez C:\php au PATH système
- Renommez php.ini-development en php.ini
- Activez les extensions nécessaires dans php.ini :
  ```ini
  extension=pdo_mysql
  extension=mbstring
  extension=openssl
  extension=fileinfo
  extension=gd
  ```

**macOS (avec Homebrew) :**
```bash
brew install php@8.2
```

**Linux (Ubuntu/Debian) :**
```bash
sudo apt update
sudo apt install php8.2 php8.2-mysql php8.2-mbstring php8.2-xml php8.2-gd
```

##### 2. Installer MySQL
**Windows :**
- Téléchargez MySQL Community Server depuis : https://dev.mysql.com/downloads/
- Suivez l'assistant d'installation
- Notez bien le mot de passe root

**macOS :**
```bash
brew install mysql
brew services start mysql
```

**Linux :**
```bash
sudo apt install mysql-server
sudo mysql_secure_installation
```

##### 3. Installer phpMyAdmin (Optionnel)
- Téléchargez depuis : https://www.phpmyadmin.net/
- Extractez dans votre dossier web (ex: C:\htdocs\phpmyadmin)
- Configurez config.inc.php pour la connexion MySQL

##### 4. Configurer le serveur web
**Apache :**
- Windows : Téléchargez Apache depuis httpd.apache.org
- Configurez DocumentRoot vers votre dossier de projet
- Activez mod_rewrite

**Nginx :**
- Installez Nginx et configurez un virtual host
- Configurez PHP-FPM pour traiter les fichiers PHP

---

## 📦 Installation de Node.js et Composer

### Node.js (Requis pour le Frontend)

1. **Télécharger Node.js**
   - Allez sur : https://nodejs.org/
   - Téléchargez la version LTS (Long Term Support)
   - Version minimum requise : 18.x

2. **Installer Node.js**
   - Exécutez le fichier d'installation téléchargé
   - Suivez l'assistant (acceptez les options par défaut)
   - npm sera installé automatiquement avec Node.js

3. **Vérifier l'installation**
   ```bash
   node --version    # Doit afficher v18.x.x ou supérieur
   npm --version     # Doit afficher la version de npm
   ```

### Composer (Requis pour le Backend Laravel)

1. **Télécharger Composer**
   - Allez sur : https://getcomposer.org/download/
   - Téléchargez Composer-Setup.exe pour Windows
   - Pour macOS/Linux : suivez les instructions sur le site

2. **Installer Composer**
   - Exécutez l'installeur
   - L'installeur détectera automatiquement PHP
   - Acceptez l'ajout au PATH système

3. **Vérifier l'installation**
   ```bash
   composer --version    # Doit afficher la version de Composer
   ```

---

## 💾 Configuration de la Base de Données

### Créer la base de données Amaso

#### Avec phpMyAdmin (XAMPP) :
1. Ouvrez http://localhost/phpmyadmin
2. Cliquez sur "Nouvelle base de données"
3. Nom : `amaso`
4. Interclassement : `utf8mb4_unicode_ci`
5. Cliquez sur "Créer"

#### Avec MySQL en ligne de commande :
```sql
mysql -u root -p
CREATE DATABASE amaso CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'amaso_user'@'localhost' IDENTIFIED BY 'votre_mot_de_passe';
GRANT ALL PRIVILEGES ON amaso.* TO 'amaso_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## 📁 Installation de l'Application Amaso

### 1. Télécharger le Code Source
```bash
# Si vous utilisez Git
git clone [URL_DU_REPOSITORY] amaso-app
cd amaso-app

# Ou décompressez le fichier ZIP dans un dossier 'amaso-app'
```

### 2. Configurer le Backend Laravel
```bash
# Aller dans le dossier backend
cd backend

# Installer les dépendances PHP
composer install

# Copier le fichier de configuration exemple
copy .env.example .env

# Générer la clé de l'application
php artisan key:generate
```

### 3. Configurer le Frontend Next.js
```bash
# Aller dans le dossier frontend  
cd ../frontend

# Installer les dépendances JavaScript
npm install

# Copier le fichier de configuration exemple
copy .env.local.example .env.local
```

---

## ⚙️ Configuration des Fichiers d'Environnement

### Backend (.env)
Éditez le fichier `backend/.env` :

```env
# Informations de l'application
APP_NAME="Amaso Management"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

# Configuration de la base de données
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=amaso
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
```

### Frontend (.env.local)
Éditez le fichier `frontend/.env.local` :

```env
# URL de l'API Backend
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1

# Environnement
NODE_ENV=development
```

---

## 🏃‍♂️ Premier Démarrage

### 1. Initialiser la Base de Données
```bash
cd backend

# Créer les tables
php artisan migrate

# Ajouter des données de test (optionnel)
php artisan db:seed
```

### 2. Démarrer les Services

#### Démarrer le Backend :
```bash
cd backend
php artisan serve
# Le backend sera accessible sur : http://localhost:8000
```

#### Démarrer le Frontend (dans un autre terminal) :
```bash
cd frontend
npm run dev
# Le frontend sera accessible sur : http://localhost:3000
```

### 3. Tester l'Installation
- Ouvrez http://localhost:3000 dans votre navigateur
- Vous devriez voir l'interface Amaso
- Testez l'API : http://localhost:8000/api/health

---

## 🛠️ Dépannage Courant

### ❌ Erreur : "Command not found"
**Solution :** Vérifiez que les programmes sont dans le PATH système
```bash
# Vérifiez les installations
node --version
php --version
composer --version
mysql --version
```

### ❌ Erreur de connexion MySQL
**Solutions possibles :**
1. Vérifiez que MySQL est démarré
2. Vérifiez les identifiants dans le fichier .env
3. Testez la connexion :
   ```bash
   mysql -u root -p
   ```

### ❌ Erreur "Port already in use"
**Solutions :**
1. Changez le port dans la configuration
2. Ou arrêtez le processus qui utilise le port :
   ```bash
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID [PID_NUMBER] /F
   
   # macOS/Linux
   lsof -ti :3000 | xargs kill
   ```

### ❌ Erreur "Permission denied"
**Solution :** Ajustez les permissions des dossiers :
```bash
# Laravel
chmod -R 775 storage bootstrap/cache
```

### ❌ Frontend ne se connecte pas au Backend
**Vérifications :**
1. Les deux serveurs sont-ils démarrés ?
2. L'URL dans .env.local est-elle correcte ?
3. Testez l'API directement : http://localhost:8000/api/health

---

## 📞 Support et Aide

### Ressources Utiles :
- **Documentation Laravel :** https://laravel.com/docs
- **Documentation Next.js :** https://nextjs.org/docs
- **Documentation XAMPP :** https://www.apachefriends.org/faq.html

### Vérifications de Base :
1. ✅ Tous les services sont-ils démarrés ?
2. ✅ Les ports 3000 et 8000 sont-ils libres ?
3. ✅ Les fichiers .env sont-ils configurés ?
4. ✅ La base de données est-elle créée et accessible ?

---

## 🎯 Prochaines Étapes

Une fois l'installation terminée :
1. 📖 Lisez le guide de configuration détaillé : `GUIDE-CONFIGURATION-FR.md`
2. 🚀 Utilisez les scripts automatiques dans le dossier `setup/`
3. 👥 Configurez les utilisateurs et permissions
4. 🔒 Sécurisez l'installation pour la production

---

**Félicitations ! 🎉 Votre système Amaso est maintenant prêt à l'emploi !**

*Pour toute question technique, référez-vous à la documentation détaillée ou contactez l'équipe de support.*