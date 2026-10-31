# Avancement — Water Finder

_Dernière mise à jour : 31/10/2026 — phases 1 à 7 développées, phase 8 en cours (recette locale
par le porteur du projet)._

## Résumé

| Phase                                                                  | État                                                                                                  |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 1 — Socle, navigation, design system, carte, géolocalisation           | ✅ Terminée                                                                                           |
| 2 — Backend Supabase / PostGIS (schéma, RLS, API SQL)                  | ✅ Développée, testée sur PostgreSQL 16 (local) et 17 (CI, comme Supabase) — 70 tests pgTAP           |
| 3 — Imports ETL (OpenStreetMap, data.gouv.fr, Opendatasoft)            | ✅ Développée ; chargement testé en base ; **jamais exécutée sur les vraies API** (réseau bloqué ici) |
| 4 — Géocodage, fiche complète, partage, favoris                        | ✅ Développée, testée (tests automatisés)                                                             |
| 5 — Comptes, contributions, modération côté application, notifications | ✅ Développée, testée (tests automatisés + SQL)                                                       |
| 6 — AdMob, consentement UMP, ATT                                       | ✅ Développée ; **non testée sur appareil** (module natif)                                            |
| 7 — Administration Next.js                                             | ✅ Développée ; build et redirections testés ; parcours connecté non testé ici                        |
| 8 — Sécurité, tests, documentation, recette                            | ⏳ En cours : revue de sécurité faite, recette locale à faire ([LOCAL_TESTING.md](LOCAL_TESTING.md))  |

**Rien n'est déployé** : aucun projet Supabase en ligne, aucun déploiement Vercel, aucune
soumission aux stores. Prochaine étape : votre recette manuelle locale.

**Dépôt** : <https://github.com/MustaphaAitHamou/Project_Aman> (branche `main`), CI GitHub Actions.

---

## Ce qui existe

### Base de données (`supabase/`)

- 7 migrations : schéma (potabilité / fonctionnement / disponibilité séparés, contrainte de
  certification, index GiST), RLS sur toutes les tables, API de lecture (`water_points_in_bbox`,
  `water_points_nearby`, `water_point_detail`), contributions (ajout, signalement, modification,
  photo — quotas, détection de doublon à 15 m, file de modération), modération, fusion,
  statistiques, suppression de compte, imports (`etl_*`, idempotents, sans suppression),
  stockage des photos (compartiment privé), administration (`moderation_queue`,
  `admin_search_points`).
- Détails : [DATABASE.md](DATABASE.md).

### Imports (`packages/importers`)

- Connecteurs : OpenStreetMap (Overpass), data.gouv.fr (recherche + CSV/JSON/GeoJSON génériques),
  Opendatasoft (Ville de Paris « fontaines à boire »).
- Client HTTP avec reprises et délai ; transformation défensive (coordonnées non WGS84 rejetées,
  rien d'inventé) ; aucune source ne certifie automatiquement la potabilité ; une source non
  vérifiée exige `--allow-unverified`.
- CLI `npm run etl -- list | discover | import` ; workflow GitHub hebdomadaire (inactif tant que
  le secret `SUPABASE_DB_URL` n'est pas défini).
- Détails : [DATA_SOURCES.md](DATA_SOURCES.md).

### Application (`apps/mobile`)

- Phase 1 : carte MapLibre, géolocalisation premier plan, filtres, légende, onboarding,
  paramètres, i18n FR/EN, thèmes, mode démo réservé au développement.
- Données réelles via Supabase (sinon message explicite « aucune source »).
- Recherche d'adresses (Géoplateforme IGN / BAN), temporisée ; seul le texte saisi est envoyé.
- Fiche complète : statuts, preuve de potabilité (type, source, date, lien), informations,
  horaires, photos (URL signées), derniers signalements, provenance, itinéraire, partage, favori,
  actions de contribution, bannière publicitaire en bas.
- Comptes : inscription (confirmation e-mail), connexion, mot de passe oublié, pseudonyme,
  déconnexion, suppression du compte ; session dans le stockage sécurisé de l'appareil.
- Contributions : ajout de point (position GPS précise ≤ 50 m ou centre de la carte zoomée),
  signalements, modifications (seuls les champs changés sont envoyés), photos réencodées en JPEG
  (EXIF et position supprimés, 1 600 px max) ; favoris ; « Mes contributions » ; onglet
  Activité (décisions de modération).
- Publicité : consentement UMP après la présentation (jamais au premier écran), puis ATT sur
  iOS ; bannière adaptative et annonce native signalées « Publicité » (fiche, recherche) ;
  annonces non personnalisées en cas de refus ; blocs de test Google hors production ;
  interstitiels préparés mais désactivés ; aucune publicité sur le web ; gestion des choix dans
  Confidentialité.

### Administration (`apps/admin`)

- Next.js 16, connexion modérateur, tableau de bord, modération (effet attendu affiché avant
  validation, tableau avant/après pour les modifications, aperçu des photos), doublons et
  fusion, recherche de points avec carte, historique des imports et erreurs, gestion des rôles
  (administrateurs).
- Aucune clé `service_role` : session Supabase + RLS + fonctions SQL réservées aux modérateurs.
- En-têtes de sécurité, non indexée ; `vercel.json` préparé, **non déployé**.

---

## Tests réellement exécutés (31/10/2026)

| Vérification                                                           | Résultat                                                     |
| ---------------------------------------------------------------------- | ------------------------------------------------------------ |
| `npm run check` (Prettier, TypeScript 5 paquets, ESLint, tests)        | ✅                                                           |
| Jest `apps/mobile`                                                     | ✅ 15 suites, **133 tests**                                  |
| Vitest `packages/core`                                                 | ✅ **32 tests**                                              |
| Vitest `packages/importers` avec base PostGIS réelle                   | ✅ **19 tests** (dont chargement en base)                    |
| Vitest `apps/admin`                                                    | ✅ 3 tests                                                   |
| pgTAP (PostgreSQL 16 local, 17 en CI + privilèges par défaut Supabase) | ✅ **70 tests**                                              |
| Export web, Android (Hermes)                                           | ✅                                                           |
| `next build` de l'administration                                       | ✅                                                           |
| Serveur d'administration : redirection vers /login, en-têtes           | ✅ (sans Supabase joignable)                                 |
| CI GitHub (qualité, base de données, bundles)                          | ✅ sur `dcbe2dc` ; vérifier l'exécution des derniers commits |

Nouveaux tests (phases 4 à 7) : analyse de la réponse de géocodage et absence d'envoi de
position ; blocs publicitaires (test hors production, aucun en production non configurée,
interstitiels désactivés) ; parcours de consentement (refus → non personnalisé, formulaire
unique) ; traduction des erreurs d'authentification ; chemin de stockage des photos ; message de
partage ; formulaire d'ajout (visiteur bloqué, envoi GPS, jamais de certification, doublon avec
lien, GPS imprécis refusé) ; différences d'une modification ; statuts de contribution ;
libellés de l'administration ; SQL : file de modération et recherche réservées aux modérateurs,
fonctions internes non appelables, coordonnées fournies au modérateur.

### Non testé (impossible dans cet environnement)

- **Appels réels aux services publics** : Overpass, data.gouv.fr, opendata.paris.fr,
  Géoplateforme (géocodage), tuiles OpenFreeMap — hôtes bloqués par la politique réseau.
  Les connecteurs sont testés avec des réponses simulées au format documenté.
- **Supabase complet** (authentification, PostgREST, stockage) : Docker indisponible ici ; la base
  est testée en SQL et l'application avec des réponses enregistrées depuis cette base.
- **Appareils** : rendu natif, GPS réel, caméra, UMP/ATT, AdMob, compilation Gradle/Xcode.
- Parcours connecté de l'administration.

→ Tout cela est couvert par la recette de [LOCAL_TESTING.md](LOCAL_TESTING.md).

## Recette locale du porteur du projet (en cours, 31/10/2026, Windows)

| Étape                                                     | Résultat                                                               |
| --------------------------------------------------------- | ---------------------------------------------------------------------- |
| Fond de carte OpenFreeMap (aperçu web)                    | ✅ s'affiche (première vérification réelle)                            |
| Import OpenStreetMap réel, Paris, `--dry-run`             | ✅ 1 590 éléments reçus d'Overpass, 1 590 valides, 0 rejeté            |
| `npx supabase start`                                      | ❌ → corrigé : `major_version = 16` refusé par la CLI, passé à **17**  |
| `npx supabase start` (2ᵉ essai)                           | ❌ port 54322 déjà pris sous Windows → ports du projet passés en 443xx |
| Import réel en base, application branchée, administration | ⏳ à faire                                                             |

## Revue de sécurité (phase 8)

- ✅ Corrigé : sur Supabase, `authenticated` gardait l'exécution des fonctions internes
  (`notify_user`, `log_moderation`) ; révocation ajoutée et tests qui reproduisent les privilèges
  par défaut de Supabase (ils échouent sans le correctif).
- ✅ Aucune clé `service_role` dans les applications ; aucun secret versionné (recherche de motifs).
- ✅ Authentification Supabase : confirmation d'e-mail, mot de passe ≥ 8, changement de mot de
  passe sécurisé, URL de redirection limitées aux schémas de l'application.
- ✅ Photos : compartiment privé, dossier par utilisateur, JPEG/WebP ≤ 6 Mio, chemin validé en
  SQL, EXIF supprimé côté application.
- ⚠️ `npm audit` : 30 alertes, toutes dans l'outillage (Expo CLI, Jest) ; le correctif proposé
  rétrograderait Expo à 54 → non appliqué, à suivre avec les mises à jour du SDK.

## Bugs et limites connus

| #   | Description                                                                                           | Gravité                  |
| --- | ----------------------------------------------------------------------------------------------------- | ------------------------ |
| 1   | Connecteurs jamais exécutés sur les vraies API (formats réels à confirmer)                            | Haute (recette locale)   |
| 2   | Licences des sources (ODbL OSM, jeu Paris) et conditions OpenFreeMap à valider                        | Haute (avant production) |
| 3   | Aucun test sur appareil (carte native, publicités, caméra)                                            | Haute (avant bêta)       |
| 4   | Notifications uniquement dans l'application (pas de push)                                             | Moyenne                  |
| 5   | Placement d'un nouveau point par le centre de la carte (pas de repère déplaçable)                     | Faible                   |
| 6   | Panneau d'aperçu non glissable au doigt                                                               | Faible                   |
| 7   | Traduction anglaise non relue par un natif                                                            | Moyenne                  |
| 8   | Pas de limitation de fréquence sur la recherche d'adresses côté application (temporisation seulement) | Faible                   |

## Ce qui nécessite votre intervention

1. **Recette locale** selon [LOCAL_TESTING.md](LOCAL_TESTING.md) (Docker + Supabase local + imports réels).
2. **Comptes** : Supabase (projet en ligne), Expo/EAS, Apple Developer (payant), Google Play
   Console (payant), AdMob (identifiants d'application et de blocs), Vercel.
3. **Décisions** : identifiant d'application définitif, fournisseur de tuiles de production,
   avis juridique ODbL, politique de confidentialité publiée, adresse de contact sécurité.
4. **Secrets CI** : `SUPABASE_DB_URL` dans GitHub pour activer les imports hebdomadaires.

## Prochaine étape (convenue avec le porteur du projet)

1. Le porteur du projet fait la recette locale ([LOCAL_TESTING.md](LOCAL_TESTING.md)) et
   transmet les problèmes (messages d'erreur, résultats des imports `npm run etl`, captures).
2. Dès réception, sans nouvelle validation : corriger tous les problèmes remontés, puis
   développer les améliorations déjà approuvées :
   - notifications push (décisions de modération) ;
   - repère déplaçable sur la carte pour placer un nouveau point ;
   - panneau d'aperçu glissable au doigt.
3. Ensuite seulement : préproduction (Vercel, Supabase en ligne), sur accord explicite.

## Reprendre le travail (nouvelle session)

```bash
git clone https://github.com/MustaphaAitHamou/Project_Aman.git
```

```bash
cd Project_Aman && npm install && npm run check
```

Lire [CLAUDE.md](CLAUDE.md), [ARCHITECTURE.md](ARCHITECTURE.md) puis ce fichier. Tests SQL
locaux : `npm run db:test` (PostgreSQL 16/17 + PostGIS + pgTAP, variables `PGHOST`/`PGPORT`/`PGUSER`).
