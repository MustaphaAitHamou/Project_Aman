-- Sécurité : rôles applicatifs et Row Level Security.
-- Principe : lecture publique des seuls points publiés ; toute écriture sensible passe par des
-- fonctions contrôlées (contributions, modération), jamais par des écritures directes.

create or replace function public.current_user_role() returns public.user_role
language sql stable security definer set search_path = public as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'user'::public.user_role)
$$;

create or replace function public.is_moderator() returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and public.current_user_role() in ('moderator', 'admin')
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and public.current_user_role() = 'admin'
$$;

-- Un utilisateur ne peut jamais modifier son propre rôle.
create or replace function public.protect_profile_role() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not public.is_admin()
     and coalesce(auth.role(), '') <> 'service_role' and auth.uid() is not null then
    raise exception 'role_change_forbidden' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger profiles_protect_role before update on public.profiles
  for each row execute function public.protect_profile_role();

alter table public.profiles enable row level security;
alter table public.water_points enable row level security;
alter table public.water_point_sources enable row level security;
alter table public.water_point_photos enable row level security;
alter table public.water_point_reports enable row level security;
alter table public.water_point_revisions enable row level security;
alter table public.favorites enable row level security;
alter table public.import_sources enable row level security;
alter table public.import_runs enable row level security;
alter table public.moderation_actions enable row level security;
alter table public.notifications enable row level security;
alter table public.user_preferences enable row level security;

-- Profils : chacun voit et modifie le sien ; modérateurs : lecture de tous.
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or public.is_moderator());
create policy profiles_update_self on public.profiles for update
  using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

-- Points : publiés visibles par tous ; l'auteur voit ses propositions en attente.
create policy water_points_select on public.water_points for select
  using (
    publication_status = 'published'
    or (created_by is not null and created_by = auth.uid())
    or public.is_moderator()
  );
create policy water_points_moderate on public.water_points for update
  using (public.is_moderator()) with check (public.is_moderator());

-- Provenances : publiques pour les points visibles (transparence des sources).
create policy water_point_sources_select on public.water_point_sources for select
  using (exists (
    select 1 from public.water_points p
    where p.id = water_point_id and p.publication_status = 'published'
  ) or public.is_moderator());

create policy photos_select on public.water_point_photos for select
  using (review_status = 'approved' or user_id = auth.uid() or public.is_moderator());

create policy reports_select on public.water_point_reports for select
  using (user_id = auth.uid() or public.is_moderator());

create policy revisions_select on public.water_point_revisions for select
  using (user_id = auth.uid() or public.is_moderator());

create policy favorites_all on public.favorites for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy import_sources_select on public.import_sources for select using (true);
create policy import_runs_select on public.import_runs for select using (public.is_moderator());
create policy moderation_actions_select on public.moderation_actions for select
  using (public.is_moderator());

create policy notifications_select on public.notifications for select using (user_id = auth.uid());
create policy notifications_update on public.notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy user_preferences_all on public.user_preferences for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Droits de table : RLS filtre ensuite les lignes.
revoke all on all tables in schema public from anon, authenticated;
grant usage on schema public to anon, authenticated, service_role;
grant select on public.water_points, public.water_point_sources, public.water_point_photos,
  public.import_sources to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant update on public.water_points to authenticated;
grant select on public.water_point_reports, public.water_point_revisions, public.import_runs,
  public.moderation_actions to authenticated;
grant select, insert, delete on public.favorites to authenticated;
grant select, update on public.notifications to authenticated;
grant select, insert, update on public.user_preferences to authenticated;
grant all on all tables in schema public to service_role;

-- Seules quelques colonnes de profil sont modifiables par l'utilisateur.
revoke update on public.profiles from authenticated;
grant update (display_name) on public.profiles to authenticated;
revoke update on public.notifications from authenticated;
grant update (read_at) on public.notifications to authenticated;
