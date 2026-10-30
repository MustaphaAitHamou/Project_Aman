-- Imports (ETL) : fonctions réservées au serveur (rôle service_role ou connexion directe).
-- Idempotentes, sans aucune suppression : un point disparu d'une source n'est jamais effacé
-- automatiquement, et les contributions communautaires ne sont jamais écrasées.

create or replace function public.etl_register_source(
  source_key text, source_name text, category public.source_category, country_code char(2),
  source_url text, source_license text, source_attribution text, source_format text
) returns uuid
language sql security definer set search_path = public as $$
  insert into public.import_sources (key, name, category, country_code, url, license, attribution, format, enabled)
  values (source_key, source_name, category, country_code, source_url, source_license, source_attribution, source_format, true)
  on conflict (key) do update set name = excluded.name, category = excluded.category,
    country_code = excluded.country_code, url = excluded.url, license = excluded.license,
    attribution = excluded.attribution, format = excluded.format
  returning id
$$;

create or replace function public.etl_start_run(source_key text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  source_id uuid;
  run_id uuid;
begin
  select id into source_id from public.import_sources where key = source_key;
  if source_id is null then
    raise exception 'unknown_source' using errcode = 'P0002', detail = source_key;
  end if;
  insert into public.import_runs (import_source_id) values (source_id) returning id into run_id;
  return run_id;
end $$;

-- Champs du payload (JSON) : kind, name, latitude, longitude, address, city, country_code,
-- potability, potability_evidence {kind, source_name, url, observed_at}, operational_status,
-- availability, water_type, is_free, wheelchair_accessible, opening_hours, last_verified_at,
-- url, license. Renvoie : inserted | updated | unchanged | merged | rejected.
create or replace function public.etl_upsert_point(run_id uuid, external_id text, payload jsonb)
returns text
language plpgsql security definer set search_path = public, extensions as $$
declare
  run public.import_runs;
  source public.import_sources;
  hash text := md5(payload::text);
  existing public.water_point_sources;
  target_id uuid;
  point geography;
  lat double precision := (payload ->> 'latitude')::double precision;
  lng double precision := (payload ->> 'longitude')::double precision;
  p_kind public.water_point_kind;
  p_potability public.potability_status := coalesce(payload ->> 'potability', 'unknown')::public.potability_status;
  ev jsonb := payload -> 'potability_evidence';
  ev_kind public.evidence_kind := (ev ->> 'kind')::public.evidence_kind;
  action text;
begin
  select * into run from public.import_runs where id = run_id and status = 'running';
  if not found then
    raise exception 'run_not_running' using errcode = 'P0002';
  end if;
  select * into source from public.import_sources where id = run.import_source_id;

  -- Validation : un enregistrement invalide est rejeté et journalisé, l'import continue.
  begin
    p_kind := (payload ->> 'kind')::public.water_point_kind;
    if lat is null or lng is null or lat not between -90 and 90 or lng not between -180 and 180
       or (lat = 0 and lng = 0) then
      raise exception 'invalid_coordinates';
    end if;
    if external_id is null or length(external_id) = 0 or length(external_id) > 200 then
      raise exception 'invalid_external_id';
    end if;
  exception when others then
    update public.import_runs set rejected_count = rejected_count + 1,
      error_log = case when jsonb_array_length(error_log) < 500
        then error_log || jsonb_build_object('external_id', external_id, 'error', sqlerrm) else error_log end
    where id = run_id;
    return 'rejected';
  end;
  point := st_setsrid(st_makepoint(lng, lat), 4326)::geography;

  -- Miroir de normalizePotability : pas de certification sans preuve officielle datée.
  if p_potability = 'certified_potable' and not (
    ev_kind in ('official_dataset', 'sanitary_control') and ev ->> 'observed_at' is not null
    and ev ->> 'source_name' is not null
  ) then
    p_potability := 'declared_potable';
  end if;

  select * into existing from public.water_point_sources
  where import_source_id = source.id and water_point_sources.external_id = etl_upsert_point.external_id;

  if found then
    update public.water_point_sources set last_seen_run_id = run_id where id = existing.id;
    if existing.content_hash = hash then
      update public.import_runs set unchanged_count = unchanged_count + 1 where id = run_id;
      return 'unchanged';
    end if;
    target_id := existing.water_point_id;
    action := 'updated';
  else
    -- Même point déjà connu via une autre source (moins de 10 m) : on ajoute une provenance
    -- au lieu de créer un doublon visible.
    select w.id into target_id from public.water_points w
    where w.publication_status = 'published'
      and st_dwithin(w.location, point, 10)
      and not exists (
        select 1 from public.water_point_sources s
        where s.water_point_id = w.id and s.import_source_id = source.id
      )
      and (w.kind = p_kind or (w.kind <> 'decorative_fountain' and p_kind <> 'decorative_fountain'))
    order by w.location <-> point
    limit 1;
    action := case when target_id is null then 'inserted' else 'merged' end;
  end if;

  if target_id is null then
    insert into public.water_points (
      kind, name, location, address, city, country_code, potability, potability_evidence_kind,
      potability_evidence_source, potability_evidence_url, potability_evidence_at,
      operational_status, operational_status_at, availability, water_type, is_free,
      wheelchair_accessible, opening_hours, last_verified_at, primary_source_category,
      publication_status
    ) values (
      p_kind, nullif(left(payload ->> 'name', 120), ''), point,
      nullif(left(payload ->> 'address', 240), ''), nullif(left(payload ->> 'city', 120), ''),
      coalesce(nullif(payload ->> 'country_code', ''), source.country_code), p_potability,
      case when p_potability <> 'unknown' then ev_kind end,
      case when p_potability <> 'unknown' then coalesce(ev ->> 'source_name', source.name) end,
      ev ->> 'url', (ev ->> 'observed_at')::date,
      coalesce(payload ->> 'operational_status', 'unknown')::public.operational_status,
      case when coalesce(payload ->> 'operational_status', 'unknown') <> 'unknown' then now() end,
      coalesce(payload ->> 'availability', 'unknown')::public.availability_status,
      coalesce(payload ->> 'water_type', 'unknown')::public.water_type,
      (payload ->> 'is_free')::boolean, (payload ->> 'wheelchair_accessible')::boolean,
      nullif(left(payload ->> 'opening_hours', 255), ''),
      (payload ->> 'last_verified_at')::timestamptz, source.category, 'published'
    ) returning id into target_id;
  else
    -- Enrichissement prudent d'un point existant :
    -- * champs descriptifs complétés seulement si la source fournit une valeur ;
    -- * potabilité : une source officielle prévaut ; OpenStreetMap ne remplace qu'une valeur
    --   inconnue ou issue d'OpenStreetMap (jamais une donnée officielle ou communautaire) ;
    -- * état de fonctionnement : seulement si la source le fournit explicitement.
    update public.water_points w set
      name = coalesce(w.name, nullif(left(payload ->> 'name', 120), '')),
      address = coalesce(nullif(left(payload ->> 'address', 240), ''), w.address),
      city = coalesce(nullif(left(payload ->> 'city', 120), ''), w.city),
      water_type = case when coalesce(payload ->> 'water_type', 'unknown') <> 'unknown'
        then (payload ->> 'water_type')::public.water_type else w.water_type end,
      is_free = coalesce((payload ->> 'is_free')::boolean, w.is_free),
      wheelchair_accessible = coalesce((payload ->> 'wheelchair_accessible')::boolean, w.wheelchair_accessible),
      opening_hours = coalesce(nullif(left(payload ->> 'opening_hours', 255), ''), w.opening_hours),
      location = case when action = 'updated' and w.primary_source_category = source.category
        then point else w.location end,
      availability = case when coalesce(payload ->> 'availability', 'unknown') <> 'unknown'
        and w.availability <> 'removed'
        then (payload ->> 'availability')::public.availability_status else w.availability end,
      operational_status = case when coalesce(payload ->> 'operational_status', 'unknown') <> 'unknown'
        then (payload ->> 'operational_status')::public.operational_status else w.operational_status end,
      operational_status_at = case when coalesce(payload ->> 'operational_status', 'unknown') <> 'unknown'
        then now() else w.operational_status_at end,
      last_verified_at = greatest(w.last_verified_at, (payload ->> 'last_verified_at')::timestamptz),
      potability = case
        when p_potability = 'unknown' then w.potability
        when source.category = 'official' then p_potability
        when w.potability_evidence_kind is null or w.potability_evidence_kind = 'osm_tag' then p_potability
        else w.potability end,
      potability_evidence_kind = case
        when p_potability = 'unknown' then w.potability_evidence_kind
        when source.category = 'official' then ev_kind
        when w.potability_evidence_kind is null or w.potability_evidence_kind = 'osm_tag' then ev_kind
        else w.potability_evidence_kind end,
      potability_evidence_source = case
        when p_potability = 'unknown' then w.potability_evidence_source
        when source.category = 'official'
          or w.potability_evidence_kind is null or w.potability_evidence_kind = 'osm_tag'
          then coalesce(ev ->> 'source_name', source.name)
        else w.potability_evidence_source end,
      potability_evidence_url = case
        when p_potability = 'unknown' then w.potability_evidence_url
        when source.category = 'official'
          or w.potability_evidence_kind is null or w.potability_evidence_kind = 'osm_tag'
          then ev ->> 'url'
        else w.potability_evidence_url end,
      potability_evidence_at = case
        when p_potability = 'unknown' then w.potability_evidence_at
        when source.category = 'official'
          or w.potability_evidence_kind is null or w.potability_evidence_kind = 'osm_tag'
          then (ev ->> 'observed_at')::date
        else w.potability_evidence_at end,
      -- La catégorie principale suit la meilleure source disponible.
      primary_source_category = case when source.category = 'official' then 'official'::public.source_category
        else w.primary_source_category end
    where w.id = target_id;
  end if;

  insert into public.water_point_sources (water_point_id, import_source_id, external_id, url, license, raw, content_hash, last_seen_run_id)
  values (target_id, source.id, etl_upsert_point.external_id, payload ->> 'url',
    coalesce(payload ->> 'license', source.license), payload, hash, run_id)
  on conflict on constraint water_point_sources_import_source_id_external_id_key do update set
    water_point_id = excluded.water_point_id, url = excluded.url, license = excluded.license,
    raw = excluded.raw, content_hash = excluded.content_hash, fetched_at = now(),
    last_seen_run_id = excluded.last_seen_run_id;

  update public.import_runs set
    inserted_count = inserted_count + (action = 'inserted')::int,
    updated_count = updated_count + (action = 'updated')::int,
    merged_count = merged_count + (action = 'merged')::int
  where id = run_id;
  return action;
end $$;

create or replace function public.etl_finish_run(run_id uuid, fetched integer, errors jsonb default '[]'::jsonb)
returns public.import_runs
language plpgsql security definer set search_path = public as $$
declare
  result public.import_runs;
begin
  update public.import_runs set
    finished_at = now(),
    fetched_count = fetched,
    error_log = error_log || coalesce(errors, '[]'::jsonb),
    status = case
      when fetched = 0 and jsonb_array_length(coalesce(errors, '[]'::jsonb)) > 0 then 'failed'::public.import_run_status
      when rejected_count > 0 or jsonb_array_length(coalesce(errors, '[]'::jsonb)) > 0 then 'partial'
      else 'succeeded' end
  where id = run_id and status = 'running'
  returning * into result;
  if found and result.status in ('succeeded', 'partial') then
    update public.import_sources set last_success_at = now() where id = result.import_source_id;
  end if;
  return result;
end $$;

create or replace function public.etl_fail_run(run_id uuid, error_message text) returns void
language sql security definer set search_path = public as $$
  update public.import_runs set status = 'failed', finished_at = now(),
    error_log = error_log || jsonb_build_array(jsonb_build_object('error', left(error_message, 2000)))
  where id = run_id and status = 'running'
$$;

revoke execute on function public.etl_register_source, public.etl_start_run, public.etl_upsert_point,
  public.etl_finish_run, public.etl_fail_run from public, anon, authenticated;
grant execute on function public.etl_register_source, public.etl_start_run, public.etl_upsert_point,
  public.etl_finish_run, public.etl_fail_run to service_role;
