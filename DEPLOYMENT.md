# Déploiement

> **Rien n'est publié en production sans l'autorisation explicite du porteur de projet.**

## Environnements

|                           | development               | staging                       | production                       |
| ------------------------- | ------------------------- | ----------------------------- | -------------------------------- |
| `APP_ENV`                 | development               | staging                       | production                       |
| Nom affiché               | Water Finder (Dev)        | Water Finder (Staging)        | Water Finder                     |
| Identifiant iOS / Android | `com.waterfinder.app.dev` | `com.waterfinder.app.staging` | `com.waterfinder.app`            |
| Schéma d'URL              | `waterfinder-dev`         | `waterfinder-staging`         | `waterfinder`                    |
| Données de démo           | autorisées (opt-in)       | autorisées (opt-in)           | **interdites** (erreur de build) |
| Supabase (phase 2)        | projet dev                | projet staging                | projet prod                      |

Les trois variantes peuvent cohabiter sur un même téléphone. L'identifiant de base
(`APP_BUNDLE_ID`, par défaut `com.waterfinder.app`) **doit être confirmé avant la première
soumission** : il est définitif une fois publié.

## Builds mobiles — EAS

Profils (`apps/mobile/eas.json`) :

| Profil                  | Usage                                    | Distribution            |
| ----------------------- | ---------------------------------------- | ----------------------- |
| `development`           | Development build (expo-dev-client)      | interne                 |
| `development-simulator` | Idem pour le simulateur iOS              | interne                 |
| `staging`               | Recette                                  | interne                 |
| `production`            | Stores (numéro de build auto-incrémenté) | App Store / Google Play |

```bash
cd apps/mobile
```

```bash
eas build --profile staging --platform all
```

Soumission (préparée, **non exécutée**) :

```bash
eas submit --profile production --platform android
```

Le profil `submit.production` envoie Android sur la piste **interne** en brouillon : aucune
publication publique automatique.

### Prérequis non encore disponibles

- [ ] Compte Expo / organisation, `eas init` (renseigne `EAS_PROJECT_ID`)
- [ ] Compte Apple Developer (99 $/an), identifiants App Store Connect
- [ ] Compte Google Play Console (25 $ une fois), compte de service pour `eas submit`
- [ ] Confirmation de l'identifiant d'application et du nom commercial
- [ ] Politique de confidentialité publiée (URL exigée par les stores)

## Fiches des stores (préparation)

- **Confidentialité** : localisation utilisée au premier plan uniquement, non collectée côté
  serveur ; à partir de la phase 6, identifiant publicitaire et données AdMob à déclarer
  (App Privacy d'Apple, section Sécurité des données de Google Play).
- **Permissions Android** vérifiées après génération du projet natif (build de production) :
  `INTERNET`, `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `VIBRATE`. Localisation en
  arrière-plan, stockage partagé, enregistrement audio et superposition explicitement retirés.
- **iOS** : seule `NSLocationWhenInUseUsageDescription` (FR/EN), aucun mode d'arrière-plan,
  `ITSAppUsesNonExemptEncryption = false`.
- Catégorie suggérée : Voyages / Navigation. Âge : tout public (à revoir avec la publicité).

## Intégration continue — GitHub Actions

`.github/workflows/ci.yml` (à chaque push et pull request) :

1. `npm ci`
2. Formatage (Prettier), typage (routes typées incluses), lint, tests
3. Base de données : PostgreSQL 17 (même version que Supabase) + PostGIS + pgTAP, migrations et tests SQL, puis chargement
   ETL réel en base (tests d'intégration des importeurs)
4. Export des bundles web, Android et iOS (vérifie que Metro et Hermes compilent l'application)
   et build de l'administration Next.js

`.github/workflows/etl.yml` : imports hebdomadaires (lundi 03:17 UTC) ou manuels ; ignoré tant
que le secret `SUPABASE_DB_URL` n'est pas défini.

Les builds EAS et soumissions ne sont **pas** déclenchés automatiquement.

## Backend (phase 2)

Projets Supabase distincts par environnement ; migrations versionnées dans `supabase/migrations`
appliquées par la CLI Supabase (`npx supabase link` puis `npx supabase db push`, **après
accord**). Réglages d'authentification à reporter dans le projet en ligne : confirmation
d'e-mail, mot de passe ≥ 8, URL de redirection (`supabase/config.toml`), SMTP personnalisé.
Aucune application n'utilise la clé `service_role` ; les imports utilisent une chaîne de
connexion PostgreSQL (`SUPABASE_DB_URL`) stockée dans les secrets GitHub.

## Administration (phase 7)

Application Next.js (`apps/admin`) prévue sur **Vercel** — **non déployée**. Configuration :
projet Vercel avec « Root Directory » = `apps/admin` (`vercel.json` fourni), variables
`NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` uniquement. L'accès est contrôlé
par le rôle en base (modérateur / administrateur) ; recommandé en plus : protection par mot de
passe ou SSO Vercel sur les déploiements.

## Publicité (phase 6)

1. Créer l'application dans AdMob (iOS et Android) et les blocs : bannière adaptative, native
   (interstitiel facultatif, désactivé dans le code).
2. Renseigner `ADMOB_ANDROID_APP_ID`, `ADMOB_IOS_APP_ID` et `EXPO_PUBLIC_ADMOB_*` dans les
   variables EAS du profil production.
3. Configurer le message RGPD (UMP) dans AdMob → Confidentialité et messages, et le message
   d'explication ATT pour iOS.
4. Publier un fichier `app-ads.txt` sur le site du développeur.
5. Déclarer la collecte publicitaire dans App Privacy (Apple) et Sécurité des données (Google).

## Secrets

| Secret                                         | Où le stocker          |
| ---------------------------------------------- | ---------------------- |
| `SUPABASE_DB_URL` (imports ETL)                | GitHub Actions secrets |
| Identifiants Apple / Google pour la soumission | EAS (credentials)      |
| `EXPO_TOKEN` (CI EAS, si utilisé)              | GitHub Actions secrets |

Jamais dans le dépôt, jamais dans une variable `EXPO_PUBLIC_*`.
