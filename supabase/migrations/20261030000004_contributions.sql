-- Contributions communautaires et modération.
-- Toutes les écritures passent par ces fonctions : authentification obligatoire, validation,
-- limitation de fréquence, détection de doublons, historique, et jamais de potabilité certifiée.

-- ── Utilitaires ──────────────────────────────────────────────────────────────
create or replace function public.require_user() returns uuid
language plpgsql stable as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;
  return uid;
end $$;

create or replace function public.require_moderator() returns uuid
language plpgsql stable security definer set search_path = public as $$
declare
  uid uuid := public.require_user();
begin
  if not public.is_moderator() then
    raise exception 'moderator_required' using errcode = '42501';
  end if;
  return uid;
end $$;

-- Lève `rate_limited` si l'utilisateur a déjà atteint `max_count` actions dans la fenêtre.
create or replace function public.enforce_rate_limit(action_count bigint, max_count integer) returns void
language plpgsql immutable as $$
begin
  if action_count >= max_count then
    raise exception 'rate_limited' using errcode = 'P0001', hint = 'Réessayez plus tard.';
  end if;
end $$;

create or replace function public.log_moderation(
  target_type text, target_id uuid, action text, reason text
) returns void
language sql security definer set search_path = public as $$
  insert into public.moderation_actions (moderator_id, target_type, target_id, action, reason)
  values (auth.uid(), target_type, target_id, action, nullif(trim(reason), ''))
$$;

create or replace function public.notify_user(target uuid, kind text, payload jsonb) returns void
language sql security definer set search_path = public as $$
  insert into public.notifications (user_id, type, payload)
  select target, kind, payload where target is not null
$$;

-- ── Ajout d'un point d'eau ───────────────────────────────────────────────────
create or replace function public.submit_water_point(
  kind public.water_point_kind,
  latitude double precision,
  longitude double precision,
  name text default null,
  water_type public.water_type default 'unknown',
  is_free boolean default null,
  wheelchair_accessible boolean default null,
  potability_claim text default 'unknown',
  comment text default null
) returns uuid
language plpgsql security definer set search_path = public, extensions as $$
declare
  uid uuid := public.require_user();
  point geography := st_setsrid(st_makepoint(longitude, latitude), 4326)::geography;
  duplicate_id uuid;
  new_id uuid;
  claimed public.potability_status;
begin
  if latitude is null or longitude is null or latitude not between -90 and 90
     or longitude not between -180 and 180 or (latitude = 0 and longitude = 0) then
    raise exception 'invalid_coordinates' using errcode = '22023';
  end if;
  if potability_claim not in ('potable', 'not_potable', 'unknown') then
    raise exception 'invalid_potability_claim' using errcode = '22023';
  end if;

  perform public.enforce_rate_limit(
    (select count(*) from public.water_points w
      where w.created_by = uid and w.created_at > now() - interval '24 hours'), 10);

  select w.id into duplicate_id from public.water_points w
  where w.publication_status in ('published', 'pending')
    and w.availability <> 'removed'
    and st_dwithin(w.location, point, 15)
  order by w.location <-> point
  limit 1;
  if duplicate_id is not null then
    raise exception 'duplicate_nearby' using errcode = 'P0001', detail = duplicate_id::text;
  end if;

  -- Une contribution ne certifie jamais : au mieux « indiquée potable ».
  claimed := case potability_claim
    when 'potable' then 'declared_potable'::public.potability_status
    when 'not_potable' then 'not_potable'::public.potability_status
    else 'unknown'::public.potability_status end;

  insert into public.water_points (
    kind, name, location, potability, potability_evidence_kind, potability_evidence_source,
    operational_status, availability, water_type, is_free, wheelchair_accessible,
    last_verified_at, primary_source_category, publication_status, created_by
  ) values (
    kind, nullif(left(trim(name), 120), ''), point, claimed,
    case when claimed <> 'unknown' then 'community_report'::public.evidence_kind end,
    case when claimed <> 'unknown' then 'Contribution Water Finder' end,
    'working', 'available', coalesce(water_type, 'unknown'), is_free, wheelchair_accessible,
    now(), 'community',
    case when public.is_moderator() then 'published'::public.publication_status else 'pending' end,
    uid
  ) returning id into new_id;

  if nullif(trim(comment), '') is not null then
    insert into public.water_point_reports (water_point_id, user_id, type, comment)
    values (new_id, uid, 'other', left(trim(comment), 500));
  end if;
  return new_id;
end $$;

-- ── Signalement (panne, remise en service, inexistant, potabilité…) ──────────
create or replace function public.submit_report(
  point_id uuid,
  report_type public.report_type,
  comment text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := public.require_user();
  new_id uuid;
begin
  if not exists (select 1 from public.water_points where id = point_id and publication_status = 'published') then
    raise exception 'water_point_not_found' using errcode = 'P0002';
  end if;
  perform public.enforce_rate_limit(
    (select count(*) from public.water_point_reports r
      where r.user_id = uid and r.created_at > now() - interval '24 hours'), 20);
  if exists (
    select 1 from public.water_point_reports r
    where r.user_id = uid and r.water_point_id = point_id and r.type = report_type
      and r.created_at > now() - interval '1 hour'
  ) then
    raise exception 'already_reported' using errcode = 'P0001';
  end if;

  insert into public.water_point_reports (water_point_id, user_id, type, comment)
  values (point_id, uid, report_type, nullif(left(trim(comment), 500), ''))
  returning id into new_id;
  return new_id;
end $$;

-- ── Proposition de modification ──────────────────────────────────────────────
create or replace function public.propose_revision(
  point_id uuid,
  changes jsonb,
  comment text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := public.require_user();
  allowed constant text[] := array[
    'name', 'kind', 'water_type', 'is_free', 'wheelchair_accessible', 'opening_hours',
    'address', 'availability'
  ];
  key text;
  current_row public.water_points;
  new_id uuid;
begin
  select * into current_row from public.water_points where id = point_id and publication_status = 'published';
  if not found then
    raise exception 'water_point_not_found' using errcode = 'P0002';
  end if;
  if changes is null or jsonb_typeof(changes) <> 'object' or changes = '{}'::jsonb then
    raise exception 'invalid_changes' using errcode = '22023';
  end if;
  for key in select jsonb_object_keys(changes) loop
    if not key = any(allowed) then
      -- La potabilité ne se modifie pas par une proposition (signalement dédié, jamais certifié).
      raise exception 'field_not_editable' using errcode = '22023', detail = key;
    end if;
  end loop;
  if changes ? 'availability' and changes ->> 'availability' = 'removed' then
    raise exception 'use_not_existing_report' using errcode = '22023';
  end if;
  perform public.enforce_rate_limit(
    (select count(*) from public.water_point_revisions r
      where r.user_id = uid and r.created_at > now() - interval '24 hours'), 20);

  insert into public.water_point_revisions (water_point_id, user_id, changes, previous, comment)
  values (
    point_id, uid, changes,
    (select jsonb_object_agg(k, to_jsonb(current_row) -> k) from jsonb_object_keys(changes) k),
    nullif(left(trim(comment), 500), '')
  ) returning id into new_id;
  return new_id;
end $$;

-- ── Photo (fichier déjà déposé dans le stockage, sous le dossier de l'utilisateur) ──
create or replace function public.register_photo(
  point_id uuid,
  storage_path text,
  width integer default null,
  height integer default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := public.require_user();
  new_id uuid;
begin
  if storage_path is null or storage_path !~ ('^' || uid::text || '/[A-Za-z0-9_-]+\.(jpg|jpeg|webp)$') then
    raise exception 'invalid_storage_path' using errcode = '22023';
  end if;
  if not exists (select 1 from public.water_points where id = point_id and publication_status = 'published') then
    raise exception 'water_point_not_found' using errcode = 'P0002';
  end if;
  perform public.enforce_rate_limit(
    (select count(*) from public.water_point_photos p
      where p.user_id = uid and p.created_at > now() - interval '24 hours'), 20);
  insert into public.water_point_photos (water_point_id, user_id, storage_path, width, height)
  values (point_id, uid, storage_path, width, height)
  returning id into new_id;
  return new_id;
end $$;

-- ── Modération ───────────────────────────────────────────────────────────────
create or replace function public.moderate_water_point(point_id uuid, decision text, reason text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare
  author uuid;
begin
  perform public.require_moderator();
  if decision not in ('approve', 'reject') then
    raise exception 'invalid_decision' using errcode = '22023';
  end if;
  update public.water_points
  set publication_status = case when decision = 'approve' then 'published'::public.publication_status else 'rejected' end
  where id = point_id and publication_status = 'pending'
  returning created_by into author;
  if not found then
    raise exception 'nothing_to_moderate' using errcode = 'P0002';
  end if;
  perform public.log_moderation('water_point', point_id, decision, reason);
  perform public.notify_user(author, 'contribution_' || decision || 'd',
    jsonb_build_object('water_point_id', point_id, 'reason', reason));
end $$;

create or replace function public.moderate_report(report_id uuid, decision text, reason text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare
  report public.water_point_reports;
begin
  perform public.require_moderator();
  if decision not in ('approve', 'reject') then
    raise exception 'invalid_decision' using errcode = '22023';
  end if;
  update public.water_point_reports
  set review_status = case when decision = 'approve' then 'approved'::public.review_status else 'rejected' end,
      resolved_by = auth.uid(), resolved_at = now()
  where id = report_id and review_status = 'pending'
  returning * into report;
  if not found then
    raise exception 'nothing_to_moderate' using errcode = 'P0002';
  end if;

  if decision = 'approve' then
    case report.type
      when 'broken' then
        update public.water_points set operational_status = 'out_of_order',
          operational_status_at = now(), last_verified_at = now() where id = report.water_point_id;
      when 'fixed' then
        update public.water_points set operational_status = 'working',
          operational_status_at = now(), last_verified_at = now() where id = report.water_point_id;
      when 'not_existing' then
        update public.water_points set availability = 'removed', last_verified_at = now()
        where id = report.water_point_id;
      when 'potability_potable' then
        -- Jamais de certification par la communauté ; une certification officielle reste intacte.
        update public.water_points set potability = 'declared_potable',
          potability_evidence_kind = 'community_report',
          potability_evidence_source = 'Signalement modéré Water Finder',
          potability_evidence_url = null, potability_evidence_at = current_date
        where id = report.water_point_id and potability <> 'certified_potable';
      when 'potability_not_potable' then
        -- Principe de précaution : un signalement validé de non-potabilité l'emporte.
        update public.water_points set potability = 'not_potable',
          potability_evidence_kind = 'community_report',
          potability_evidence_source = 'Signalement modéré Water Finder',
          potability_evidence_url = null, potability_evidence_at = current_date
        where id = report.water_point_id;
      else
        null;
    end case;
  end if;

  perform public.log_moderation('report', report_id, decision, reason);
  perform public.notify_user(report.user_id, 'report_' || decision || 'd',
    jsonb_build_object('report_id', report_id, 'water_point_id', report.water_point_id, 'type', report.type));
end $$;

create or replace function public.moderate_revision(revision_id uuid, decision text, reason text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare
  rev public.water_point_revisions;
  c jsonb;
begin
  perform public.require_moderator();
  if decision not in ('approve', 'reject') then
    raise exception 'invalid_decision' using errcode = '22023';
  end if;
  update public.water_point_revisions
  set review_status = case when decision = 'approve' then 'approved'::public.review_status else 'rejected' end,
      reviewed_by = auth.uid(), reviewed_at = now()
  where id = revision_id and review_status = 'pending'
  returning * into rev;
  if not found then
    raise exception 'nothing_to_moderate' using errcode = 'P0002';
  end if;

  if decision = 'approve' then
    c := rev.changes;
    update public.water_points set
      name = case when c ? 'name' then nullif(left(trim(c ->> 'name'), 120), '') else name end,
      kind = case when c ? 'kind' then (c ->> 'kind')::public.water_point_kind else kind end,
      water_type = case when c ? 'water_type' then (c ->> 'water_type')::public.water_type else water_type end,
      is_free = case when c ? 'is_free' then (c ->> 'is_free')::boolean else is_free end,
      wheelchair_accessible = case when c ? 'wheelchair_accessible'
        then (c ->> 'wheelchair_accessible')::boolean else wheelchair_accessible end,
      opening_hours = case when c ? 'opening_hours' then nullif(left(c ->> 'opening_hours', 255), '') else opening_hours end,
      address = case when c ? 'address' then nullif(left(c ->> 'address', 240), '') else address end,
      availability = case when c ? 'availability' then (c ->> 'availability')::public.availability_status else availability end,
      last_verified_at = now()
    where id = rev.water_point_id;
  end if;

  perform public.log_moderation('revision', revision_id, decision, reason);
  perform public.notify_user(rev.user_id, 'revision_' || decision || 'd',
    jsonb_build_object('revision_id', revision_id, 'water_point_id', rev.water_point_id));
end $$;

create or replace function public.moderate_photo(photo_id uuid, decision text, reason text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare
  author uuid;
  point uuid;
begin
  perform public.require_moderator();
  if decision not in ('approve', 'reject') then
    raise exception 'invalid_decision' using errcode = '22023';
  end if;
  update public.water_point_photos
  set review_status = case when decision = 'approve' then 'approved'::public.review_status else 'rejected' end
  where id = photo_id and review_status = 'pending'
  returning user_id, water_point_id into author, point;
  if not found then
    raise exception 'nothing_to_moderate' using errcode = 'P0002';
  end if;
  perform public.log_moderation('photo', photo_id, decision, reason);
  perform public.notify_user(author, 'photo_' || decision || 'd',
    jsonb_build_object('photo_id', photo_id, 'water_point_id', point));
end $$;

-- Fusion d'un doublon dans un point cible : provenances, photos, signalements et favoris suivent.
create or replace function public.merge_water_points(duplicate_id uuid, target_id uuid, reason text default null)
returns void
language plpgsql security definer set search_path = public as $$
begin
  perform public.require_moderator();
  if duplicate_id = target_id then
    raise exception 'same_point' using errcode = '22023';
  end if;
  if not exists (select 1 from public.water_points where id = target_id and publication_status = 'published') then
    raise exception 'water_point_not_found' using errcode = 'P0002';
  end if;
  update public.water_point_sources set water_point_id = target_id where water_point_id = duplicate_id;
  update public.water_point_photos set water_point_id = target_id where water_point_id = duplicate_id;
  update public.water_point_reports set water_point_id = target_id where water_point_id = duplicate_id;
  insert into public.favorites (user_id, water_point_id, created_at)
    select user_id, target_id, created_at from public.favorites where water_point_id = duplicate_id
    on conflict do nothing;
  delete from public.favorites where water_point_id = duplicate_id;
  update public.water_points set publication_status = 'merged', merged_into_id = target_id
  where id = duplicate_id;
  perform public.log_moderation('water_point', duplicate_id, 'merge:' || target_id::text, reason);
end $$;

-- Candidats doublons : points publiés distincts à moins de `max_distance` mètres.
create or replace function public.duplicate_candidates(max_distance double precision default 10, max_rows integer default 200)
returns table (point_a uuid, point_b uuid, distance_meters double precision, kind_a public.water_point_kind, kind_b public.water_point_kind)
language sql stable security definer set search_path = public, extensions as $$
  select a.id, b.id, st_distance(a.location, b.location), a.kind, b.kind
  from public.water_points a
  join public.water_points b
    on a.id < b.id and st_dwithin(a.location, b.location, least(greatest(max_distance, 0.5), 50))
  where public.is_moderator()
    and a.publication_status = 'published' and b.publication_status = 'published'
    and a.availability <> 'removed' and b.availability <> 'removed'
  order by 3
  limit least(greatest(max_rows, 1), 1000)
$$;

create or replace function public.set_user_role(target_user uuid, new_role public.user_role)
returns void
language plpgsql security definer set search_path = public as $$
begin
  perform public.require_user();
  if not public.is_admin() then
    raise exception 'admin_required' using errcode = '42501';
  end if;
  update public.profiles set role = new_role where id = target_user;
  perform public.log_moderation('profile', target_user, 'set_role:' || new_role::text, null);
end $$;

-- Statistiques du tableau de bord (modérateurs).
create or replace function public.admin_stats() returns jsonb
language sql stable security definer set search_path = public as $$
  select case when not public.is_moderator() then null else jsonb_build_object(
    'points_published', (select count(*) from public.water_points where publication_status = 'published' and availability <> 'removed'),
    'points_pending', (select count(*) from public.water_points where publication_status = 'pending'),
    'points_certified', (select count(*) from public.water_points where publication_status = 'published' and potability = 'certified_potable'),
    'points_out_of_order', (select count(*) from public.water_points where publication_status = 'published' and operational_status = 'out_of_order'),
    'reports_pending', (select count(*) from public.water_point_reports where review_status = 'pending'),
    'revisions_pending', (select count(*) from public.water_point_revisions where review_status = 'pending'),
    'photos_pending', (select count(*) from public.water_point_photos where review_status = 'pending'),
    'users', (select count(*) from public.profiles),
    'by_source', coalesce((select jsonb_object_agg(primary_source_category, n) from (
      select primary_source_category, count(*) n from public.water_points
      where publication_status = 'published' group by 1) s), '{}'::jsonb),
    'last_import_runs', coalesce((select jsonb_agg(r) from (
      select s.key as source, ir.status, ir.started_at, ir.finished_at, ir.inserted_count,
        ir.updated_count, ir.unchanged_count, ir.rejected_count
      from public.import_runs ir join public.import_sources s on s.id = ir.import_source_id
      order by ir.started_at desc limit 10) r), '[]'::jsonb)
  ) end
$$;

-- ── Compte ───────────────────────────────────────────────────────────────────
-- Suppression définitive : profil, favoris, préférences et notifications supprimés ;
-- les contributions publiées restent, anonymisées (auteur effacé).
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
declare
  uid uuid := public.require_user();
begin
  delete from auth.users where id = uid;
end $$;

create or replace function public.mark_notifications_read() returns void
language sql security definer set search_path = public as $$
  update public.notifications set read_at = now() where user_id = auth.uid() and read_at is null
$$;

-- Contributions de l'utilisateur courant (points, signalements, modifications, photos).
create or replace function public.my_contributions(max_rows integer default 100) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(c order by (c ->> 'created_at') desc), '[]'::jsonb) from (
    select jsonb_build_object('kind', 'water_point', 'id', w.id, 'water_point_id', w.id,
      'label', coalesce(w.name, w.kind::text), 'status', w.publication_status, 'created_at', w.created_at) c
    from public.water_points w where w.created_by = auth.uid()
    union all
    select jsonb_build_object('kind', 'report', 'id', r.id, 'water_point_id', r.water_point_id,
      'label', r.type::text, 'status', r.review_status, 'created_at', r.created_at)
    from public.water_point_reports r where r.user_id = auth.uid()
    union all
    select jsonb_build_object('kind', 'revision', 'id', v.id, 'water_point_id', v.water_point_id,
      'label', (select string_agg(k, ', ') from jsonb_object_keys(v.changes) k), 'status', v.review_status,
      'created_at', v.created_at)
    from public.water_point_revisions v where v.user_id = auth.uid()
    union all
    select jsonb_build_object('kind', 'photo', 'id', p.id, 'water_point_id', p.water_point_id,
      'label', 'photo', 'status', p.review_status, 'created_at', p.created_at)
    from public.water_point_photos p where p.user_id = auth.uid()
    limit least(greatest(max_rows, 1), 500)
  ) contributions
$$;

-- ── Droits d'exécution ───────────────────────────────────────────────────────
revoke execute on all functions in schema public from public, anon;
grant execute on function public.water_points_in_bbox, public.water_points_nearby,
  public.water_point_detail, public.water_point_matches_filters, public.is_moderator,
  public.is_admin, public.current_user_role to anon, authenticated;
grant execute on function public.submit_water_point, public.submit_report, public.propose_revision,
  public.register_photo, public.moderate_water_point, public.moderate_report,
  public.moderate_revision, public.moderate_photo, public.merge_water_points,
  public.duplicate_candidates, public.set_user_role, public.admin_stats, public.delete_my_account,
  public.mark_notifications_read, public.my_contributions to authenticated;
grant execute on all functions in schema public to service_role;
