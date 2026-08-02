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

Ouvrez le fichier `src/config/turso.js` et remplacez les valeurs par les vôtres :

```javascript
export const tursoConfig = {
  url: 'libsql://mavy-votre-nom.turso.io', // Votre URL Turso
  authToken: 'eyJ...' // Votre token Turso
};
```

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
```

## 🐛 Dépannage

### Erreur "Impossible d'initialiser la base de données"
- Vérifiez que vous avez bien rempli `url` et `authToken` dans `src/config/turso.js`
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

## 📝 Licence

Projet personnel - Libre d'utilisation et de modification

## 🤝 Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs dans le terminal Expo
2. Consultez la documentation Turso : https://docs.turso.tech
3. Consultez la documentation Expo : https://docs.expo.dev

---

Bon tracking ! 🚀
