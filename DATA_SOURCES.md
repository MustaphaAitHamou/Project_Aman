# Sources de données

> **Règle absolue : aucune donnée officielle n'est inventée.** Une source n'est intégrée qu'après
> vérification de son existence, de sa licence, de son format, de sa date, de ses champs et de ses
> conditions d'utilisation. Une source en échec est journalisée sans bloquer les autres.

## État des vérifications (31/10/2026)

Les connecteurs sont **écrits et testés avec des réponses simulées**, mais l'environnement de
développement n'a **jamais pu joindre** les services publics (politique réseau). Aucune donnée
réelle n'a encore été importée. Le premier import réel se fait pendant votre recette locale
([LOCAL_TESTING.md](LOCAL_TESTING.md), étape 2).

| Clé du connecteur         | Source                                      | Statut dans le code                      | À faire                                                      |
| ------------------------- | ------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------ |
| `osm-fr`                  | OpenStreetMap via Overpass                  | `verified: true` (tags du wiki OSM)      | Premier import réel ; avis ODbL ; limites d'usage d'Overpass |
| `datagouv-fontaines`      | Jeux « fontaines » trouvés sur data.gouv.fr | `verified: false` → `--allow-unverified` | Vérifier chaque jeu (fiche ci-dessous) avant import          |
| `paris-fontaines-a-boire` | Ville de Paris (Opendatasoft)               | `verified: false` → `--allow-unverified` | Confirmer identifiant du jeu, licence et champs              |
| —                         | Géoplateforme IGN (géocodage)               | Utilisé par l'application                | Confirmer format de réponse et conditions d'usage            |
| —                         | OpenFreeMap (fond de carte)                 | Utilisé par défaut                       | Confirmer conditions d'usage commercial                      |

### Commandes

```bash
npm run etl -- list
```

```bash
npm run etl -- discover fontaines
```

```bash
SUPABASE_DB_URL=postgresql://postgres:postgres@127.0.0.1:44322/postgres npm run etl -- import osm-fr --bbox=2.22,48.81,2.47,48.91 --dry-run
```

Règles appliquées par tous les connecteurs :

- coordonnées absentes, nulles ou non WGS84 (ex. Lambert 93) → enregistrement rejeté et journalisé ;
- seuls les champs présents sont repris (rien n'est déduit ni inventé) ;
- un jeu officiel de fontaines à boire donne « indiquée potable » avec une preuve
  `official_dataset` datée de la mise à jour du jeu — **jamais « certifiée » automatiquement** ;
- OpenStreetMap ne remplace jamais une potabilité officielle ou communautaire ;
- un point déjà connu à moins de 10 m (autre source) est rattaché, pas dupliqué ;
- import idempotent (empreinte du contenu), aucun point supprimé ;
- une source en échec est journalisée (`import_runs.error_log`) sans bloquer les autres ;
- structure d'un jeu modifiée (champ requis absent) → import annulé explicitement.

## Fond de carte

**Par défaut : OpenFreeMap**, style `https://tiles.openfreemap.org/styles/liberty` (MapLibre),
sans clé d'API. D'après mes connaissances (non revérifiées ici, site inaccessible), le service se
présente comme gratuit, sans limite de requêtes et utilisable commercialement, avec une attribution
obligatoire du type « OpenFreeMap © OpenMapTiles Data from OpenStreetMap ».

**Avant la production, à faire :**

1. Lire les conditions d'utilisation sur openfreemap.org et confirmer l'usage commercial dans une
   application publicitaire.
2. Évaluer le risque de disponibilité (service sans SLA) et prévoir un repli :
   - **Protomaps** auto-hébergé (fichier PMTiles sur notre stockage/CDN) : maîtrise totale ;
   - MapTiler ou Stadia Maps : offres commerciales payantes avec SLA.
3. Vérifier la liste exacte des polices du serveur de glyphes (`EXPO_PUBLIC_MAP_FONT`).

Le style est configurable sans modification de code (`EXPO_PUBLIC_MAP_STYLE_URL`).
L'attribution OpenStreetMap est affichée par la carte (bouton d'attribution) et dans l'écran
« Sources des données ».

## OpenStreetMap (phase 3)

**Licence : ODbL 1.0.** Attribution « © les contributeurs d'OpenStreetMap ».

⚠️ **Point juridique à valider avant la production** : l'ODbL impose le partage à l'identique d'une
_base de données dérivée_ utilisée publiquement. Si des données OSM sont fusionnées avec des données
officielles ou communautaires dans une même table, cette base pourrait devoir être publiée sous
ODbL. Option envisagée : garder les données OSM séparables (« base de données collective ») et
tracer la provenance champ par champ (`water_point_sources`). Avis juridique recommandé.

**Accès aux données** : API Overpass (`OVERPASS_URL`, par défaut `overpass-api.de`). Chaque pays
est découpé en tuiles (2° à 5° selon la densité) interrogées l'une après l'autre avec une pause
d'une seconde, filtrées par la frontière du pays (code ISO) ; un objet à cheval sur deux tuiles
n'est importé qu'une fois ; une tuile en échec rend l'import « partiel » sans bloquer les autres.
`--bbox` limite l'import à une zone. Pour un import national régulier, l'instance publique
impose des limites : prévoir une instance dédiée ou des extraits Geofabrik filtrés.

**Tags utilisés** (implémentés dans `packages/importers/src/connectors/osm.ts`, testés) :

| Tag                                                      | Interprétation prévue                           | Potabilité déduite                                        |
| -------------------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------- |
| `amenity=drinking_water`                                 | Point d'eau potable (fontaine, robinet)         | `declared_potable` (jamais certifiée)                     |
| `man_made=water_tap`                                     | Robinet                                         | selon `drinking_water=*`, sinon `unknown`                 |
| `amenity=water_point`                                    | Point d'eau (grandes quantités)                 | selon `drinking_water=*`, sinon `unknown`                 |
| `amenity=fountain`                                       | Fontaine, **souvent décorative**                | `decorative_fountain` sauf `drinking_water=yes`           |
| `natural=spring`                                         | Source naturelle                                | **jamais potable par défaut** : `unknown` sauf indication |
| `drinking_water=yes` / `no`                              | Indication de potabilité                        | `declared_potable` / `not_potable`                        |
| `drinking_water:legal=*`                                 | Statut légal de potabilité                      | à étudier (ne certifie pas sans source officielle datée)  |
| `bottle=yes`                                             | Remplissage de bouteille possible               | type `bottle_refill_station` à étudier                    |
| `fee=*`, `wheelchair=*`, `opening_hours=*`, `seasonal=*` | Gratuité, accessibilité, horaires, saisonnalité | —                                                         |

Aucun tag OSM ne produit `certified_potable` : seule une source officielle datée le peut.

### Pays couverts

| Pays (clé)            | Tuiles | Données officielles complémentaires                                 |
| --------------------- | ------ | ------------------------------------------------------------------- |
| Algérie (`osm-dz`)    | 4°     | Aucun jeu ouvert connu de points d'eau : OpenStreetMap + communauté |
| France (`osm-fr`)     | 2°     | data.gouv.fr, Ville de Paris (connecteurs existants)                |
| Belgique (`osm-be`)   | 2°     | À rechercher (portails régionaux, ex. Bruxelles)                    |
| Suisse (`osm-ch`)     | 2°     | À rechercher (villes : Genève, Zurich…)                             |
| Espagne (`osm-es`)    | 2°     | À rechercher (datos.gob.es, Madrid, Barcelone)                      |
| Italie (`osm-it`)     | 2°     | À rechercher (dati.gov.it, « nasoni » de Rome…)                     |
| Canada (`osm-ca`)     | 5°     | À rechercher (Toronto, Montréal, Vancouver publient des fontaines)  |
| États-Unis (`osm-us`) | 3°     | À rechercher (NYC Open Data, San Francisco…)                        |

Les imports des grands pays (Canada, États-Unis) comptent plusieurs centaines de tuiles et
durent longtemps : commencer par une région (`--bbox`).

## Données publiques officielles (phase 3)

Référence à étudier en priorité : le **schéma national des fontaines à eau**
<https://schema.data.gouv.fr/datagouv/schema-fontaine-eau/> (champs, statuts, licence, jeux de
données conformes).

Portails à explorer (existence, licence, format et fraîcheur **à vérifier** pour chacun) :

| Producteur                    | Portail                                        |
| ----------------------------- | ---------------------------------------------- |
| Plateforme nationale          | data.gouv.fr                                   |
| Ville de Paris / Eau de Paris | opendata.paris.fr, publications d'Eau de Paris |
| Toulouse Métropole            | data.toulouse-metropole.fr                     |
| Métropole de Lyon             | data.grandlyon.com                             |
| Aix-Marseille-Provence        | portail open data de la Métropole              |
| Nice Côte d'Azur              | portail open data de la Métropole              |
| Autres collectivités          | recherche sur data.gouv.fr                     |

Ne pas supposer qu'une collectivité dispose d'une API : prévoir REST, JSON, GeoJSON, CSV, etc.

### Fiche de vérification (à remplir pour chaque source avant intégration)

```
Clé du connecteur      :
Producteur             :
URL du jeu / de l'API  :
Licence                :          Attribution exigée :
Format                 :          Fréquence de mise à jour :
Date de dernière MAJ   :          Nombre d'objets :
Champs utiles          :
Potabilité             : officielle ? datée ? propre à chaque point ?
Conditions d'usage     : usage commercial autorisé ?
Vérifié le / par       :
```

## Géocodage (phase 4)

Recherche d'adresses françaises via le service de géocodage de la **Géoplateforme (IGN)**,
successeur de l'API Adresse : `https://data.geopf.fr/geocodage/search?q=…&index=address`
(réponse GeoJSON, sans clé). Configurable par `EXPO_PUBLIC_GEOCODING_URL`. Seul le texte saisi
est envoyé (jamais la position), après 3 caractères et 350 ms d'inactivité. Attribution affichée
sous les résultats. Format et conditions d'usage à confirmer lors de la recette (hôte bloqué ici).
La liste embarquée de grandes villes reste disponible hors ligne.

## Contributions (phase 5)

Ajouts, signalements de panne / remise en service, photos, corrections : modérés, historisés,
avec limitation de fréquence (10 points et 20 signalements par 24 h). **Une contribution ne
certifie jamais la potabilité** : au mieux « indiquée potable », et une potabilité certifiée
n'est jamais rétrogradée par un avis d'utilisateur (seul un signalement « non potable » validé
s'applique, par précaution).
