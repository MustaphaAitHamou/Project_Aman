# Sécurité et confidentialité

## Signaler une vulnérabilité

Ne pas ouvrir d'issue publique. Contacter le porteur du projet en privé (adresse de contact
sécurité à définir avant la publication).

## Principes

1. **Aucun secret dans le dépôt ni dans l'application.** Les variables `EXPO_PUBLIC_*` sont
   publiques par construction. La clé Supabase `service_role` est réservée au serveur.
2. **Minimisation des données.**
   - Localisation : premier plan uniquement, dernière position en mémoire, jamais persistée ni
     envoyée au serveur, aucun historique (vérifié par des tests : la persistance ne contient
     aucune coordonnée ; le suivi s'arrête en arrière-plan).
   - Consultation de la carte sans compte.
   - Comptes (phase 5) : pseudonyme et e-mail uniquement ; suppression de compte disponible.
3. **Permissions au strict nécessaire**, bloquées explicitement dans `app.config.ts` et vérifiées
   sur le projet natif généré (voir [DEPLOYMENT.md](DEPLOYMENT.md)).
4. **Intégrité de l'information sanitaire** : la potabilité n'est certifiée que par une source
   officielle datée (règle dans `packages/core`, testée ; contrainte en base prévue en phase 2).
   Un avis d'utilisateur ne la certifie jamais.
5. **Données fictives** : mode démonstration activable uniquement en développement, refusé à la
   compilation en production, signalé par un bandeau permanent, et exclu des bundles lorsqu'il
   n'est pas activé (vérifié sur les bundles exportés).

## Mesures prévues par phase

| Phase | Mesures                                                                                                                                                                                                                                                                                                        |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2     | RLS sur toutes les tables, fonctions RPC `security invoker`, contraintes métier en base, sessions Supabase stockées via `expo-secure-store`                                                                                                                                                                    |
| 3     | Imports via secrets CI, validation stricte des données entrantes, journalisation des erreurs                                                                                                                                                                                                                   |
| 5     | Authentification obligatoire pour contribuer, limitation de fréquence (base + Edge Functions), modération, détection de doublons, vérification des fichiers (type MIME réel, taille, suppression des métadonnées EXIF de localisation), rôles utilisateur / modérateur / administrateur, suppression de compte |
| 6     | Consentement UMP (RGPD/ePrivacy) avant toute publicité personnalisée, ATT sur iOS si nécessaire, application utilisable en cas de refus                                                                                                                                                                        |
| 7     | Administration : opérations sensibles côté serveur, contrôle des rôles, journal des actions de modération                                                                                                                                                                                                      |
| 8     | Audit des dépendances, revue de sécurité, tests d'autorisations (RLS)                                                                                                                                                                                                                                          |

## Dépendances

- Versions alignées sur le SDK Expo (contrôle `expo-doctor`) ; fichier de verrouillage versionné.
- `npm audit` à intégrer à la CI en phase 8 (les avertissements actuels proviennent de
  dépendances transitives de l'outillage de test et de build).

## Accessibilité (sécurité d'usage)

Contrastes WCAG AA vérifiés automatiquement, la couleur n'est jamais le seul porteur
d'information (icône + texte), cibles tactiles ≥ 48 px.
