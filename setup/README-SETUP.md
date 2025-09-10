# 🛠️ Dossier Setup - Outils et Guides Amaso

Ce dossier contient tous les outils nécessaires pour installer, configurer et maintenir l'application Amaso.

## 📁 Contenu du Dossier

### 🚀 Scripts de Lancement
- **`app-launcher.bat`** - Interface principale avec menu interactif
- **`start-app.bat`** - Démarrage automatique de tous les services
- **`stop-app.bat`** - Arrêt de tous les services
- **`open-urls.bat`** - Accès rapide à l'application dans le navigateur

### 🔄 Scripts de Mise à Jour
- **`update-app.bat`** - Mise à jour complète avec sauvegarde automatique
- **`update-simple.bat`** - Mise à jour rapide et simple

### 📚 Documentation
- **`README-INSTALLATION-FR.md`** - Guide complet d'installation
- **`GUIDE-CONFIGURATION-FR.md`** - Guide de configuration détaillé

### ⚙️ Templates de Configuration
- **`.env.example.amaso`** - Modèle de configuration backend avec commentaires français
- **`.env.local.example`** - Modèle de configuration frontend avec commentaires français

---

## 🎯 Comment Utiliser

### Pour les Débutants
1. **Double-cliquez sur `app-launcher.bat`**
2. Choisissez votre action dans le menu
3. Suivez les instructions à l'écran

### Pour une Utilisation Rapide
- **Démarrer** : Double-cliquez sur `start-app.bat`
- **Arrêter** : Double-cliquez sur `stop-app.bat`  
- **Ouvrir** : Double-cliquez sur `open-urls.bat`

### Pour les Mises à Jour
- **Complète** : Utilisez `update-app.bat`
- **Rapide** : Utilisez `update-simple.bat`

---

## 📋 Première Installation

1. **Lisez le guide** : `README-INSTALLATION-FR.md`
2. **Configurez** : Suivez `GUIDE-CONFIGURATION-FR.md`
3. **Copiez les templates** :
   - `.env.example.amaso` → `../backend/.env`
   - `.env.local.example` → `../frontend/.env.local`
4. **Démarrez** : `app-launcher.bat`

---

## 🔄 Mise à Jour de l'Application

### Script Complet (`update-app.bat`)
- ✅ Sauvegarde automatique des configurations
- ✅ Téléchargement de la dernière version
- ✅ Mise à jour des dépendances
- ✅ Migration de la base de données
- ✅ Restauration des configurations
- ✅ Vérification de l'intégrité

### Script Rapide (`update-simple.bat`)
- ✅ Sauvegarde basique
- ✅ Téléchargement rapide
- ✅ Restauration des configurations

### Prérequis pour les Mises à Jour
- Git installé sur le système
- Dossier du projet géré par Git
- Connexion Internet active

---

## 🛠️ Dépannage

### Script ne se Lance Pas
- ✅ Vérifiez que vous êtes dans le bon dossier
- ✅ Exécutez en tant qu'administrateur si nécessaire
- ✅ Vérifiez que les services requis sont installés

### Erreur de Mise à Jour
- ✅ Vérifiez votre connexion Internet
- ✅ Assurez-vous que Git est installé
- ✅ Vérifiez que le dossier est un dépôt Git

### Services ne Démarrent Pas
- ✅ Vérifiez que XAMPP est démarré
- ✅ Vérifiez les ports 3000 et 8000
- ✅ Consultez les fichiers .env

---

## 📞 Support

### Ressources Utiles
- **Installation** : `README-INSTALLATION-FR.md`
- **Configuration** : `GUIDE-CONFIGURATION-FR.md`
- **Scripts** : Commentaires dans chaque fichier .bat

### Vérifications de Base
1. ✅ XAMPP démarré ?
2. ✅ Fichiers .env configurés ?
3. ✅ Ports 3000 et 8000 libres ?
4. ✅ Node.js et PHP installés ?

---

## 🎉 Fonctionnalités

### Automatisation Complète
- 🚀 Démarrage en un clic
- 🛑 Arrêt en un clic
- 🌐 Ouverture navigateur automatique
- 🔄 Mise à jour automatisée

### Sécurité
- 💾 Sauvegarde automatique des configurations
- 🔒 Préservation des données utilisateur
- ⚠️ Confirmations pour actions critiques
- 🛡️ Vérifications d'intégrité

### Interface Conviviale
- 🎯 Menus interactifs
- ✅ Feedback visuel
- 📊 Informations de statut
- 💡 Conseils et aide intégrés

---

**🎯 Tout ce dont vous avez besoin pour Amaso en un seul endroit !**

*Pour toute question, consultez les guides détaillés ou contactez l'équipe technique.*