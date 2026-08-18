# 📊 Life Tracker - Application Mobile de Suivi Personnel

Application mobile React Native (Expo) pour tracker toutes vos activités du quotidien : révisions voiture, coiffeur, ramonage, etc.

## 🚀 Fonctionnalités

- ✅ Créer des **catégories** personnalisées (Voiture, Maison, Moi, etc.)
- ✅ Ajouter des **actions** à tracker dans chaque catégorie
- ✅ **Enregistrer** rapidement chaque action d'un simple clic
- ✅ Voir la **dernière date** de chaque action
- ✅ **Historique complet** de toutes vos entrées
- ✅ Base de données **Turso** (SQLite cloud) pour synchronisation
- ✅ Interface intuitive et moderne

## 📋 Prérequis

- **Node.js** (v18 ou supérieur)
- **npm** ou **yarn**
- **Turso CLI** pour gérer votre base de données
- **Expo Go** app sur votre téléphone (iOS ou Android)

## 🛠️ Installation

### 1. Installation de Turso CLI

Sur Linux :
```bash
curl -sSfL https://get.tur.so/install.sh | bash
```

### 2. Création de votre base de données Turso

```bash
# Se connecter à Turso (créer un compte si nécessaire)
turso auth login

# Créer une nouvelle base de données
turso db create mavy

# Récupérer l'URL de la base de données
turso db show mavy --url

# Créer un token d'authentification
turso db tokens create mavy
```

**Conservez précieusement :**
- L'URL de votre base (ex: `libsql://mavy-votre-nom.turso.io`)
- Votre token d'authentification

### 3. Configuration de l'application

**N'écrivez jamais vos identifiants dans `src/config/turso.js`** : ce fichier est versionné,
et un token committé reste dans l'historique git même après suppression. Les identifiants
passent par un fichier `.env.local`, ignoré par git.

Créez `.env.local` à la racine du projet :

```bash
# Lues par l'app (via src/config/turso.js)
EXPO_PUBLIC_TURSO_DATABASE_URL=libsql://mavy-votre-nom.turso.io
EXPO_PUBLIC_TURSO_AUTH_TOKEN=eyJ...

# Lues par l'outil de migration (npm run migration:dev)
DATABASE_URL=libsql://mavy-votre-nom.turso.io
DATABASE_TOKEN=eyJ...
```

Les deux paires reprennent les mêmes valeurs : elles servent deux outils distincts, l'app
d'un côté et `geni` (migrations) de l'autre.

`.gitignore` couvre déjà `.env` et `.env*.local`. Vérifiez avant tout commit que votre
fichier n'apparaît pas dans `git status`.

> En build EAS, ce ne sont pas ces variables qui sont utilisées mais les secrets EAS
> (`TURSO_URL_PROD` / `TURSO_TOKEN_PROD`), injectés via `app.config.js` — voir
> [Build de production](#-build-de-production). Notez que le token se retrouve alors dans
> l'APK : lisez la section [Modèle de sécurité](#-modèle-de-sécurité).

### 4. Installation des dépendances

```bash
# Dans le dossier du projet
npm install
```

## 🎯 Lancement de l'application

### Démarrer le serveur de développement Expo

```bash
npm start
```

Un QR code s'affichera dans votre terminal.

### Tester sur votre téléphone

1. **Installez Expo Go** sur votre téléphone :
   - iOS : https://apps.apple.com/app/expo-go/id982107779
   - Android : https://play.google.com/store/apps/details?id=host.exp.exponent

2. **Scannez le QR code** :
   - iOS : Utilisez l'appareil photo
   - Android : Utilisez l'app Expo Go directement

3. L'application se lancera automatiquement ! 🎉

## 📱 Utilisation

### Première utilisation

1. **Créer des catégories** :
   - Cliquez sur le bouton `+` en haut à droite
   - Entrez le nom de la catégorie (ex: "Voiture", "Maison", "Moi")
   - La catégorie apparaît dans la liste

2. **Ajouter des actions** :
   - Cliquez sur une catégorie
   - Cliquez sur le bouton `+`
   - Entrez le nom de l'action (ex: "Révision", "Ramonage", "Coiffeur")

3. **Tracker une action** :
   - Dans une catégorie, cliquez sur le bouton de l'action
   - L'entrée est enregistrée avec la date et l'heure actuelles
   - Vous voyez "Dernière fois : Aujourd'hui" sur le bouton

4. **Consulter l'historique** :
   - Allez dans l'onglet "Historique" (📋)
   - Vous voyez toutes vos entrées triées par date

## 🗂️ Structure du projet

```
mavy/
├── App.js                      # Point d'entrée avec navigation
├── src/
│   ├── config/
│   │   └── turso.js           # Configuration Turso
│   ├── services/
│   │   ├── categoryService.js # Gestion des catégories
│   │   ├── actionService.js   # Gestion des actions
│   │   └── entryService.js    # Gestion des entrées
│   ├── screens/
│   │   ├── HomeScreen.js      # Liste des catégories
│   │   ├── CategoryScreen.js  # Actions d'une catégorie
│   │   └── HistoryScreen.js   # Historique complet
│   └── components/
│       └── ActionButton.js    # Bouton d'action réutilisable
```

## 🎨 Exemples d'utilisation

### Exemple 1 : Suivi automobile
**Catégorie** : Voiture 🚗
- Révision
- Vidange
- Contrôle technique
- Changement pneus

### Exemple 2 : Maison
**Catégorie** : Maison 🏠
- Ramonage cheminée
- Entretien chaudière
- Nettoyage gouttières

### Exemple 3 : Personnel
**Catégorie** : Moi 👤
- Coiffeur
- Dentiste
- Médecin

## 🔧 Commandes utiles

```bash
# Démarrer l'app
npm start

# Lancer sur Android (si émulateur installé)
npm run android

# Lancer sur iOS (Mac uniquement)
npm run ios

# Lancer en mode web (dans le navigateur)
npm run web

# Nettoyer le cache
npm start -- --clear

# Build de production (APK Android via EAS)
eas build --platform android --profile production
```

## 📦 Build de production

Les builds sont réalisés avec **EAS Build** (Expo Application Services). Les profils sont définis dans `eas.json`.

### Prérequis

```bash
# Installer EAS CLI (>= 16.32.0)
npm install -g eas-cli

# Se connecter à son compte Expo
eas login
```

### Configurer les secrets Turso

Le profil `production` utilise les variables d'environnement `TURSO_URL_PROD` et `TURSO_TOKEN_PROD`. Elles doivent exister côté EAS :

```bash
eas env:create --name TURSO_URL_PROD --scope project
eas env:create --name TURSO_TOKEN_PROD --scope project --type secret
```

### Lancer le build

```bash
# Build de production Android (APK)
eas build --platform android --profile production
```

Le profil `production` :
- génère un **APK** Android
- incrémente automatiquement le numéro de version (`autoIncrement: true`, versions gérées côté EAS via `appVersionSource: "remote"`)
- injecte les variables Turso de **production**

À la fin du build, EAS affiche une URL de téléchargement de l'APK.

### Autres profils disponibles

```bash
# Development client (dev, base Turso de dev)
eas build --platform android --profile development

# Preview : APK de test avec la base Turso de prod
eas build --platform android --profile preview
```

### Migrations de base de données

Avant un déploiement en production, appliquez les migrations sur la base prod :

```bash
npm run migration:prod
```

## 🐛 Dépannage

### Erreur "Impossible d'initialiser la base de données"
- En développement : vérifiez que `.env.local` existe et définit bien
  `EXPO_PUBLIC_TURSO_DATABASE_URL` et `EXPO_PUBLIC_TURSO_AUTH_TOKEN` (voir
  [Configuration de l'application](#3-configuration-de-lapplication))
- Redémarrez avec `npm start` (le script force `--clear`) : les variables d'environnement
  sont lues au démarrage du bundler, pas à chaud
- Sur un build EAS, le message « Configuration Turso manquante » désigne des secrets EAS
  absents — voir la section de dépannage plus bas
- Vérifiez que votre token Turso est valide : `turso db tokens list mavy`

### L'app ne se connecte pas à Turso
- Vérifiez votre connexion internet
- Vérifiez que l'URL de la base ne contient pas d'espaces ou de caractères spéciaux

### Le QR code ne fonctionne pas
- Assurez-vous que votre téléphone et votre ordinateur sont sur le même réseau WiFi
- Essayez le mode "Tunnel" : `npm start -- --tunnel`

### « Impossible de charger les catégories » sur un build (EAS)
Ce message signale une **erreur de connexion/requête**, pas une base vide (une
base vide renvoie simplement une liste vide, sans erreur). L'app affiche
désormais la cause exacte dans l'alerte et l'écran d'erreur. Les deux causes
fréquentes en production :

1. **Variables Turso absentes du build.** `app.config.js` lit `TURSO_URL` /
   `TURSO_AUTH_TOKEN`, qui pointent (via `eas.json`) vers les variables EAS
   `TURSO_URL_PROD` / `TURSO_TOKEN_PROD`. Vérifiez qu'elles existent :
   ```bash
   eas env:list --environment production
   # au besoin :
   eas env:create --environment production --name TURSO_URL_PROD --value "libsql://..."
   eas env:create --environment production --name TURSO_TOKEN_PROD --value "eyJ..." --type secret
   ```
   Le message « Configuration Turso manquante » confirme ce cas.

2. **Migrations non appliquées sur la base de prod.** Si l'erreur ressemble à
   `no such table: categories`, la base de production n'a jamais été migrée :
   ```bash
   npm run migration:prod
   ```

## 📊 Base de données

### Structure des tables

**categories**
- id (INTEGER PRIMARY KEY)
- name (TEXT)
- icon (TEXT)
- color (TEXT)
- created_at (DATETIME)

**actions**
- id (INTEGER PRIMARY KEY)
- category_id (INTEGER)
- name (TEXT)
- created_at (DATETIME)

**entries**
- id (INTEGER PRIMARY KEY)
- action_id (INTEGER)
- notes (TEXT)
- created_at (DATETIME)

### Consulter vos données

```bash
# Se connecter à votre base de données
turso db shell mavy

# Lister les catégories
SELECT * FROM categories;

# Lister les entrées récentes
SELECT * FROM entries ORDER BY created_at DESC LIMIT 10;
```

## 🌟 Prochaines améliorations possibles

- [ ] Notifications pour rappeler certaines actions
- [ ] Graphiques et statistiques
- [ ] Export des données en CSV
- [ ] Thème sombre
- [ ] Ajout de notes aux entrées
- [ ] Photos attachées aux entrées
- [ ] Filtres dans l'historique

## 🔐 Modèle de sécurité

**Le token Turso est embarqué en clair dans l'APK. C'est un choix assumé, pas un oubli.**

`app.config.js` injecte `TURSO_URL` / `TURSO_AUTH_TOKEN` dans `extra`, qui finit dans le
bundle JavaScript. Quiconque récupère l'APK peut en extraire le token et obtient alors un
accès **lecture et écriture complet** à la base — donc aux données des deux profils.

Il n'y a pas de moyen de cacher un secret dans une app mobile : toute valeur nécessaire au
client peut être extraite du binaire. Seul un backend proxy détenant le token supprimerait
réellement le problème. Ce n'est pas justifié ici.

### Pourquoi c'est acceptable dans ce cas

- App **familiale et privée** : elle n'est ni publiée sur un store, ni distribuée hors du
  cercle de ses deux utilisateurs.
- Les données sont **sans enjeu** : des dates d'entretien de voiture et de rendez-vous chez
  le coiffeur. Ni identifiants, ni données bancaires, ni données de santé.
- Le rayon de fuite est **limité à cette base**, qui ne sert qu'à cette app.

### Ce qui rendrait ce choix caduc

Si l'une de ces situations se présente, il faut passer à un backend proxy :

- l'APK est publié sur un store ou diffusé hors du cercle familial ;
- des données sensibles (santé, finances, identifiants) sont ajoutées à l'app ;
- le nombre de profils dépasse le cadre familial.

### Rotation du token

À faire dès qu'un APK a pu fuiter (téléphone perdu, APK envoyé à un tiers, partage par
erreur), et par hygiène de temps en temps :

```bash
# 1. Créer un nouveau token
turso db tokens create mavy

# 2. Révoquer TOUS les anciens tokens de la base
turso db tokens invalidate mavy

# 3. Mettre à jour les secrets EAS
eas env:update --environment production --name TURSO_TOKEN_PROD

# 4. Rebuild et réinstaller : les anciens APK ne fonctionnent plus
eas build --platform android --profile production
```

L'étape 2 casse volontairement toutes les installations existantes : c'est le but. Après une
rotation, chaque téléphone doit réinstaller l'APK à jour.

## 📝 Licence

Projet personnel - Libre d'utilisation et de modification

## 🤝 Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs dans le terminal Expo
2. Consultez la documentation Turso : https://docs.turso.tech
3. Consultez la documentation Expo : https://docs.expo.dev

---

Bon tracking ! 🚀
