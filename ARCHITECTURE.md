# Architecture

## Vue d'ensemble

Monorepo **npm workspaces** :

| Paquet                                 | Rôle                                                                             | État    |
| -------------------------------------- | -------------------------------------------------------------------------------- | ------- |
| `apps/mobile` (`@water-finder/mobile`) | Application Expo iOS / Android (+ web pour les tests)                            | Phase 1 |
| `packages/core` (`@water-finder/core`) | Domaine partagé, sans dépendance à React Native : types, règles, géo-utilitaires | Phase 1 |
| `apps/admin`                           | Tableau de bord Next.js                                                          | Phase 7 |
| `supabase/`                            | Migrations SQL, politiques RLS, fonctions                                        | Phase 2 |
| `packages/importers`                   | Connecteurs ETL (un par source)                                                  | Phase 3 |

Le paquet `core` est consommé directement en TypeScript (pas d'étape de build) par Metro, et le
sera par Next.js (`transpilePackages`) et par les scripts ETL (Node). Les règles métier (ex.
certification de la potabilité) sont écrites **une seule fois** et testées.

## Versions retenues (vérifiées le 29/10/2026)

| Composant                          | Version                      | Raison                                                                             |
| ---------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------- |
| Node.js                            | 22 LTS                       | Environnement disponible, requis par les outils                                    |
| Expo SDK                           | 58.0.21                      | Dernier SDK stable (sorti le 29/09/2026), aligné sur le template officiel          |
| React Native / React               | 0.88.1 / 19.3.0              | Imposés par le SDK 58 (New Architecture uniquement)                                |
| Expo Router                        | 58.0.28                      | Navigation par fichiers, routes typées                                             |
| TypeScript                         | ~6.0.3                       | Version du template Expo ; `typescript-eslint` exige < 6.1 (TypeScript 7 exclu)    |
| @maplibre/maplibre-react-native    | 11.5.1                       | Carte native (New Architecture, plugin Expo, RN ≥ 0.80)                            |
| maplibre-gl                        | 6.16.0                       | Carte web, même spécification de style (`@maplibre/maplibre-gl-style-spec` 26.4.4) |
| expo-location                      | 58.0.20                      | Localisation au premier plan                                                       |
| react-native-reanimated / worklets | 4.7.1 / 0.13.0               | Animations (versions du SDK)                                                       |
| @tanstack/react-query              | 5.105                        | Cache et chargement par zone                                                       |
| zustand                            | 5.0                          | État local (préférences persistées, localisation en mémoire)                       |
| i18next / react-i18next            | 26 / 17                      | Internationalisation (FR par défaut, EN)                                           |
| ESLint                             | 9.39 + eslint-config-expo 58 | Les plugins `import` et `react` ne déclarent pas encore ESLint 10                  |
| Jest / jest-expo                   | 30 / 58                      | Tests de l'application                                                             |
| Vitest                             | 5                            | Tests du paquet `core`                                                             |

Les versions natives sont celles de `expo/bundledNativeModules.json` ; `expo-doctor` confirme
l'alignement (contrôle « packages match versions required by installed Expo SDK »).

## Application mobile (`apps/mobile`)

```
src/
├── app/                    Routes Expo Router (un fichier = un écran)
│   ├── _layout.tsx         Fournisseurs, splash, garde d'onboarding (Stack.Protected)
│   ├── onboarding/         Présentation (3 étapes) + autorisation GPS
│   ├── (tabs)/             CARTE | RECHERCHE | AJOUTER | ACTIVITÉ | PROFIL
│   ├── filters.tsx         Modale des filtres
│   ├── map-legend.tsx      Légende de la carte
│   ├── point/[id].tsx      Fiche d'un point d'eau (version de base)
│   └── settings, privacy, sources, sign-in, sign-up, favorites, contributions, +not-found
├── components/
│   ├── ui/                 Design system (AppText, Button, IconButton, Chip, StatusBadge, Banner,
│   │                       Card, ListItem, Section, SegmentedControl, ToggleRow, SearchField,
│   │                       EmptyState, LoadingState, Screen)
│   ├── navigation/         Barre d'onglets personnalisée
│   └── ComingSoonScreen    Écran explicite des fonctionnalités des phases suivantes
├── features/
│   ├── map/                Écran carte, WaterMap (natif / web), couches, panneau, bandeaux
│   ├── search/             Recherche de villes
│   └── water-points/       Présentation des statuts, composants de fiche
├── services/
│   ├── location/           Service expo-location + pilote de suivi (premier plan)
│   ├── water-points/       Registre de dépôt, chargement par zone, mode démo
│   └── directions.ts       Ouverture d'itinéraire (Plans / Google Maps)
├── stores/                 Préférences (persistées), localisation (mémoire), caméra
├── theme/                  Jetons, thèmes clair/sombre, contraste WCAG, ThemeProvider
├── i18n/                   i18next, traductions FR/EN typées
├── config/env.ts           Configuration publique (EXPO_PUBLIC_*)
└── lib/                    Utilitaires (formatage, retour haptique, état de l'app)
```

### Navigation

- `Stack` racine avec `Stack.Protected` : tant que l'onboarding n'est pas terminé, seules les
  routes `onboarding/*` sont accessibles ; ensuite, l'onboarding devient inaccessible.
- Onglets : `expo-router/js-tabs` (et non `NativeTabs`) avec une barre personnalisée, pour un
  bouton central « Ajouter » mis en avant, un rendu identique iOS/Android/web et un contrôle total
  de l'accessibilité.
- Routes typées (`experiments.typedRoutes`) : le typecheck échoue si un lien vise une route
  inexistante. Les types sont générés par `scripts/generate-route-types.mjs`.

### Carte

`features/map/WaterMap.tsx` (natif) et `WaterMap.web.tsx` (web) exposent la **même interface**
(`WaterMap.types.ts`) ; Metro choisit le fichier selon la plateforme.

- Natif : `@maplibre/maplibre-react-native` v11 (`Map`, `Camera`, `GeoJSONSource`, `Layer`).
- Web : `maplibre-gl` v6. Son worker est servi comme fichier statique (`public/`), copié depuis
  `node_modules` par `scripts/copy-maplibre-worker.mjs`, car `import.meta.url` est réécrit par Metro.
- Les couches (`map-layers.ts`) sont écrites une seule fois au format MapLibre Style Spec et
  validées en test par le validateur officiel (`validateStyleMin`).
- Points : couleur selon la **potabilité** (vert certifiée, bleu indiquée, gris inconnue, rouge
  non potable), cercle **évidé** si un dysfonctionnement est signalé, halo de sélection.
- Groupes (clustering) natifs MapLibre ; toucher un groupe zoome jusqu'à son éclatement.
- Position de l'utilisateur : point + cercle de précision en mètres (couche GeoJSON alimentée par
  notre service, pas par le moteur de localisation de MapLibre).
- Fond de carte : URL de style configurable (`EXPO_PUBLIC_MAP_STYLE_URL`), OpenFreeMap par défaut.
  En cas d'échec de chargement, un écran d'erreur propose de réessayer.

### Chargement par zone

```
déplacement de carte → onViewportChange (bbox, zoom)
  → zoom < 11 ? « Zoomez » (aucune requête)
  → bbox agrandie de 25 % puis alignée sur une grille dépendant du zoom (quantizeBBox)
  → clé React Query ['water-points', 'bbox', bbox, filtres]  → cache (5 min frais, 30 min conservé)
  → WaterPointRepository.findInBounds({ bbox, filters, limit: 2000 })  → { points, truncated }
```

Jamais de chargement global ; au-delà de 2 000 points dans une zone, un message invite à zoomer.
L'interface `WaterPointRepository` vit dans `core` ; l'implémentation Supabase/PostGIS arrive en
phase 2 (`services/water-points/registry.ts`).

### Localisation

- `services/location/location-service.ts` : unique point d'accès à `expo-location`
  (autorisation **au premier plan**, services activés, dernière position connue, suivi).
- `useLocationTracking()` est monté une seule fois (layout des onglets) : le suivi ne tourne que
  si l'autorisation est accordée **et** l'application au premier plan ; il est coupé dès le
  passage en arrière-plan. L'autorisation est relue au retour (changement dans les réglages).
- `stores/location.ts` garde **uniquement la dernière position, en mémoire** : ni persistance, ni
  historique, ni envoi réseau.
- Refus de la localisation : l'application reste utilisable (recherche de ville, bandeaux).

### Thème et design system

- Jetons (`theme/tokens.ts`) → thèmes sémantiques clair/sombre (`theme/colors.ts`).
- Les contrastes WCAG AA (texte ≥ 4,5:1, composants ≥ 3:1, marqueurs ≥ 3:1 sur fonds de carte
  clairs) sont **vérifiés par des tests automatisés**.
- Thème : Système / Clair / Sombre (préférence persistée), appliqué aussi aux éléments natifs.
- Cibles tactiles ≥ 48 px, rôles et libellés d'accessibilité, respect de « réduire les
  animations », taille de police système respectée (bornée pour les éléments compacts).

### Internationalisation

- `fr.ts` est la référence typée ; `en.ts` doit avoir exactement les mêmes clés (compilation) et les
  mêmes variables d'interpolation (test).
- Langue : choix de l'utilisateur, sinon langue de l'appareil (fr/en), sinon **anglais**
  (visiteurs étrangers). Textes des autorisations iOS localisés (`locales/*.json`).

### État et persistance

| Store         | Persistance      | Contenu                                                  |
| ------------- | ---------------- | -------------------------------------------------------- |
| `preferences` | AsyncStorage     | Onboarding, thème, langue, unités, filtres               |
| `location`    | Aucune (mémoire) | Autorisation, dernière position, état du suivi           |
| `map-camera`  | Aucune           | Déplacement demandé à la carte (ex. depuis la recherche) |

### Configuration et environnements

`app.config.ts` décline nom, identifiants et schéma d'URL par `APP_ENV`
(development / staging / production), bloque les permissions inutiles, refuse le mode démo en
production et refuse un `APP_ENV` invalide. Voir [DEPLOYMENT.md](DEPLOYMENT.md).

## Décisions techniques

| #   | Décision                                      | Justification                                                                                                                                                      |
| --- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D1  | Expo SDK 58 plutôt que 57                     | Dernier stable ; lancement en 2027 : partir de la version la plus récente limite les migrations                                                                    |
| D2  | MapLibre plutôt que react-native-maps         | Tuiles libres (OpenStreetMap), pas de dépendance Google/Apple, style vectoriel maîtrisé                                                                            |
| D3  | Barre d'onglets JS personnalisée              | Bouton central « Ajouter », rendu identique sur toutes les plateformes                                                                                             |
| D4  | Panneau d'aperçu maison (Reanimated)          | `@gorhom/bottom-sheet` 5.2.14 est antérieur à Gesture Handler 3 (API modifiée) : risque d'incompatibilité non testable ici                                         |
| D5  | Position utilisateur dessinée par nos couches | Une seule source de vérité (notre service), contrôle de la vie privée                                                                                              |
| D6  | Worker maplibre-gl en fichier statique        | Metro réécrit `import.meta.url` ; vérifié dans le bundle exporté                                                                                                   |
| D7  | Mode démonstration isolé                      | Données fictives nommées comme telles, bandeau permanent, interdit en production, **absent des bundles** hors mode démo (vérifié)                                  |
| D8  | ESLint 9                                      | npm signale ESLint 9 comme non maintenu, mais `eslint-plugin-import` / `eslint-plugin-react` (requis par eslint-config-expo 58) ne supportent pas encore ESLint 10 |
| D9  | TypeScript 6.0                                | TypeScript 7 (compilateur natif) n'est pas supporté par typescript-eslint 8                                                                                        |
| D10 | Recherche de villes locale en phase 1         | Permet la recherche manuelle sans GPS dès maintenant ; le géocodage d'adresses (Base Adresse Nationale) arrive en phase 4                                          |

## Extensibilité internationale

- Code pays ISO sur chaque point (`countryCode`), sources identifiées par `sourceKey`.
- Connecteurs d'import indépendants (un par source), activables par pays (phase 3).
- Unités métriques/impériales, langues ajoutables par simple fichier de traduction.
- Styles de carte et fournisseurs de tuiles configurables par variable d'environnement.
