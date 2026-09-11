# AMASO — Installation sur un poste Windows

Système de gestion de l'association **جمعية المنصور لكفالة اليتيم**.

Ce dossier contient tout ce qu'il faut pour faire tourner l'application sur
un PC Windows, pour la tester ou pour la faire fonctionner au quotidien dans
les locaux de l'association.

> Pour une installation sur un serveur accessible depuis l'extérieur, voir
> [`../deploy/README.md`](../deploy/README.md).

---

## 1. Avant de commencer

Trois logiciels à installer, dans cet ordre. Acceptez les options par défaut.

| Logiciel | Où | À quoi ça sert |
|---|---|---|
| **XAMPP** (PHP 8.2+) | <https://www.apachefriends.org> | Fournit PHP et la base de données MySQL |
| **Composer** | <https://getcomposer.org/Composer-Setup.exe> | Installe les bibliothèques PHP |
| **Node.js 20+** (LTS) | <https://nodejs.org> | Fait tourner l'interface |

**Git** (<https://git-scm.com>) n'est nécessaire que si vous voulez utiliser
`update-app.bat` pour récupérer les mises à jour.

### Activer l'extension GD

Les exports Excel s'appuient sur l'extension PHP **gd**, désactivée par
défaut dans certaines installations. Sans elle, chaque téléchargement `.xlsx`
renvoie une erreur.

1. Panneau XAMPP → bouton **Config** en face d'Apache → **PHP (php.ini)**
2. Cherchez la ligne `;extension=gd`
3. Enlevez le point-virgule : `extension=gd`
4. Enregistrez et redémarrez Apache

`install.bat` vérifie ce point et vous prévient si l'extension manque.

### Activer opcache — le réglage qui change tout

C'est, de loin, le réglage qui pèse le plus sur la vitesse de l'application.

Sans opcache, PHP relit et recompile **environ 500 fichiers, soit 5,6 Mo de
code source, à chaque requête**. Le résultat est une demi-seconde perdue
avant même que la moindre requête SQL ne parte — ce qui explique qu'une page
qui affiche deux lignes mette autant de temps qu'un rapport annuel complet.

1. Panneau XAMPP → **Config** en face d'Apache → **PHP (php.ini)**
2. Vérifiez que la ligne `zend_extension=opcache` n'est pas commentée
3. Réglez :

```ini
opcache.enable=1
opcache.enable_cli=1
opcache.memory_consumption=192
opcache.max_accelerated_files=20000
opcache.validate_timestamps=1
```

4. Enregistrez et **redémarrez Apache**

### Exclure le dossier de l'antivirus

L'analyse en temps réel de Windows inspecte chacune de ces centaines de
lectures de fichiers. Exclure le projet divise généralement par deux le temps
restant.

**Sécurité Windows** → *Protection contre les virus et menaces* → *Gérer les
paramètres* → *Exclusions* → ajouter :

- le dossier du projet (`...\Amaso`)
- le dossier PHP (`C:\xampp\php`)

### Mesurer

Pour voir où part le temps sur votre machine :

```
cd backend
php perf-probe.php
```

Il sépare le coût du framework de celui des requêtes SQL. Si « framework »
est bien plus grand que « queries », le problème est opcache ou l'antivirus,
pas la base de données.

---

## 2. Installation

1. Ouvrez le **panneau XAMPP** et démarrez **MySQL**.
2. Créez la base : <http://localhost/phpmyadmin> → **Nouvelle base de
   données** → nom `amaso`, interclassement `utf8mb4_unicode_ci`.
3. Double-cliquez sur **`install.bat`** dans ce dossier.

Le script installe les dépendances, crée les fichiers de configuration et
vous propose de remplir la base. Comptez cinq à dix minutes la première fois.

Si vos identifiants MySQL ne sont pas ceux par défaut (`root` sans mot de
passe), modifiez `backend\.env` avant de lancer le script :

```
DB_DATABASE=amaso
DB_USERNAME=root
DB_PASSWORD=
```

### Remplir la base : les trois options

`install.bat` pose la question. Vous pouvez aussi le faire à la main :

| Ce que vous voulez | Comment |
|---|---|
| **Données de démonstration** — 26 familles, 53 orphelins, trois années de comptes, des bulletins scolaires. Pour tester ou faire une présentation. | Choix **1** dans `install.bat`, ou importez `..\amaso.sql` dans phpMyAdmin |
| **Base vide, prête à l'emploi** — la structure et les listes de référence (catégories, types d'aide, niveaux scolaires), aucun bénéficiaire. Pour un usage réel. | Choix **2** dans `install.bat` |
| **Base existante** — vous avez déjà des données à conserver. | Choix **3**, puis dans `backend\` : `php artisan migrate` |

> ⚠️ Les données de démonstration sont **entièrement inventées**. Ne les
> mélangez jamais avec des dossiers réels : importer `amaso.sql` efface tout
> le contenu des tables.

---

## 3. Utilisation quotidienne

| | |
|---|---|
| **Démarrer** | Ouvrez XAMPP, démarrez MySQL, puis double-cliquez sur `start-app.bat` |
| **Arrêter** | `stop-app.bat` |
| **Mettre à jour** | `update-app.bat` |

`start-app.bat` ouvre l'application dans le navigateur une fois les deux
services prêts. Deux fenêtres réduites restent ouvertes dans la barre des
tâches (« Amaso Backend » et « Amaso Frontend ») : c'est normal, elles
contiennent les journaux. `stop-app.bat` les ferme.

| Adresse | |
|---|---|
| <http://localhost:3000> | L'application |
| <http://localhost:8000> | L'API (utile seulement pour diagnostiquer) |
| <http://localhost/phpmyadmin> | La base de données |

### Comptes de démonstration

Uniquement avec les données de démonstration. Mot de passe : `password`.

| Adresse | Rôle |
|---|---|
| `admin@amaso.org` | Administrateur — accès complet, gestion des comptes |
| `accountant@amaso.org` | Comptable — recettes, dépenses, rapports |
| `social@amaso.org` | Assistant social — familles, orphelins, scolarité |

**Changez ces mots de passe avant tout usage réel** : Paramètres →
Gestion des comptes.

---

## 4. En cas de problème

| Symptôme | Cause probable | Solution |
|---|---|---|
| `install.bat` : « PHP introuvable » | XAMPP n'est pas dans le `PATH` | Redémarrez le PC après avoir installé XAMPP ; sinon ajoutez `C:\xampp\php` au `PATH` |
| `start-app.bat` : « MySQL ne répond pas » | MySQL est arrêté | Panneau XAMPP → **Start** en face de MySQL |
| Page blanche, ou « Failed to fetch » | Le backend n'a pas démarré | Ouvrez la fenêtre « Amaso Backend » dans la barre des tâches pour lire l'erreur |
| Erreur de connexion à la base | Identifiants incorrects | Corrigez `backend\.env`, puis dans `backend\` : `php artisan config:clear` |
| L'export Excel échoue | Extension `gd` désactivée | Voir la section 1 |
| L'export PDF échoue | Dossiers de cache absents | Dans `backend\` : `php artisan view:clear` |
| Le port 3000 ou 8000 est occupé | Une instance précédente tourne encore | `stop-app.bat`, puis `start-app.bat` |
| Après une mise à jour, une page est en erreur | Caches obsolètes | Dans `backend\` : `php artisan config:clear && php artisan cache:clear && php artisan view:clear` |

### Repartir de zéro

Depuis `backend\`, en **supprimant toutes les données** :

```
php artisan migrate:fresh --force
php artisan db:seed --force
php artisan db:seed --class=DemoDataSeeder --force
```

La dernière ligne est facultative : elle ajoute les données de démonstration.

---

## 5. Contenu du dossier

| Fichier | |
|---|---|
| `install.bat` | Installation initiale — à lancer une seule fois |
| `start-app.bat` | Démarre l'application |
| `stop-app.bat` | Arrête l'application |
| `update-app.bat` | Récupère la dernière version et met la base à jour |
| `.env.local.example` | Modèle de configuration du frontend, copié par `install.bat` |
