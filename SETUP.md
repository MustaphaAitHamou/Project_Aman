# Installation et lancement

## Prérequis

| Outil                   | Version                        | Usage                                     |
| ----------------------- | ------------------------------ | ----------------------------------------- |
| Node.js                 | 22 LTS (`.nvmrc`)              | Obligatoire                               |
| npm                     | 10+                            | Gestionnaire du monorepo (workspaces)     |
| Git                     | récent                         |                                           |
| Compte Expo + `eas-cli` | `npm i -g eas-cli`             | Development builds et builds de store     |
| Xcode (macOS)           | version exigée par Expo SDK 58 | Build iOS local (facultatif avec EAS)     |
| Android Studio + SDK    | version exigée par Expo SDK 58 | Build Android local (facultatif avec EAS) |

> MapLibre est un **module natif** : l'application ne fonctionne pas dans Expo Go. Il faut un
> _development build_ (local ou via EAS).

## 1. Installation

```bash
git clone https://github.com/MustaphaAitHamou/Project_Aman.git
cd Project_Aman
npm install
```

## 2. Variables d'environnement

```bash
cp .env.example apps/mobile/.env
```

En phase 1, aucune variable n'est obligatoire : sans configuration, l'application utilise le style
de carte OpenFreeMap et n'affiche aucun point d'eau (aucune source n'est encore branchée).
Détail de chaque variable : [.env.example](.env.example).

Pour tester l'interface de la carte avec des **données fictives** (développement uniquement) :

```bash
# dans apps/mobile/.env
EXPO_PUBLIC_DEMO_DATA=true
```

Un bandeau « Mode démonstration : données fictives » reste alors affiché en permanence ; les
points sont regroupés autour de Paris (onglet Recherche → Paris).

## 3. Vérifications

Depuis la racine :

```bash
npm run check
```

Enchaîne : formatage (Prettier), typage (TypeScript strict, routes typées incluses), lint
(ESLint), tests (Jest pour l'application, Vitest pour `core`).

Commandes séparées :

```bash
npm run typecheck
```

```bash
npm run lint
```

```bash
npm run test
```

## 4. Lancer l'application

### Aperçu web (le plus rapide)

```bash
npm run mobile:web
```

Ouvre `http://localhost:8081`. La carte web utilise maplibre-gl ; le navigateur doit pouvoir
joindre le serveur de tuiles configuré.

### Development build iOS / Android

Première fois (crée le projet EAS et renseigne `EAS_PROJECT_ID`) :

```bash
cd apps/mobile
```

```bash
eas init
```

Build via EAS (sans Xcode / Android Studio locaux) :

```bash
eas build --profile development --platform android
```

```bash
eas build --profile development-simulator --platform ios
```

Ou build local (Android Studio / Xcode installés) :

```bash
npm run android --workspace @water-finder/mobile
```

```bash
npm run ios --workspace @water-finder/mobile
```

Puis lancer le serveur de développement et ouvrir l'application installée :

```bash
npm run mobile
```

Les dossiers natifs `ios/` et `android/` sont **générés** (Continuous Native Generation) et non
versionnés : toute configuration native passe par `app.config.ts` et les plugins.

## 5. Icônes et écran de lancement

Sources vectorielles : `apps/mobile/assets/source/*.svg`. Régénération des PNG :

```bash
node tools/render-icons.mjs
```

(nécessite Playwright et Chromium : `npx playwright install chromium`).

## Dépannage

| Symptôme                          | Cause probable                         | Solution                                                                |
| --------------------------------- | -------------------------------------- | ----------------------------------------------------------------------- |
| « Carte indisponible »            | Style ou tuiles injoignables           | Vérifier la connexion / `EXPO_PUBLIC_MAP_STYLE_URL`                     |
| Écran blanc dans Expo Go          | Module natif MapLibre absent d'Expo Go | Utiliser un development build                                           |
| Carte web vide, erreur de worker  | Worker non copié                       | Lancer via `npm run mobile:web` (copie `public/maplibre-gl-worker.mjs`) |
| Erreur de types sur une route     | Types de routes périmés                | `npm run routes:types --workspace @water-finder/mobile`                 |
| Chiffres absents dans les groupes | Police absente du serveur de glyphes   | Ajuster `EXPO_PUBLIC_MAP_FONT` à une police du style                    |
