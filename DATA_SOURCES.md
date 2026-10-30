# Sources de données

> **Règle absolue : aucune donnée officielle n'est inventée.** Une source n'est intégrée qu'après
> vérification de son existence, de sa licence, de son format, de sa date, de ses champs et de ses
> conditions d'utilisation. Une source en échec est journalisée sans bloquer les autres.

## État des vérifications

L'environnement de développement de la phase 1 **n'avait pas accès** aux sites concernés
(data.gouv.fr, portails des collectivités, OpenStreetMap/Overpass, openfreemap.org : connexions
refusées par la politique réseau). **Aucune source de point d'eau n'a donc encore été vérifiée ni
intégrée.** Tout ce qui suit sur les jeux de données est une liste de **candidats à vérifier en
phase 3**, pas une description validée.

| Source                                                   | Usage                  | Statut                                          |
| -------------------------------------------------------- | ---------------------- | ----------------------------------------------- |
| OpenFreeMap (tuiles vectorielles OSM)                    | Fond de carte          | **Utilisée par défaut, conditions à confirmer** |
| OpenStreetMap                                            | Points d'eau           | À intégrer (phase 3)                            |
| Schéma national « fontaine à eau » (schema.data.gouv.fr) | Format de référence    | À étudier (phase 3)                             |
| Jeux de données des collectivités                        | Points d'eau officiels | À rechercher et vérifier (phase 3)              |
| Contributions des utilisateurs                           | Ajouts, signalements   | Phase 5                                         |

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

⚠️ **Point juridique à valider avant la phase 3** : l'ODbL impose le partage à l'identique d'une
_base de données dérivée_ utilisée publiquement. Si des données OSM sont fusionnées avec des données
officielles ou communautaires dans une même table, cette base pourrait devoir être publiée sous
ODbL. Option envisagée : garder les données OSM séparables (« base de données collective ») et
tracer la provenance champ par champ (`water_point_sources`). Avis juridique recommandé.

**Accès aux données** : extraits Geofabrik (fichier France mis à jour quotidiennement) filtrés avec
`osmium tags-filter`, plutôt que les instances publiques d'Overpass (limites d'usage). À confirmer.

**Tags candidats (sémantique à confirmer sur le wiki OSM en phase 3)** :

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

Recherche d'adresses françaises : API de la Base Adresse Nationale / Géoplateforme
(URL et conditions à vérifier). En phase 1, la recherche se limite à une liste de grandes villes
embarquée (coordonnées de centre-ville servant uniquement à cadrer la carte).

## Contributions (phase 5)

Ajouts, signalements de panne / remise en service, photos, corrections : modérés, historisés,
avec limitation de fréquence. **Une contribution ne certifie jamais la potabilité.**
