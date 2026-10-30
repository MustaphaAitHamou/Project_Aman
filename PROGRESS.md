# Avancement — Water Finder

_Dernière mise à jour : 30/10/2026 — fin de la phase 1._

## Résumé

| Phase                                                                                        | État                                                   |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| 1 — Initialisation, architecture, navigation, design system, première carte, géolocalisation | ✅ **Terminée** (vérifiée hors appareil, voir limites) |
| 2 — Backend Supabase / PostGIS                                                               | ⏳ Prochaine étape                                     |
| 3 à 8                                                                                        | À venir ([ROADMAP.md](ROADMAP.md))                     |

**Aucune donnée réelle de point d'eau n'est encore affichée** : aucune source n'est branchée
(phases 2-3). L'application l'indique clairement sur la carte.

**Dépôt** : <https://github.com/MustaphaAitHamou/Project_Aman> (public, branche `main`), avec
intégration continue GitHub Actions.

---

## Fonctionnalités terminées (phase 1)

### Socle

- Monorepo npm workspaces : `apps/mobile` (Expo SDK 58 / RN 0.88 / React 19.3 / Expo Router 58)
  et `packages/core` (domaine partagé).
- TypeScript strict partout (`noUncheckedIndexedAccess`), routes typées Expo Router.
- ESLint (eslint-config-expo), Prettier, Jest (application), Vitest (core).
- `app.config.ts` par environnement (development / staging / production) : noms, identifiants,
  schémas d'URL distincts ; refus du mode démo en production ; refus d'un `APP_ENV` invalide.
- Permissions minimales (localisation au premier plan uniquement) bloquées explicitement.
- Icône, icône adaptative Android (avec monochrome), écran de lancement clair/sombre, favicon
  (sources SVG + script de génération).
- `eas.json` (development, development-simulator, staging, production ; submit préparé).
- CI GitHub Actions : qualité (formatage, types, lint, tests) + bundles web/Android/iOS.

### Domaine (`packages/core`)

- Modèle d'un point d'eau avec **trois statuts distincts** : potabilité, fonctionnement,
  disponibilité ; type d'eau (plate/gazeuse), gratuité, accessibilité, horaires, sources.
- Règle de certification : `certified_potable` exige une preuve officielle **datée** ; sinon
  rétrogradation en « indiquée potable ». Une contribution ne certifie jamais.
- Ancienneté de l'information (récente < 90 j, ancienne > 365 j, inconnue).
- Filtres (potabilité, hors service, gazeuse, gratuit, PMR, fontaines décoratives) ; un point
  « n'existe plus » n'est jamais affiché.
- Géo : distance haversine, formatage localisé (m/km, ft/mi), emprises (agrandissement,
  quantification pour le cache), URL d'itinéraire Apple Plans / Google Maps.
- Interface `WaterPointRepository` (requêtes par emprise, par identifiant, plus proches voisins).

### Application

- **Design system** : jetons, thèmes clair/sombre (choix Système/Clair/Sombre), typographie,
  composants (texte, boutons, bouton icône, puces, badges de statut, bandeaux, cartes, listes,
  sections, contrôle segmenté, interrupteurs, champ de recherche, états vide/chargement/erreur).
  Contrastes WCAG AA vérifiés par tests.
- **i18n** : français (référence) et anglais complets, typés ; langue Système/Français/English.
- **Navigation** : splash maintenu jusqu'au chargement des préférences, onboarding (3 étapes),
  écran d'autorisation GPS expliqué (« Pas maintenant » possible), 5 onglets
  CARTE | RECHERCHE | AJOUTER | ACTIVITÉ | PROFIL avec bouton central mis en avant.
- **Carte** : MapLibre natif + maplibre-gl web ; position de l'utilisateur et précision ;
  bouton de recentrage (demande l'autorisation si besoin) ; barre de recherche ; filtres actifs
  en puces retirables ; légende ; points colorés selon la potabilité, évidés si hors service ;
  groupes avec compteur (toucher = zoom) ; panneau d'aperçu (statuts, distance, type d'eau,
  gratuité, PMR, date de vérification, source, avertissement de potabilité, itinéraire, fiche) ;
  chargement par zone avec cache, zoom minimal 11, plafond 2 000 points ; messages honnêtes
  (aucune source, zoomez, zone vide, aucun résultat avec filtres, erreur + réessayer,
  localisation refusée/bloquée/désactivée) ; écran d'erreur si le fond de carte ne charge pas.
- **Géolocalisation** : service unique `expo-location`, premier plan uniquement, arrêt en
  arrière-plan, relecture de l'autorisation au retour, dernière position en mémoire seulement.
- **Recherche** : « Autour de moi » + recherche locale de 40 grandes villes (sans accent ni
  casse) qui recentre la carte — recherche manuelle quand le GPS est refusé.
- **Filtres** (modale, appliqués en direct et mémorisés), **légende**, **fiche de base** d'un
  point, **itinéraire** (Plans/Google Maps sur iOS, Google Maps ailleurs).
- **Profil** : invité, accès connexion/inscription, favoris, contributions, paramètres,
  confidentialité, sources des données, version.
- **Paramètres** : thème, langue, unités, état de l'autorisation + accès aux réglages, revoir la
  présentation.
- **Écrans des phases suivantes** (connexion, inscription, favoris, contributions, activité) :
  explicites, avec retour à la carte — aucun bouton sans effet.
- **Mode démonstration** (développement uniquement, `EXPO_PUBLIC_DEMO_DATA=true`) : 30 points
  fictifs nommés « Point de démonstration n°… », bandeau permanent, interdit en production, exclu
  des bundles lorsqu'il est désactivé.

## Fonctionnalités en cours

Aucune : la phase 1 est close. La phase 2 n'est pas commencée (en attente de validation).

---

## Tests réellement exécutés (30/10/2026)

| Vérification                                                                              | Résultat                                                                                                                                                                                                                   |
| ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run check` (racine) : Prettier, TypeScript (2 paquets, routes typées), ESLint, tests | ✅ tout passe                                                                                                                                                                                                              |
| Vitest `packages/core`                                                                    | ✅ 4 fichiers, **32 tests**                                                                                                                                                                                                |
| Jest `apps/mobile`                                                                        | ✅ 11 suites, **110 tests**                                                                                                                                                                                                |
| ESLint                                                                                    | ✅ 0 erreur, 0 avertissement                                                                                                                                                                                               |
| `expo-doctor`                                                                             | ⚠️ 18/20 ; les 2 contrôles en échec exigent l'accès réseau à exp.host / React Native Directory (bloqué ici). Alignement des versions sur le SDK : ✅                                                                       |
| `expo export` web                                                                         | ✅                                                                                                                                                                                                                         |
| `expo export` Android + iOS (Metro + compilation Hermes)                                  | ✅ 1 933 / 1 936 modules, bytecode `.hbc` produit                                                                                                                                                                          |
| `expo prebuild` dev et production (génération des projets natifs)                         | ✅ plugins appliqués ; permissions vérifiées dans le manifeste et l'Info.plist (voir DEPLOYMENT.md)                                                                                                                        |
| Gardes de configuration                                                                   | ✅ production + démo → refus ; `APP_ENV` invalide → refus ; valeurs staging correctes                                                                                                                                      |
| Contenu des bundles                                                                       | ✅ données de démo absentes des bundles web/Android/iOS hors mode démo ; maplibre-gl web absent des bundles natifs                                                                                                         |
| Navigateur (Playwright, Chromium, build web) — parcours standard                          | ✅ onboarding → autorisation → carte → 4 onglets → paramètres → thème sombre, sans erreur JavaScript                                                                                                                       |
| Navigateur — parcours démo (11 vérifications)                                             | ✅ 11/11 : bandeau démo, toucher d'un point → panneau, nom, distance « à 70 m », 3 statuts distincts, fiche, filtre « Certifiée » + puce, retrait de la puce, recherche « lyo », zone vide à Lyon, message de zoom minimal |
| Icônes                                                                                    | ✅ générées, dimensions et transparence vérifiées (icône iOS sans alpha)                                                                                                                                                   |
| CI GitHub Actions sur `main` (premier push, commit `0db28dd`)                             | ✅ job qualité 11/11 étapes, job bundles 10/10 étapes ([exécution 41077597795](https://github.com/MustaphaAitHamou/Project_Aman/actions/runs/41077597795))                                                                 |

Contenu des tests automatisés : règles de potabilité, ancienneté, filtres, distances et formats,
emprises et cache, URL d'itinéraire ; contrastes WCAG (2 thèmes + marqueurs) ; cohérence FR/EN
(clés et variables) ; choix de la langue ; dates relatives ; store et pilote de localisation
(autorisations, suivi, arrêt/reprise en arrière-plan, services désactivés, coordonnées invalides) ;
priorité des messages de carte ; puces de filtres ; GeoJSON ; **validation des couches par le
validateur officiel MapLibre** ; recherche de villes ; chargement par zone (absence de source,
zoom minimal, filtres, réutilisation du cache) ; cohérence des données de démo ; persistance des
préférences (aucune coordonnée enregistrée) ; composants accessibles ; intégration de l'écran
carte (points, panneau, distance, navigation, recentrage, filtres, recherche, erreur de fond de carte).

### Non testé (impossible dans l'environnement de la phase 1)

- **Aucune exécution sur iPhone, Android, simulateur ou émulateur** (pas de SDK Android ni de
  Xcode) : rendu natif MapLibre, dialogues de permission natifs, retour haptique, performances
  sur un téléphone de milieu de gamme.
- **Compilation native** Gradle / Xcode (seuls les bundles JS et la génération des projets ont
  été vérifiés).
- **Tuiles réelles** : le fond de carte OpenFreeMap n'a jamais pu être chargé (hôte bloqué) ;
  les tests navigateur utilisaient un style local uni. La police des compteurs
  (`Noto Sans Bold`) n'est pas vérifiée sur le serveur de glyphes.
- GPS réel (position simulée dans le navigateur ; logique native testée avec des mocks).
- Lecteurs d'écran (VoiceOver / TalkBack) en conditions réelles.

## Bugs et limites identifiés

| #   | Description                                                                                    | Gravité                                   | Piste                                                     |
| --- | ---------------------------------------------------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------- |
| 1   | Validation sur appareil réel non faite                                                         | Haute (avant phase 2)                     | Development build EAS + recette manuelle                  |
| 2   | Conditions d'utilisation d'OpenFreeMap non vérifiées                                           | Haute (avant production)                  | Voir DATA_SOURCES.md                                      |
| 3   | Le panneau d'aperçu ne se glisse pas au doigt (fermeture par bouton ou toucher de la carte)    | Faible                                    | Feuille glissante avec Gesture Handler 3 (phase 4)        |
| 4   | « Localisation de l'appareil désactivée » ouvre les réglages de l'app, pas ceux du GPS         | Faible                                    | `enableNetworkProviderAsync` sur Android                  |
| 5   | Un point sélectionné reste ouvert s'il est regroupé après un dézoom                            | Faible                                    | Fermer le panneau quand le point n'est plus visible       |
| 6   | En mode démo, la source affichée d'un point « certifié » est « Données publiques officielles » | Faible (démo uniquement, bandeau présent) | —                                                         |
| 7   | Traduction anglaise non relue par un natif                                                     | Moyenne                                   | Relecture avant publication                               |
| 8   | ESLint 9 signalé « non maintenu » par npm                                                      | Faible                                    | Passer à ESLint 10 quand eslint-config-expo le supportera |
| 9   | Avertissements npm de dépendances transitives obsolètes (outillage de test)                    | Faible                                    | Suivre les mises à jour Expo / Jest                       |
| 10  | `packages/core` sans ESLint (couvert par TypeScript strict + tests)                            | Faible                                    | Ajouter une config ESLint TS                              |
| 11  | Le premier typecheck démarre brièvement Metro pour générer les routes typées                   | Faible                                    | Normal avec Expo Router                                   |

## Accès externes manquants

**Réseau de l'environnement cloud** (connexions refusées par la politique réseau) :
`tiles.openfreemap.org`, `openfreemap.org`, `data.gouv.fr`, `schema.data.gouv.fr`,
`opendata.paris.fr`, `overpass-api.de`, `expo.dev` / `exp.host`, `dl.google.com` (SDK Android),
`maplibre.org`, dépôts GitHub publics. **Indispensable pour la phase 3** (données officielles et
OSM) ; à autoriser dans les paramètres réseau de l'environnement.

**Comptes et décisions du porteur de projet :**

- Compte Expo / EAS (development builds), Apple Developer, Google Play Console.
- Projet Supabase (phase 2) — ou accord pour développer d'abord sur une instance locale.
- Compte AdMob (phase 6), compte Vercel (phase 7).
- Décisions : identifiant d'application définitif, nom commercial, fournisseur de tuiles de
  production, avis juridique ODbL, URL de politique de confidentialité, licence du code.

## Prochaine étape

1. **Valider la phase 1 sur appareil** : `eas init`, puis
   `eas build --profile development --platform android` (et iOS), recette de la carte, des
   permissions et des onglets.
2. **Phase 2 — backend** : projet Supabase ; migrations PostGIS selon [DATABASE.md](DATABASE.md)
   (énumérations, tables, contrainte de certification, index GiST, RLS, RPC
   `water_points_in_bbox` / `nearby`) ; tests SQL des politiques et des requêtes ;
   implémentation `SupabaseWaterPointRepository` dans `services/water-points/registry.ts` ;
   session via `expo-secure-store`.

## Reprendre le travail (nouvelle session)

```bash
git clone https://github.com/MustaphaAitHamou/Project_Aman.git
```

```bash
cd Project_Aman
```

```bash
npm install
```

```bash
npm run check
```

Lire [CLAUDE.md](CLAUDE.md) et [ARCHITECTURE.md](ARCHITECTURE.md). Points d'entrée :
`apps/mobile/src/app/_layout.tsx` (navigation), `apps/mobile/src/features/map/MapScreen.tsx`
(carte), `apps/mobile/src/services/water-points/registry.ts` (branchement du backend),
`packages/core/src/index.ts` (domaine).
