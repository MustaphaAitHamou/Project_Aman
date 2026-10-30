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
3. Export des bundles web, Android et iOS (vérifie que Metro et Hermes compilent l'application)

Les builds EAS et soumissions ne sont **pas** déclenchés automatiquement.

## Backend (phase 2)

Projets Supabase distincts par environnement ; migrations versionnées dans `supabase/migrations`
appliquées par la CLI Supabase. La clé `service_role` vit uniquement dans les secrets GitHub
Actions (ETL) et Vercel (administration).

## Administration (phase 7)

Application Next.js déployée sur **Vercel** (projets preview/staging/production). Opérations
sensibles exécutées côté serveur uniquement.

## Secrets

| Secret                                         | Où le stocker                            |
| ---------------------------------------------- | ---------------------------------------- |
| `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL` | GitHub Actions secrets, Vercel (serveur) |
| Identifiants Apple / Google pour la soumission | EAS (credentials)                        |
| `EXPO_TOKEN` (CI EAS, si utilisé)              | GitHub Actions secrets                   |

Jamais dans le dépôt, jamais dans une variable `EXPO_PUBLIC_*`.
