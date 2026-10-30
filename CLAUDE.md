# Water Finder — consignes pour les sessions Claude Code

Lire d'abord **PROGRESS.md** (état exact, tests exécutés, blocages, prochaine étape), puis
ARCHITECTURE.md. Le projet avance par phases (ROADMAP.md) : ne pas commencer une phase avant que
la précédente soit stable.

## Commandes

- `npm run check` (racine) : formatage, types (routes typées incluses), lint, tests — doit passer.
- `npm run mobile:web` : aperçu web ; `npm run mobile` : serveur pour development build.
- Tests : Jest dans `apps/mobile` (`npx jest`), Vitest dans `packages/core` (`npx vitest run`).

## Règles du projet

- Langue : code et identifiants en anglais, commentaires, documentation et textes d'interface en
  français (anglais dans `src/i18n/locales/en.ts`, mêmes clés que `fr.ts`).
- Ne jamais confondre potabilité, fonctionnement et disponibilité. La potabilité certifiée exige
  une preuve officielle datée (`normalizePotability` dans `packages/core`).
- Aucune donnée fictive présentée comme réelle ; le mode démo reste confiné au développement.
- Aucun secret dans le dépôt ni dans une variable `EXPO_PUBLIC_*`.
- Ne pas déclarer une fonctionnalité opérationnelle sans l'avoir testée ; mettre à jour
  PROGRESS.md à chaque fin de phase.
- Versions natives : uniquement celles du SDK Expo (`npx expo install`), vérifier avec
  `npx expo-doctor`.
- Ne rien publier sur les stores ni en production sans accord explicite.
