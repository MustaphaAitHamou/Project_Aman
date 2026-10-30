-- Lecture : requêtes spatiales appelées par l'application (RPC PostgREST).
-- Les filtres reproduisent exactement `matchesFilters` de packages/core.

create or replace function public.water_point_matches_filters(
  p public.water_points,
  potability_filter text,
  hide_out_of_order boolean,
  sparkling_only boolean,
  free_only boolean,
  accessible_only boolean,
  include_decorative boolean
) returns boolean
language sql immutable as $$
  select p.publication_status = 'published'
    and p.availability <> 'removed'
    and (include_decorative or p.kind <> 'decorative_fountain')
    and (
      coalesce(potability_filter, 'any') = 'any'
      or (potability_filter = 'potable' and p.potability in ('certified_potable', 'declared_potable'))
      or (potability_filter = 'certified' and p.potability = 'certified_potable')
    )
    and (not hide_out_of_order or p.operational_status <> 'out_of_order')
    and (not sparkling_only or p.water_type in ('sparkling', 'still_and_sparkling'))
    and (not free_only or p.is_free is true)
    and (not accessible_only or p.wheelchair_accessible is true)
$$;

-- Résumé exposé à l'application (mêmes champs que WaterPointSummary).
create type public.water_point_summary as (
  id uuid,
  name text,
  kind public.water_point_kind,
  latitude double precision,
  longitude double precision,
  potability public.potability_status,
  operational_status public.operational_status,
  availability public.availability_status,
  water_type public.water_type,
  is_free boolean,
  wheelchair_accessible boolean,
  last_verified_at timestamptz,
  primary_source_category public.source_category,
  distance_meters double precision
);

-- Points dans une emprise. Renvoie au plus max_points + 1 lignes : la ligne excédentaire
-- signale à l'application que la zone est tronquée (« zoomez »).
create or replace function public.water_points_in_bbox(
  west double precision,
  south double precision,
  east double precision,
  north double precision,
  potability_filter text default 'any',
  hide_out_of_order boolean default false,
  sparkling_only boolean default false,
  free_only boolean default false,
  accessible_only boolean default false,
  include_decorative boolean default false,
  max_points integer default 2000
) returns setof public.water_point_summary
language sql stable security invoker set search_path = public, extensions as $$
  select p.id, p.name, p.kind,
    st_y(p.location::geometry), st_x(p.location::geometry),
    p.potability, p.operational_status, p.availability, p.water_type,
    p.is_free, p.wheelchair_accessible, p.last_verified_at, p.primary_source_category,
    null::double precision
  from public.water_points p
  where p.location && st_makeenvelope(
      greatest(west, -180), greatest(south, -90), least(east, 180), least(north, 90), 4326
    )::geography
    and public.water_point_matches_filters(
      p, potability_filter, hide_out_of_order, sparkling_only, free_only, accessible_only,
      include_decorative
    )
  limit least(greatest(max_points, 1), 5000) + 1
$$;

-- Points dans un rayon, triés par distance (plus proches voisins via l'index GiST).
create or replace function public.water_points_nearby(
  latitude double precision,
  longitude double precision,
  radius_meters double precision default 2000,
  potability_filter text default 'any',
  hide_out_of_order boolean default false,
  sparkling_only boolean default false,
  free_only boolean default false,
  accessible_only boolean default false,
  include_decorative boolean default false,
  max_points integer default 50
) returns setof public.water_point_summary
language sql stable security invoker set search_path = public, extensions as $$
  with origin as (
    select st_setsrid(st_makepoint(longitude, latitude), 4326)::geography as g
  )
  select p.id, p.name, p.kind,
    st_y(p.location::geometry), st_x(p.location::geometry),
    p.potability, p.operational_status, p.availability, p.water_type,
    p.is_free, p.wheelchair_accessible, p.last_verified_at, p.primary_source_category,
    st_distance(p.location, origin.g)
  from public.water_points p, origin
  where st_dwithin(p.location, origin.g, least(greatest(radius_meters, 1), 50000))
    and public.water_point_matches_filters(
      p, potability_filter, hide_out_of_order, sparkling_only, free_only, accessible_only,
      include_decorative
    )
  order by p.location <-> origin.g
  limit least(greatest(max_points, 1), 500)
$$;

-- Fiche complète d'un point : informations, provenances, photos approuvées, derniers
-- signalements (anonymisés). Renvoie null si le point n'est pas visible.
create or replace function public.water_point_detail(point_id uuid) returns jsonb
language sql stable security definer set search_path = public, extensions as $$
  select jsonb_build_object(
    'id', p.id,
    'name', p.name,
    'kind', p.kind,
    'latitude', st_y(p.location::geometry),
    'longitude', st_x(p.location::geometry),
    'address', p.address,
    'city', p.city,
    'country_code', p.country_code,
    'potability', p.potability,
    'potability_evidence', case when p.potability_evidence_kind is null then null else jsonb_build_object(
      'kind', p.potability_evidence_kind,
      'source_name', p.potability_evidence_source,
      'url', p.potability_evidence_url,
      'observed_at', p.potability_evidence_at
    ) end,
    'operational_status', p.operational_status,
    'operational_status_at', p.operational_status_at,
    'availability', p.availability,
    'water_type', p.water_type,
    'is_free', p.is_free,
    'wheelchair_accessible', p.wheelchair_accessible,
    'opening_hours', p.opening_hours,
    'last_verified_at', p.last_verified_at,
    'primary_source_category', p.primary_source_category,
    'publication_status', p.publication_status,
    'updated_at', p.updated_at,
    'sources', coalesce((
      select jsonb_agg(jsonb_build_object(
        'category', s.category,
        'source_key', s.key,
        'source_name', s.name,
        'external_id', ws.external_id,
        'url', coalesce(ws.url, s.url),
        'license', coalesce(ws.license, s.license),
        'retrieved_at', ws.fetched_at
      ) order by ws.fetched_at desc)
      from public.water_point_sources ws
      join public.import_sources s on s.id = ws.import_source_id
      where ws.water_point_id = p.id
    ), '[]'::jsonb),
    'photos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', ph.id, 'storage_path', ph.storage_path, 'width', ph.width, 'height', ph.height,
        'created_at', ph.created_at
      ) order by ph.created_at desc)
      from public.water_point_photos ph
      where ph.water_point_id = p.id and ph.review_status = 'approved'
    ), '[]'::jsonb),
    'recent_reports', coalesce((
      select jsonb_agg(r_json order by created_at desc) from (
        select jsonb_build_object('type', r.type, 'created_at', r.created_at, 'status', r.review_status)
          as r_json, r.created_at
        from public.water_point_reports r
        where r.water_point_id = p.id
          and r.type in ('broken', 'fixed', 'not_existing')
          and r.review_status <> 'rejected'
        order by r.created_at desc
        limit 10
      ) recent
    ), '[]'::jsonb)
  )
  from public.water_points p
  where p.id = point_id
    and (
      p.publication_status = 'published'
      or (p.created_by is not null and p.created_by = auth.uid())
      or public.is_moderator()
    )
$$;

grant execute on function public.water_points_in_bbox, public.water_points_nearby,
  public.water_point_detail to anon, authenticated;
