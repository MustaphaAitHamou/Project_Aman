-- Tests pgTAP du backend Water Finder.
-- Exécution : `supabase test db` (projet Supabase local) ou `npm run db:test` (PostgreSQL local).
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(70);

-- ── Données de test (fictives, dans une transaction annulée à la fin) ───────
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'alice@test.invalid'),
  ('00000000-0000-0000-0000-00000000000b', 'bob@test.invalid'),
  ('00000000-0000-0000-0000-00000000000c', 'modo@test.invalid');
update profiles set role = 'moderator' where id = '00000000-0000-0000-0000-00000000000c';

select is((select count(*)::int from profiles), 3, 'un profil est créé pour chaque inscription');
select is((select count(*)::int from user_preferences), 3, 'des préférences sont créées pour chaque inscription');

insert into import_sources (id, key, name, category, enabled) values
  ('10000000-0000-0000-0000-000000000001', 'test-officiel', 'Source officielle de test', 'official', true),
  ('10000000-0000-0000-0000-000000000002', 'test-osm', 'OSM de test', 'openstreetmap', true);

insert into water_points (id, kind, name, location, potability, potability_evidence_kind,
  potability_evidence_source, potability_evidence_at, operational_status, availability,
  water_type, is_free, primary_source_category, publication_status) values
  ('20000000-0000-0000-0000-000000000001', 'drinking_fountain', 'Certifiée',
    st_setsrid(st_makepoint(2.3522, 48.8566), 4326)::geography, 'certified_potable',
    'official_dataset', 'Test officiel', '2026-06-01', 'working', 'available', 'still', true,
    'official', 'published'),
  ('20000000-0000-0000-0000-000000000002', 'water_tap', 'Déclarée',
    st_setsrid(st_makepoint(2.3550, 48.8570), 4326)::geography, 'declared_potable',
    'osm_tag', 'OSM', null, 'out_of_order', 'available', 'still_and_sparkling', null,
    'openstreetmap', 'published'),
  ('20000000-0000-0000-0000-000000000003', 'decorative_fountain', 'Décorative',
    st_setsrid(st_makepoint(2.3530, 48.8575), 4326)::geography, 'unknown',
    null, null, null, 'working', 'available', 'unknown', true, 'openstreetmap', 'published'),
  ('20000000-0000-0000-0000-000000000004', 'drinking_fountain', 'Supprimée',
    st_setsrid(st_makepoint(2.3540, 48.8560), 4326)::geography, 'declared_potable',
    'osm_tag', 'OSM', null, 'working', 'removed', 'still', true, 'openstreetmap', 'published'),
  ('20000000-0000-0000-0000-000000000005', 'drinking_fountain', 'Lyon',
    st_setsrid(st_makepoint(4.8357, 45.7640), 4326)::geography, 'declared_potable',
    'osm_tag', 'OSM', null, 'working', 'available', 'still', true, 'openstreetmap', 'published');

-- ── Contrainte de certification ─────────────────────────────────────────────
select throws_ok(
  $$insert into water_points (kind, location, potability, primary_source_category)
    values ('drinking_fountain', st_setsrid(st_makepoint(2, 48), 4326)::geography, 'certified_potable', 'community')$$,
  '23514', null, 'une potabilité certifiée sans preuve officielle datée est refusée');
select throws_ok(
  $$insert into water_points (kind, location, potability, potability_evidence_kind, potability_evidence_source,
      potability_evidence_at, primary_source_category)
    values ('drinking_fountain', st_setsrid(st_makepoint(2, 48), 4326)::geography, 'certified_potable',
      'community_report', 'Quelqu''un', current_date, 'community')$$,
  '23514', null, 'un avis communautaire ne peut pas certifier la potabilité');

-- ── Lecture anonyme ─────────────────────────────────────────────────────────
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

select is((select count(*)::int from water_points_in_bbox(2.30, 48.80, 2.40, 48.90)), 2,
  'emprise Paris : points publiés hors décoratifs et hors supprimés');
select is((select count(*)::int from water_points_in_bbox(2.30, 48.80, 2.40, 48.90, include_decorative => true)), 3,
  'les fontaines décoratives apparaissent si demandé');
select is((select count(*)::int from water_points_in_bbox(2.30, 48.80, 2.40, 48.90, potability_filter => 'certified')), 1,
  'filtre « certifiée »');
select is((select count(*)::int from water_points_in_bbox(2.30, 48.80, 2.40, 48.90, hide_out_of_order => true)), 1,
  'filtre « masquer hors service »');
select is((select count(*)::int from water_points_in_bbox(2.30, 48.80, 2.40, 48.90, sparkling_only => true)), 1,
  'filtre « eau gazeuse »');
select is((select count(*)::int from water_points_in_bbox(2.30, 48.80, 2.40, 48.90, free_only => true)), 1,
  'filtre « gratuit » (inconnu exclu)');
select is((select count(*)::int from water_points_in_bbox(2.30, 48.80, 2.40, 48.90, include_decorative => true, max_points => 1)), 2,
  'troncature : max_points + 1 lignes signalent une zone dense');
select is((select count(*)::int from water_points_in_bbox(-10, 40, 10, 52)), 3, 'une grande emprise couvre Paris et Lyon');
select is((select name from water_points_nearby(48.8566, 2.3522, 1000) limit 1), 'Certifiée',
  'plus proche voisin en premier');
select ok((select distance_meters from water_points_nearby(48.8566, 2.3522, 1000) offset 1 limit 1) between 150 and 250,
  'distance en mètres cohérente (≈ 210 m)');
select is((select count(*)::int from water_points_nearby(48.8566, 2.3522, 1000)), 2, 'rayon de 1 km : Lyon exclue');
select ok(water_point_detail('20000000-0000-0000-0000-000000000001') ->> 'potability' = 'certified_potable',
  'fiche détaillée lisible par un anonyme');
select throws_ok($$select submit_water_point('drinking_fountain', 48.85, 2.35)$$, '42501', null,
  'un anonyme ne peut pas contribuer');
select throws_ok($$insert into water_points (kind, location, primary_source_category)
  values ('other', st_setsrid(st_makepoint(2, 48), 4326)::geography, 'community')$$, '42501', null,
  'écriture directe interdite à un anonyme');
select throws_ok($$select etl_start_run('test-osm')$$, '42501', null, 'les fonctions d''import sont réservées au serveur');
reset role;

-- ── Contributions (Alice) ───────────────────────────────────────────────────
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';

select throws_ok($$select submit_water_point('drinking_fountain', 48.85661, 2.35221)$$, 'P0001', 'duplicate_nearby',
  'un point à moins de 15 m d''un point existant est signalé comme doublon');
select throws_ok($$select submit_water_point('drinking_fountain', 0, 0)$$, '22023', 'invalid_coordinates',
  'coordonnées (0, 0) refusées');

create temp table t_ids (name text primary key, id uuid);
grant all on t_ids to authenticated, anon, service_role;
insert into t_ids select 'alice_point', submit_water_point('water_tap', 48.8600, 2.3600, 'Robinet Alice',
  'still', true, null, 'potable', 'Près du kiosque');

select is((select potability::text from water_points where id = (select id from t_ids where name = 'alice_point')),
  'declared_potable', 'une revendication « potable » donne « indiquée potable », jamais « certifiée »');
select is((select publication_status::text from water_points where id = (select id from t_ids where name = 'alice_point')),
  'pending', 'la contribution est en attente de modération');
select is((select count(*)::int from water_points_in_bbox(2.30, 48.80, 2.40, 48.90)), 2,
  'un point en attente n''apparaît pas sur la carte');

select lives_ok($$select submit_report('20000000-0000-0000-0000-000000000002', 'fixed', 'Réparé ce matin')$$,
  'signalement de remise en service');
select throws_ok($$select submit_report('20000000-0000-0000-0000-000000000002', 'fixed')$$, 'P0001', 'already_reported',
  'pas de signalement identique répété dans l''heure');
select lives_ok($$select submit_report('20000000-0000-0000-0000-000000000001', 'potability_potable')$$,
  'revendication de potabilité sur un point certifié');
select lives_ok($$select submit_report('20000000-0000-0000-0000-000000000005', 'potability_not_potable', 'Panneau eau non potable')$$,
  'signalement de non-potabilité');
select throws_ok($$select propose_revision('20000000-0000-0000-0000-000000000002', '{"potability":"certified_potable"}')$$,
  '22023', 'field_not_editable', 'la potabilité ne se modifie pas par une proposition');
insert into t_ids select 'alice_revision', propose_revision('20000000-0000-0000-0000-000000000002',
  '{"name":"Robinet du square","is_free":true}', 'Nom affiché sur place');
select throws_ok($$select register_photo('20000000-0000-0000-0000-000000000002', 'quelquun/photo.jpg')$$,
  '22023', 'invalid_storage_path', 'une photo doit être dans le dossier de son auteur');
select throws_ok($$select moderate_report((select id from water_point_reports limit 1), 'approve')$$,
  '42501', 'moderator_required', 'un utilisateur ne peut pas modérer');
select throws_ok($$update profiles set role = 'admin' where id = auth.uid()$$, '42501', null,
  'un utilisateur ne peut pas changer son rôle');
select is((select count(*)::int from water_point_reports), 4,
  'Alice voit ses propres signalements (dont le commentaire joint à son ajout)');

insert into favorites (user_id, water_point_id) values
  ('00000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-000000000001');
select throws_ok($$insert into favorites (user_id, water_point_id)
  values ('00000000-0000-0000-0000-00000000000b', '20000000-0000-0000-0000-000000000001')$$, '42501', null,
  'impossible d''ajouter un favori pour un autre utilisateur');
select is(jsonb_array_length(my_contributions()), 6, 'mes contributions : 1 point, 4 signalements, 1 modification');
reset role;

-- Bob ne voit ni les signalements ni les favoris d'Alice.
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';
select is((select count(*)::int from water_point_reports), 0, 'Bob ne voit pas les signalements d''Alice');
select is((select count(*)::int from favorites), 0, 'Bob ne voit pas les favoris d''Alice');
select is((select count(*)::int from water_points where name = 'Robinet Alice'), 0,
  'Bob ne voit pas le point en attente d''Alice');
reset role;

-- ── Fonctions internes : jamais appelables directement ──────────────────────
select ok(not has_function_privilege('authenticated', 'public.notify_user(uuid, text, jsonb)', 'execute'),
  'un utilisateur ne peut pas créer de notification arbitraire');
select ok(not has_function_privilege('authenticated', 'public.log_moderation(text, uuid, text, text)', 'execute'),
  'un utilisateur ne peut pas écrire dans le journal de modération');
select ok(not has_function_privilege('authenticated', 'public.etl_upsert_point(uuid, text, jsonb)', 'execute'),
  'un utilisateur ne peut pas lancer d''import');
select ok(not has_function_privilege('anon', 'public.submit_report(uuid, public.report_type, text)', 'execute'),
  'un visiteur ne peut pas contribuer');

-- ── Administration : lecture réservée aux modérateurs ───────────────────────
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';
select throws_ok($$select moderation_queue()$$, '42501', null,
  'un utilisateur ordinaire n''accède pas à la file de modération');
select throws_ok($$select * from admin_search_points()$$, '42501', null,
  'un utilisateur ordinaire n''accède pas à la recherche d''administration');
reset role;
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select throws_ok($$select moderation_queue()$$, '42501', null, 'un visiteur n''accède pas à la file');
reset role;

-- ── Modération ──────────────────────────────────────────────────────────────
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}';

select is(jsonb_array_length(moderation_queue() -> 'points'), 1,
  'file de modération : la proposition d''Alice est en attente');
select ok((moderation_queue() -> 'points' -> 0 ->> 'latitude') is not null,
  'file de modération : coordonnées fournies au modérateur');
select is(jsonb_array_length(moderation_queue() -> 'revisions'), 1, 'file : modification en attente');
select ok((select count(*) from admin_search_points('Robinet Alice')) = 1,
  'recherche d''administration : les points en attente sont trouvés');

select lives_ok($$select moderate_water_point((select id from t_ids where name = 'alice_point'), 'approve')$$,
  'le modérateur publie la contribution');
select lives_ok($$select moderate_report((select id from water_point_reports where type = 'fixed'), 'approve')$$,
  'le modérateur valide la remise en service');
select lives_ok($$select moderate_report((select id from water_point_reports where type = 'potability_potable'), 'approve')$$,
  'validation d''une revendication de potabilité');
select lives_ok($$select moderate_report((select id from water_point_reports where type = 'potability_not_potable'), 'approve')$$,
  'validation d''un signalement de non-potabilité');
select lives_ok($$select moderate_revision((select id from t_ids where name = 'alice_revision'), 'approve')$$,
  'validation de la modification proposée');
reset role;

select is((select operational_status::text from water_points where id = '20000000-0000-0000-0000-000000000002'),
  'working', 'remise en service appliquée');
select is((select potability::text from water_points where id = '20000000-0000-0000-0000-000000000001'),
  'certified_potable', 'une revendication communautaire ne remplace jamais une certification officielle');
select is((select potability::text from water_points where id = '20000000-0000-0000-0000-000000000005'),
  'not_potable', 'principe de précaution : la non-potabilité validée s''applique');
select is((select name from water_points where id = '20000000-0000-0000-0000-000000000002'),
  'Robinet du square', 'modification appliquée');
select is((select count(*)::int from notifications where user_id = '00000000-0000-0000-0000-00000000000a'), 5,
  'Alice est notifiée de chaque décision');
select is((select count(*)::int from moderation_actions), 5, 'chaque décision est journalisée');

-- ── Imports (rôle serveur) ──────────────────────────────────────────────────
set local role service_role;
insert into t_ids select 'run1', etl_start_run('test-osm');
select is(etl_upsert_point((select id from t_ids where name = 'run1'), 'node/1',
  '{"kind":"drinking_fountain","latitude":48.87,"longitude":2.33,"potability":"declared_potable",
    "potability_evidence":{"kind":"osm_tag","source_name":"OpenStreetMap"}}'), 'inserted', 'import : nouveau point');
select is(etl_upsert_point((select id from t_ids where name = 'run1'), 'node/1',
  '{"kind":"drinking_fountain","latitude":48.87,"longitude":2.33,"potability":"declared_potable",
    "potability_evidence":{"kind":"osm_tag","source_name":"OpenStreetMap"}}'), 'unchanged', 'import idempotent');
select is(etl_upsert_point((select id from t_ids where name = 'run1'), 'node/2',
  '{"kind":"drinking_fountain","latitude":48.85661,"longitude":2.35222,"potability":"declared_potable",
    "potability_evidence":{"kind":"osm_tag","source_name":"OpenStreetMap"}}'), 'merged',
  'même point déjà connu à moins de 10 m : provenance ajoutée, pas de doublon');
select is(etl_upsert_point((select id from t_ids where name = 'run1'), 'node/3', '{"kind":"drinking_fountain","latitude":0,"longitude":0}'),
  'rejected', 'enregistrement invalide rejeté sans bloquer l''import');
select is((select (etl_finish_run((select id from t_ids where name = 'run1'), 4)).status::text), 'partial',
  'import terminé avec rejets → statut partiel');
reset role;

select is((select potability::text from water_points where id = '20000000-0000-0000-0000-000000000001'),
  'certified_potable', 'OpenStreetMap n''écrase pas une potabilité officielle');
select is((select count(*)::int from water_point_sources where water_point_id = '20000000-0000-0000-0000-000000000001'), 1,
  'la provenance OSM est rattachée au point existant');

-- ── Suppression de compte ───────────────────────────────────────────────────
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';
select lives_ok($$select delete_my_account()$$, 'suppression de son compte');
reset role;
select is((select count(*)::int from profiles where id = '00000000-0000-0000-0000-00000000000a'), 0, 'profil supprimé');
select is((select count(*)::int from water_points where name = 'Robinet Alice' and created_by is null), 1,
  'la contribution publiée reste, anonymisée');

select * from finish();
rollback;
