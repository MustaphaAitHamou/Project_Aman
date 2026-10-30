# Base de données (Supabase · PostgreSQL · PostGIS)

> **Statut : conception — rien n'est encore implémenté.** Ce document est la proposition de
> schéma pour la **phase 2**. Il sera ajusté, migré (`supabase/migrations/`) et testé à ce moment-là.
> Le modèle de domaine correspondant existe déjà et est testé dans `packages/core/src/domain/`.

## Principes

- Identifiants **UUID** (`gen_random_uuid()`), horodatages `created_at` / `updated_at` (trigger).
- Géométries en `geography(Point, 4326)` (distances en mètres) avec **index GiST**.
- **Row Level Security activée sur toutes les tables** ; aucune table exposée sans politique.
- La clé `service_role` n'est utilisée que côté serveur (ETL, administration), jamais dans
  l'application mobile.
- Les règles métier critiques sont **aussi** imposées en base (contraintes, triggers), en miroir
  de `packages/core`.
- Les imports ne suppriment jamais une contribution communautaire ; les points ne sont jamais
  supprimés physiquement (statut `removed` / fusion) pour garder l'historique.

## Énumérations (alignées sur `packages/core`)

| Type                  | Valeurs                                                                                            |
| --------------------- | -------------------------------------------------------------------------------------------------- |
| `water_point_kind`    | drinking_fountain, water_tap, bottle_refill_station, spring, well_pump, decorative_fountain, other |
| `potability_status`   | certified_potable, declared_potable, not_potable, unknown                                          |
| `operational_status`  | working, out_of_order, unknown                                                                     |
| `availability_status` | available, seasonal_closure, restricted_access, removed, unknown                                   |
| `water_type`          | still, sparkling, still_and_sparkling, unknown                                                     |
| `source_category`     | official, openstreetmap, community                                                                 |
| `evidence_kind`       | official_dataset, sanitary_control, osm_tag, community_report                                      |
| `user_role`           | user, moderator, admin                                                                             |
| `review_status`       | pending, approved, rejected                                                                        |

## Tables

### `profiles`

`id` (= `auth.users.id`), `display_name`, `role user_role default 'user'`, `created_at`,
`updated_at`, `deleted_at`. Données personnelles minimales : pas de nom réel, pas de téléphone.

### `water_points`

| Colonne                            | Type                                    | Notes                                |
| ---------------------------------- | --------------------------------------- | ------------------------------------ |
| `id`                               | uuid PK                                 |                                      |
| `kind`                             | water_point_kind                        |                                      |
| `name`                             | text null                               |                                      |
| `location`                         | geography(Point, 4326)                  | index GiST                           |
| `address`, `city`                  | text null                               |                                      |
| `country_code`                     | char(2)                                 | ISO 3166-1, index                    |
| `potability`                       | potability_status                       |                                      |
| `potability_evidence_kind`         | evidence_kind null                      |                                      |
| `potability_evidence_source`       | text null                               |                                      |
| `potability_evidence_url`          | text null                               |                                      |
| `potability_evidence_at`           | date null                               | date du contrôle / de la publication |
| `operational_status`               | operational_status                      |                                      |
| `operational_status_at`            | timestamptz null                        | dernier signalement                  |
| `availability`                     | availability_status                     |                                      |
| `water_type`                       | water_type                              |                                      |
| `is_free`, `wheelchair_accessible` | boolean null                            | `null` = inconnu                     |
| `opening_hours`                    | text null                               | format OSM `opening_hours`           |
| `last_verified_at`                 | timestamptz null                        |                                      |
| `primary_source_category`          | source_category                         |                                      |
| `publication_status`               | published / pending / rejected / merged |                                      |
| `merged_into_id`                   | uuid null FK                            | doublons fusionnés                   |
| `created_by`                       | uuid null FK profiles                   | contributions                        |

**Contrainte de certification** (miroir de `normalizePotability`) :

```sql
check (
  potability <> 'certified_potable'
  or (potability_evidence_kind in ('official_dataset', 'sanitary_control')
      and potability_evidence_at is not null
      and potability_evidence_source is not null)
)
```

### `water_point_sources`

Provenances multiples d'un même point : `water_point_id`, `import_source_id`, `external_id`,
`url`, `license`, `raw jsonb` (enregistrement d'origine), `content_hash` (détection des
changements), `fetched_at`. Unicité `(import_source_id, external_id)`.

### `water_point_photos`

`water_point_id`, `user_id`, `storage_path` (Supabase Storage), `width`, `height`,
`review_status`, `created_at`. Seules les photos approuvées sont lisibles publiquement.

### `water_point_reports`

Signalements : `type` (broken, fixed, not_existing, potability_claim, other), `comment`,
`user_id`, `review_status`, `created_at`, `resolved_by`, `resolved_at`.
Un signalement `potability_claim` ne peut produire que `declared_potable` ou `not_potable`.

### `water_point_revisions`

Modifications proposées : `changes jsonb` (diff champ par champ), `user_id`, `review_status`,
`reviewed_by`, `reviewed_at`. Historique complet et réversible.

### `favorites`

`(user_id, water_point_id)` clé primaire, `created_at`.

### `import_sources`

`key` unique (ex. `osm-fr`, `paris-fontaines`), `name`, `country_code`, `url`, `license`,
`attribution`, `format`, `enabled`, `schedule`, `last_success_at`.

### `import_runs`

`import_source_id`, `started_at`, `finished_at`, `status`, compteurs (`inserted`, `updated`,
`unchanged`, `flagged_duplicates`, `failed`), `error_log jsonb`.

### `moderation_actions`

Journal des décisions : `moderator_id`, `target_type`, `target_id`, `action`, `reason`,
`created_at`.

### `notifications`

`user_id`, `type`, `payload jsonb`, `read_at`, `created_at`.

### `user_preferences`

`user_id` PK, `language`, `distance_unit`, préférences de notifications.

## Requêtes spatiales (fonctions RPC)

| Fonction                                                               | Principe                                                                                                                                 |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `water_points_in_bbox(west, south, east, north, filtres…, max_points)` | `location && ST_MakeEnvelope(...)::geography`, filtres identiques à `matchesFilters`, `limit max_points + 1` pour détecter la troncature |
| `water_points_nearby(lat, lng, radius_m, filtres…, max_points)`        | `ST_DWithin(location, point, radius_m)` + tri `location <-> point` (KNN sur l'index GiST)                                                |
| `nearest_water_points(lat, lng, max_points)`                           | KNN pur, distance renvoyée en mètres                                                                                                     |

Les fonctions sont `stable`, `security invoker`, et ne renvoient que des points publiés et non
`removed`.

## Row Level Security (principes)

| Table                                                 | Lecture                                         | Écriture                                                             |
| ----------------------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------- |
| `water_points`                                        | tous (publiés uniquement)                       | via RPC de contribution (création en `pending`) ; modérateurs/admins |
| `water_point_reports`, `revisions`, `photos`          | auteur + modérateurs (photos approuvées : tous) | utilisateur connecté, avec limitation de fréquence                   |
| `favorites`, `notifications`, `user_preferences`      | propriétaire uniquement                         | propriétaire uniquement                                              |
| `import_sources`, `import_runs`, `moderation_actions` | modérateurs/admins                              | serveur (service_role) / modérateurs                                 |
| `profiles`                                            | nom d'affichage public, reste privé             | propriétaire (sauf `role` : admins)                                  |

Le rôle est lu depuis `profiles.role` via une fonction `security definer` (`auth_role()`), ou
injecté dans le JWT par un _custom access token hook_.
