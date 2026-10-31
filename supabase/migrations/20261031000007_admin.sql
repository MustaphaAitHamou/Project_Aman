-- Fonctions de lecture pour l'interface d'administration (réservées aux modérateurs).
-- L'interface n'utilise jamais la clé service_role : tout passe par ces fonctions et par RLS.

-- File de modération : éléments en attente, avec le contexte utile à la décision.
create or replace function public.moderation_queue(max_rows integer default 50) returns jsonb
language plpgsql stable security definer set search_path = public, extensions as $$
declare
  lim integer := least(greatest(max_rows, 1), 200);
begin
  perform public.require_moderator();
  return jsonb_build_object(
    'points', coalesce((select jsonb_agg(p order by p ->> 'created_at') from (
      select jsonb_build_object(
        'id', w.id, 'name', w.name, 'kind', w.kind, 'potability', w.potability,
        'water_type', w.water_type, 'is_free', w.is_free,
        'wheelchair_accessible', w.wheelchair_accessible,
        'latitude', st_y(w.location::geometry), 'longitude', st_x(w.location::geometry),
        'author', pr.display_name, 'created_at', w.created_at,
        'comment', (select r.comment from public.water_point_reports r
                    where r.water_point_id = w.id and r.type = 'other' order by r.created_at limit 1),
        'nearby_count', (select count(*) from public.water_points o
                         where o.id <> w.id and o.publication_status = 'published'
                           and st_dwithin(o.location, w.location, 30))
      ) p
      from public.water_points w left join public.profiles pr on pr.id = w.created_by
      where w.publication_status = 'pending' order by w.created_at limit lim) q), '[]'::jsonb),
    'reports', coalesce((select jsonb_agg(r order by r ->> 'created_at') from (
      select jsonb_build_object(
        'id', r.id, 'water_point_id', r.water_point_id, 'point_name', coalesce(w.name, w.kind::text),
        'type', r.type, 'comment', r.comment, 'author', pr.display_name, 'created_at', r.created_at,
        'operational_status', w.operational_status, 'potability', w.potability
      ) r
      from public.water_point_reports r
      join public.water_points w on w.id = r.water_point_id
      left join public.profiles pr on pr.id = r.user_id
      where r.review_status = 'pending' and w.publication_status = 'published'
      order by r.created_at limit lim) q), '[]'::jsonb),
    'revisions', coalesce((select jsonb_agg(v order by v ->> 'created_at') from (
      select jsonb_build_object(
        'id', v.id, 'water_point_id', v.water_point_id, 'point_name', coalesce(w.name, w.kind::text),
        'changes', v.changes,
        'current', jsonb_build_object('name', w.name, 'kind', w.kind, 'water_type', w.water_type,
          'is_free', w.is_free, 'wheelchair_accessible', w.wheelchair_accessible,
          'opening_hours', w.opening_hours, 'address', w.address, 'availability', w.availability),
        'comment', v.comment, 'author', pr.display_name, 'created_at', v.created_at
      ) v
      from public.water_point_revisions v
      join public.water_points w on w.id = v.water_point_id
      left join public.profiles pr on pr.id = v.user_id
      where v.review_status = 'pending' order by v.created_at limit lim) q), '[]'::jsonb),
    'photos', coalesce((select jsonb_agg(ph order by ph ->> 'created_at') from (
      select jsonb_build_object(
        'id', ph.id, 'water_point_id', ph.water_point_id, 'point_name', coalesce(w.name, w.kind::text),
        'storage_path', ph.storage_path, 'author', pr.display_name, 'created_at', ph.created_at
      ) ph
      from public.water_point_photos ph
      join public.water_points w on w.id = ph.water_point_id
      left join public.profiles pr on pr.id = ph.user_id
      where ph.review_status = 'pending' order by ph.created_at limit lim) q), '[]'::jsonb)
  );
end $$;

-- Recherche de points (tous statuts de publication) pour la liste et la carte d'administration.
create or replace function public.admin_search_points(
  search text default null,
  status public.publication_status default null,
  max_rows integer default 200
) returns table (
  id uuid, name text, kind public.water_point_kind, city text,
  latitude double precision, longitude double precision,
  publication_status public.publication_status, potability public.potability_status,
  operational_status public.operational_status, primary_source_category public.source_category,
  updated_at timestamptz
)
language plpgsql stable security definer set search_path = public, extensions as $$
begin
  perform public.require_moderator();
  return query
    select w.id, w.name, w.kind, w.city, st_y(w.location::geometry), st_x(w.location::geometry),
      w.publication_status, w.potability, w.operational_status, w.primary_source_category, w.updated_at
    from public.water_points w
    where (status is null or w.publication_status = status)
      and (search is null or search = ''
           or w.name ilike '%' || search || '%' or w.city ilike '%' || search || '%'
           or w.id::text = search)
    order by w.updated_at desc
    limit least(greatest(max_rows, 1), 1000);
end $$;

revoke execute on function public.moderation_queue, public.admin_search_points from public, anon;
grant execute on function public.moderation_queue, public.admin_search_points to authenticated, service_role;
