# ⚙️ Guide de Configuration - Système Amaso
## دليل التكوين - نظام أماسو

---

## 📋 Présentation

Ce guide détaille la configuration des fichiers d'environnement et les paramètres avancés pour optimiser votre installation Amaso.

---

## 🔧 Fichiers de Configuration

### Structure des Fichiers :
```
amaso-app/
├── backend/
│   ├── .env                    # Configuration principale backend
│   └── .env.example.amaso     # Modèle avec commentaires français
├── frontend/
│   ├── .env.local             # Configuration frontend
│   └── .env.local.example     # Modèle avec commentaires français
```

---

## 🗂️ Configuration Backend (.env)

### Informations de Base de l'Application

```env
# =================================================
# INFORMATIONS DE L'APPLICATION
# =================================================

# Nom de votre application (apparaîtra dans les titres et emails)
APP_NAME="Système de Gestion Amaso"

# Environnement : local (développement), staging (test), production
APP_ENV=local

# Activer le mode debug pour afficher les erreurs détaillées
# ⚠️ TOUJOURS false en production pour la sécurité
APP_DEBUG=true

# URL de base de votre application backend
APP_URL=http://localhost:8000

# Clé de chiffrement (générée automatiquement avec php artisan key:generate)
APP_KEY=base64:votre_cle_generee_automatiquement
```

### Configuration de la Base de Données

```env
# =================================================
# BASE DE DONNÉES MYSQL
# =================================================

# Type de base de données (mysql recommandé pour Amaso)
DB_CONNECTION=mysql

# Adresse du serveur MySQL
# 127.0.0.1 (localhost) pour XAMPP ou installation locale
DB_HOST=127.0.0.1

# Port MySQL (3306 par défaut)
DB_PORT=3306

# Nom de votre base de données
DB_DATABASE=amaso

# Nom d'utilisateur MySQL
# 'root' pour XAMPP, ou créez un utilisateur dédié
DB_USERNAME=root

# Mot de passe MySQL
# Vide pour XAMPP par défaut, sinon votre mot de passe
DB_PASSWORD=
```

#### 🔒 Création d'un Utilisateur MySQL Dédié (Recommandé)

Pour la sécurité, créez un utilisateur spécifique à Amaso :

```sql
-- Se connecter à MySQL en tant que root
mysql -u root -p

-- Créer un utilisateur dédié
CREATE USER 'amaso_user'@'localhost' IDENTIFIED BY 'motdepasse_securise';

-- Donner les permissions sur la base amaso uniquement
GRANT ALL PRIVILEGES ON amaso.* TO 'amaso_user'@'localhost';

-- Appliquer les changements
FLUSH PRIVILEGES;
```

Puis dans votre .env :
```env
DB_USERNAME=amaso_user
DB_PASSWORD=motdepasse_securise
```

### Configuration des Sessions et Cache

```env
# =================================================
# SESSIONS ET CACHE
# =================================================

# Stockage des sessions utilisateur
# database (recommandé), file, redis
SESSION_DRIVER=database
SESSION_LIFETIME=120      # Durée en minutes (120 = 2 heures)

# Système de cache pour améliorer les performances
# database (simple), redis (performant), file
CACHE_STORE=database

# File d'attente pour les tâches en arrière-plan
# database (simple), redis (performant)
QUEUE_CONNECTION=database
```

### Configuration des Emails

```env
# =================================================
# SYSTÈME D'EMAILS
# =================================================

# Service d'envoi d'emails
# log (développement - emails dans les logs)
# smtp (serveur SMTP - production)
MAIL_MAILER=log

# Configuration SMTP (si MAIL_MAILER=smtp)
MAIL_HOST=smtp.gmail.com        # Serveur SMTP
MAIL_PORT=587                   # Port SMTP
MAIL_USERNAME=votre@email.com   # Votre email
MAIL_PASSWORD=votre_mot_de_passe # Mot de passe email
MAIL_ENCRYPTION=tls             # tls ou ssl

# Adresse d'expéditeur par défaut
MAIL_FROM_ADDRESS="noreply@amaso.org"
MAIL_FROM_NAME="Système Amaso"
```

### Paramètres de Localisation

```env
# =================================================
# LOCALISATION ET LANGUE
# =================================================

# Langue principale de l'application
APP_LOCALE=ar                   # ar (arabe), fr (français), en (anglais)

# Langue de secours si traduction manquante
APP_FALLBACK_LOCALE=ar

# Locale pour les données de test
APP_FAKER_LOCALE=ar_SA          # Données en arabe saoudien
```

### Configuration de Sécurité

```env
# =================================================
# SÉCURITÉ
# =================================================

# Nombre de rounds pour le hachage des mots de passe
# Plus élevé = plus sécurisé mais plus lent
BCRYPT_ROUNDS=12

# Configuration des logs
LOG_CHANNEL=stack               # Type de logging
LOG_LEVEL=debug                 # Niveau de détail des logs

# ⚠️ IMPORTANT POUR LA PRODUCTION
APP_DEBUG=false                 # Désactiver le debug
APP_ENV=production              # Environnement de production
LOG_LEVEL=error                 # Logs d'erreurs uniquement
```

---

## 🌐 Configuration Frontend (.env.local)

```env
# =================================================
# CONFIGURATION FRONTEND NEXT.JS
# =================================================

# URL de l'API Backend
# Doit pointer vers votre serveur Laravel
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1

# Environnement de développement ou production
NODE_ENV=development

# Désactiver la télémétrie Next.js (optionnel)
NEXT_TELEMETRY_DISABLED=1

# Configuration des URLs publiques
# Si votre app est accessible via un domaine spécifique
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🔄 Configurations Selon l'Environnement

### 💻 Développement Local

**Backend (.env) :**
```env
APP_ENV=local
APP_DEBUG=true
DB_HOST=127.0.0.1
MAIL_MAILER=log
CACHE_STORE=database
```

**Frontend (.env.local) :**
```env
NODE_ENV=development
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

### 🚀 Production

**Backend (.env) :**
```env
APP_ENV=production
APP_DEBUG=false
DB_HOST=votre_serveur_db
MAIL_MAILER=smtp
CACHE_STORE=redis
QUEUE_CONNECTION=redis

# Configuration HTTPS
APP_URL=https://votre-domaine.com
FORCE_HTTPS=true
```

**Frontend (.env.local) :**
```env
NODE_ENV=production
NEXT_PUBLIC_API_BASE_URL=https://votre-domaine.com/api/v1
```

---

## 🛠️ Configuration Avancée

### Base de Données - Optimisations

```env
# =================================================
# OPTIMISATIONS BASE DE DONNÉES
# =================================================

# Pool de connexions pour de meilleures performances
DB_CONNECTION_POOL_SIZE=10

# Timeout pour les requêtes longues (en secondes)
DB_TIMEOUT=30

# Charset pour supporter l'arabe complètement
DB_CHARSET=utf8mb4
DB_COLLATION=utf8mb4_unicode_ci
```

### Cache et Performance

```env
# =================================================
# CACHE ET PERFORMANCES
# =================================================

# Redis pour de meilleures performances (si installé)
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

# Cache des vues pour accélérer l'affichage
VIEW_CACHE_ENABLED=true

# Cache des configurations
CONFIG_CACHE_ENABLED=true
```

### Système de Fichiers

```env
# =================================================
# STOCKAGE DES FICHIERS
# =================================================

# Disque de stockage par défaut
FILESYSTEM_DISK=local

# Pour le stockage cloud (optionnel)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_DEFAULT_REGION=eu-west-1
AWS_BUCKET=amaso-files
```

---

## 🔍 Validation de Configuration

### Commandes de Vérification

```bash
# Vérifier la configuration Laravel
php artisan config:show

# Tester la connexion à la base de données
php artisan migrate:status

# Vérifier les permissions des dossiers
php artisan storage:link

# Optimiser les performances (production)
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Tests de Fonctionnement

1. **Test de l'API :**
   ```bash
   curl http://localhost:8000/api/health
   # Doit retourner un JSON avec le statut OK
   ```

2. **Test de la base de données :**
   ```bash
   php artisan tinker
   >>> DB::connection()->getPdo()
   # Doit retourner un objet PDO sans erreur
   ```

3. **Test du frontend :**
   - Ouvrir http://localhost:3000
   - Vérifier dans la console du navigateur (F12)
   - Aucune erreur de connexion API

---

## 🚨 Sécurité et Bonnes Pratiques

### ⚠️ Ne Jamais Faire

1. **Jamais committer les fichiers .env** dans Git
2. **Jamais partager** les mots de passe en clair
3. **Jamais laisser APP_DEBUG=true** en production
4. **Jamais utiliser 'root'** sans mot de passe en production

### ✅ Bonnes Pratiques

1. **Utilisez des mots de passe forts** pour la base de données
2. **Créez des utilisateurs dédiés** avec permissions limitées
3. **Sauvegardez régulièrement** votre base de données
4. **Surveillez les logs** pour détecter les problèmes

### 🔐 Génération de Mots de Passe Sécurisés

```bash
# Générer un mot de passe aléatoire
openssl rand -base64 32

# Ou utiliser PHP
php -r "echo bin2hex(random_bytes(16));"
```

---

## 🆘 Résolution de Problèmes

### Configuration Non Prise en Compte

```bash
# Effacer le cache des configurations
php artisan config:clear

# Recréer le cache (en production)
php artisan config:cache
```

### Erreurs de Base de Données

1. **Vérifiez les identifiants** dans .env
2. **Testez la connexion** manuellement :
   ```bash
   mysql -h DB_HOST -u DB_USERNAME -p
   ```
3. **Vérifiez les permissions** de l'utilisateur MySQL

### Problèmes de Permissions

```bash
# Linux/macOS
sudo chown -R www-data:www-data storage/
sudo chmod -R 775 storage/ bootstrap/cache/

# Windows (avec XAMPP)
# Donner les permissions complètes aux dossiers storage/ et bootstrap/cache/
```

---

## 📚 Ressources Complémentaires

### Documentation Officielle
- **Laravel Configuration :** https://laravel.com/docs/configuration
- **Next.js Environment Variables :** https://nextjs.org/docs/basic-features/environment-variables
- **MySQL Configuration :** https://dev.mysql.com/doc/

### Outils Utiles
- **phpMyAdmin :** Interface graphique pour MySQL
- **Laravel Debugbar :** Pour déboguer les requêtes
- **Postman :** Pour tester les APIs

---

**🎯 Configuration terminée avec succès !**

*Votre système Amaso est maintenant configuré de manière optimale pour votre environnement. Pour toute question spécifique, référez-vous aux logs de l'application ou contactez l'équipe technique.*