# Feuille de route — lancement visé : juin 2027

| Phase | Contenu                                                                                                                                              | État                       |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| **1** | Initialisation, architecture, navigation, design system, première carte, services de géolocalisation                                                 | ✅ Terminée (30/10/2026)   |
| **2** | Backend Supabase : schéma PostgreSQL/PostGIS, migrations, RLS, requêtes spatiales ; branchement de la carte                                          | ✅ Développée (31/10/2026) |
| **3** | Imports ETL : données officielles (schéma national, collectivités) et OpenStreetMap ; synchronisation planifiée idempotente, déduplication, journaux | ✅ Développée (31/10/2026) |
| **4** | Recherche d'adresses (géocodage), filtres côté serveur, fiche complète (photos, historique), itinéraires, partage                                    | ✅ Développée (31/10/2026) |
| **5** | Authentification, contributions (ajout, signalements, photos, corrections), modération, favoris, contributions, notifications                        | ✅ Développée (31/10/2026) |
| **6** | AdMob (bannières adaptatives, natives ; interstitiels préparés mais désactivés), consentement UMP, ATT                                               | ✅ Développée (31/10/2026) |
| **7** | Administration Next.js (statistiques, modération, doublons, imports, journaux), automatisations                                                      | ✅ Développée (31/10/2026) |
| **8** | Tests de bout en bout sur appareils, sécurité, performances, accessibilité, préparation des stores                                                   | ⏳ En cours                |

## Jalons proposés

| Date cible    | Jalon                                                                     |
| ------------- | ------------------------------------------------------------------------- |
| Décembre 2026 | Phases 2 et 3 : la carte affiche de vraies données (France)               |
| Février 2027  | Phase 4 : recherche et fiches complètes                                   |
| Mars 2027     | Phase 5 : comptes et contributions                                        |
| Avril 2027    | Phases 6 et 7 : publicité, consentement, administration                   |
| Mai 2027      | Phase 8 : bêta fermée (TestFlight, test interne Google Play), corrections |
| Juin 2027     | Soumission aux stores et lancement (sous réserve de validation)           |

## Après le lancement

- Nouveaux pays (connecteurs par pays, traductions supplémentaires)
- Mode hors ligne (packs de tuiles et points d'une zone)
- Navigation intégrée éventuelle
- Partenariats avec les régies d'eau et collectivités
