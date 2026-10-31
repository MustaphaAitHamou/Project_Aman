# Tester Water Finder en local (avant toute préproduction)

Ce guide permet de faire tourner **toute la chaîne sur votre ordinateur** — base de données,
imports de vraies données publiques, application et administration — sans rien publier ni
déployer. Rien ici ne touche Vercel, les stores ou un projet Supabase en ligne.

Durée : environ 30 minutes la première fois.

## 0. Prérequis

| Outil          | Pourquoi                                                     | Installation                                                 |
| -------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| Node.js 22     | Monorepo                                                     | <https://nodejs.org> (version indiquée dans `.nvmrc`)        |
| Docker Desktop | Supabase local (base, authentification, stockage, e-mails)   | <https://www.docker.com/products/docker-desktop/>            |
| Supabase CLI   | Démarrer Supabase local                                      | aucune installation : `npx supabase` (téléchargé à la volée) |
| Accès internet | Fond de carte, géocodage, imports OpenStreetMap/data.gouv.fr | —                                                            |

```bash
git clone https://github.com/MustaphaAitHamou/Project_Aman.git
```

```bash
cd Project_Aman
```

```bash
npm install
```

```bash
npm run check
```

`npm run check` doit se terminer sans erreur (formatage, types, lint, tests).

## 1. Démarrer Supabase local

Docker Desktop doit être lancé.

```bash
npx supabase start
```

La première fois, les images Docker sont téléchargées (plusieurs minutes). Les migrations de
`supabase/migrations/` sont appliquées automatiquement. La commande affiche à la fin :

- `API URL` : `http://127.0.0.1:44321`
- `DB URL` : `postgresql://postgres:postgres@127.0.0.1:44322/postgres`
- `Studio URL` : `http://127.0.0.1:44323` (interface d'administration de la base)
- `Mailpit URL` (ou Inbucket) : `http://127.0.0.1:44324` (boîte mail locale : les e-mails de
  confirmation y arrivent)
- `anon key` (ou `Publishable key`) : la clé **publique** à copier ci-dessous

Pour retrouver ces valeurs plus tard :

```bash
npx supabase status
```

> N'utilisez jamais la `service_role key` dans l'application ou l'administration : elles n'en ont
> pas besoin.

### En cas de « port is already allocated »

Les ports du projet sont en 443xx (API 44321, base 44322, Studio 44323, e-mails 44324) pour
éviter les plages que Windows réserve. Si l'un d'eux est quand même pris :

```bash
npx supabase stop
```

Pour voir les plages réservées par Windows (PowerShell) :

```bash
netsh interface ipv4 show excludedportrange protocol=tcp
```

Pour voir les conteneurs Docker et leurs ports :

```bash
docker ps --format "table {{.Names}}\t{{.Ports}}"
```

## 2. Importer de vraies données publiques

Les imports écrivent directement en base (connexion serveur). Commencez par une zone limitée,
par exemple Paris, pour un import rapide.

Voir les sources et leur état de vérification :

```bash
npm run etl -- list
```

Essai sans écriture (télécharge et transforme, affiche le bilan) :

```bash
SUPABASE_DB_URL=postgresql://postgres:postgres@127.0.0.1:44322/postgres npm run etl -- import osm-fr --bbox=2.22,48.81,2.47,48.91 --dry-run
```

Import réel d'OpenStreetMap sur Paris :

```bash
SUPABASE_DB_URL=postgresql://postgres:postgres@127.0.0.1:44322/postgres npm run etl -- import osm-fr --bbox=2.22,48.81,2.47,48.91
```

Jeu officiel de la Ville de Paris (source pas encore vérifiée : l'option `--allow-unverified` est
volontairement exigée ; vérifiez d'abord la licence et les champs sur la fiche du jeu) :

```bash
SUPABASE_DB_URL=postgresql://postgres:postgres@127.0.0.1:44322/postgres npm run etl -- import paris-fontaines-a-boire --allow-unverified
```

Découvrir d'autres jeux de fontaines sur data.gouv.fr (lecture seule) :

```bash
npm run etl -- discover fontaines
```

Relancer un import ne crée pas de doublon (import idempotent) ; un point déjà connu à moins de
10 m est rattaché au lieu d'être dupliqué. Aucun import ne supprime de point.

Sous Windows (PowerShell), définissez la variable avant la commande :
`$env:SUPABASE_DB_URL="postgresql://postgres:postgres@127.0.0.1:44322/postgres"`.

⚠️ À vérifier pendant ce test : ces connecteurs n'ont jamais pu être exécutés contre les vrais
services dans l'environnement de développement (accès réseau bloqué). Si un service a changé de
format, l'import échoue proprement avec un message : notez-le, il faudra ajuster le connecteur.

## 3. Lancer l'application (aperçu web)

Créez `apps/mobile/.env` :

```bash
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:44321
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key affichée par supabase start>
EXPO_PUBLIC_DEMO_DATA=false
```

Puis :

```bash
npm run mobile:web
```

Ouvrez <http://localhost:8081>. Les publicités ne s'affichent pas sur le web (normal).

## 4. Lancer l'administration

Créez `apps/admin/.env.local` :

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:44321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

```bash
npm run admin
```

Ouvrez <http://localhost:3001>. Pour vous connecter, il faut un compte **modérateur** :

1. créez un compte dans l'application (Profil → Créer un compte) ;
2. confirmez l'adresse via la boîte mail locale (Mailpit, port 44324) ;
3. donnez-vous le rôle administrateur dans Studio (<http://127.0.0.1:44323> → SQL Editor) :

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'votre@adresse.fr');
```

(Le changement de rôle n'est possible qu'avec un accès direct à la base ou par un autre
administrateur : un utilisateur ne peut pas modifier son propre rôle.)

## 5. Recette manuelle — à cocher

### Carte et données

- [ ] Onboarding puis autorisation de localisation (« Pas maintenant » fonctionne aussi)
- [ ] La carte affiche les points importés autour de Paris (Recherche → Paris)
- [ ] Couleurs : potabilité ; cercle évidé : hors service ; groupes avec compteur
- [ ] Un point OSM `amenity=drinking_water` est « Indiquée potable, non certifiée », **jamais**
      « certifiée »
- [ ] Filtres (certifiée, en service, gazeuse, gratuit, PMR, décoratives) et puces retirables
- [ ] Recherche d'adresse : « 10 rue de Rivoli » → la carte se centre (Géoplateforme IGN)

### Fiche d'un point

- [ ] Statuts séparés : potabilité, fonctionnement, accès
- [ ] Bloc « Preuve de potabilité » : type de source, nom, date (ou « non datée »)
- [ ] Provenance : source, licence, date ; coordonnées ; itinéraire ; partage
- [ ] Cœur (favori) : demande la connexion si vous n'êtes pas connecté

### Compte et contributions

- [ ] Inscription → e-mail de confirmation dans Mailpit → connexion
- [ ] Mot de passe oublié → e-mail reçu dans Mailpit
- [ ] Favori ajouté/retiré, visible dans Profil → Favoris
- [ ] Ajouter un point (centre de la carte zoomée au niveau de la rue) → « en attente »
- [ ] Ajouter un point à moins de 15 m d'un point existant → message « doublon » + lien
- [ ] Signaler une panne, proposer une modification, ajouter une photo (sur le web : choix d'un
      fichier)
- [ ] Profil → Mes contributions : statuts « En attente »
- [ ] Après modération (étape suivante) : notification dans l'onglet Activité
- [ ] Suppression du compte (Profil → Supprimer mon compte) : déconnexion, compte effacé

### Administration

- [ ] Tableau de bord : compteurs et derniers imports
- [ ] Modération : valider le point proposé → il apparaît sur la carte de l'application
- [ ] Valider le signalement de panne → le point passe « hors service »
- [ ] Modification : tableau avant/après, validation appliquée
- [ ] Photo : aperçu, validation → visible sur la fiche
- [ ] Doublons : liste des paires proches, fusion
- [ ] Imports : historique et erreurs détaillées
- [ ] Utilisateurs (administrateur) : changement de rôle

### Confidentialité

- [ ] Paramètres → aucune position n'est enregistrée (rien dans le stockage local du navigateur
      à part les préférences)
- [ ] Confidentialité : textes publicité / compte / localisation

## 6. Sur téléphone (development build, facultatif à ce stade)

La carte native, le GPS réel, la caméra et les publicités (blocs de **test** Google) ne se
testent que dans un development build. Cela nécessite un compte Expo (gratuit), et pour iOS
un compte Apple Developer :

```bash
cd apps/mobile
```

```bash
npx eas-cli init
```

```bash
npx eas-cli build --profile development --platform android
```

Sur téléphone, `127.0.0.1` désigne le téléphone : dans `apps/mobile/.env`, remplacez-le par
l'adresse IP locale de votre ordinateur (ex. `http://192.168.1.20:44321`).

À vérifier sur appareil : formulaire de consentement publicitaire (UMP) après la présentation,
demande ATT sur iOS, bannière « Publicité » en bas des fiches et de la recherche, aucune
publicité à l'ouverture ni sur la carte, application utilisable après refus.

## 7. Arrêter

```bash
npx supabase stop
```

Les données locales sont conservées pour la prochaine fois. Pour repartir de zéro (efface
tout, réapplique les migrations) :

```bash
npx supabase db reset
```
