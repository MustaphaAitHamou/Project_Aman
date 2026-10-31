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

## Mesures en place

| Domaine         | Mesures                                                                                                                                                                                   |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Base de données | RLS sur toutes les tables ; écritures uniquement par fonctions SQL `security definer` à `search_path` fixé ; fonctions internes révoquées (testé avec les privilèges par défaut Supabase) |
| Intégrité       | Contrainte « certifiée ⇒ preuve officielle datée » en base et dans l'application ; une contribution ne certifie jamais ; rôle non modifiable par l'utilisateur (déclencheur)              |
| Contributions   | Compte obligatoire ; quotas (10 points, 20 signalements / 24 h) ; doublons à 15 m refusés ; modération avant publication ; journal des décisions                                          |
| Photos          | Compartiment privé, dossier par utilisateur, JPEG/WebP ≤ 6 Mio, chemin validé en SQL, réencodage côté application (EXIF et position supprimés), URL signées temporaires                   |
| Comptes         | Confirmation d'e-mail, mot de passe ≥ 8, session dans le trousseau / Keystore (`expo-secure-store`), suppression de compte (contributions publiées anonymisées)                           |
| Publicité       | UMP (TCF) avant toute publicité personnalisée, ATT après consentement, non personnalisé en cas de refus, mesure AdMob différée jusqu'au consentement, aucune publicité forcée             |
| Administration  | Pas de clé `service_role` ; rôle vérifié en base à chaque page et action ; en-têtes anti-iframe, `noindex`                                                                                |
| Imports         | Connexion serveur via secret CI ; validation stricte des données entrantes ; aucune suppression ; journal d'erreurs                                                                       |

## Revue du 31/10/2026

- **Corrigé** : `authenticated` pouvait exécuter `notify_user` et `log_moderation` sur un vrai
  projet Supabase (privilèges par défaut) ; révocation et tests ajoutés.
- Recherche de secrets dans les fichiers versionnés : aucun.
- `npm audit` : alertes limitées à l'outillage de build et de test (Expo CLI, Jest) ; correctif
  automatique refusé car il rétrograderait le SDK Expo.

## Dépendances

- Versions alignées sur le SDK Expo (contrôle `expo-doctor`) ; fichier de verrouillage versionné.
- `npm audit --omit=dev` à relancer à chaque mise à jour du SDK Expo.

## Accessibilité (sécurité d'usage)

Contrastes WCAG AA vérifiés automatiquement, la couleur n'est jamais le seul porteur
d'information (icône + texte), cibles tactiles ≥ 48 px.
