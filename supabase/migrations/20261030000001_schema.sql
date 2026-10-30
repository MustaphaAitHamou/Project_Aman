-- Water Finder — schéma principal (phase 2).
-- Miroir du modèle de domaine de packages/core : potabilité, fonctionnement et disponibilité
-- sont trois colonnes distinctes, jamais confondues.

create extension if not exists postgis with schema extensions;
create extension if not exists pgcrypto with schema extensions;

-- ── Énumérations ────────────────────────────────────────────────────────────
create type public.water_point_kind as enum (
  'drinking_fountain', 'water_tap', 'bottle_refill_station', 'spring', 'well_pump',
  'decorative_fountain', 'other'
);
create type public.potability_status as enum (
  'certified_potable', 'declared_potable', 'not_potable', 'unknown'
);
create type public.operational_status as enum ('working', 'out_of_order', 'unknown');
create type public.availability_status as enum (
  'available', 'seasonal_closure', 'restricted_access', 'removed', 'unknown'
);
create type public.water_type as enum ('still', 'sparkling', 'still_and_sparkling', 'unknown');
create type public.source_category as enum ('official', 'openstreetmap', 'community');
create type public.evidence_kind as enum (
  'official_dataset', 'sanitary_control', 'osm_tag', 'community_report'
);
create type public.user_role as enum ('user', 'moderator', 'admin');
create type public.review_status as enum ('pending', 'approved', 'rejected');
create type public.publication_status as enum ('published', 'pending', 'rejected', 'merged');
create type public.report_type as enum (
  'broken', 'fixed', 'not_existing', 'potability_potable', 'potability_not_potable', 'other'
);
create type public.import_run_status as enum ('running', 'succeeded', 'partial', 'failed');

-- ── Utilitaire : horodatage de mise à jour ─────────────────────────────────
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ── Profils ──────────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) between 2 and 40),
  role public.user_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Création automatique du profil à l'inscription (rôle toujours « user »).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(left(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), 40), '')
  )
  on conflict (id) do nothing;
  insert into public.user_preferences (user_id) values (new.id) on conflict do nothing;
  return new;
end $$;

-- ── Sources d'import ─────────────────────────────────────────────────────────
create table public.import_sources (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z0-9][a-z0-9-]{1,62}$'),
  name text not null,
  category public.source_category not null,
  country_code char(2) not null default 'FR',
  url text,
  license text,
  attribution text,
  format text,
  enabled boolean not null default false,
  verified_at timestamptz,
  last_success_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger import_sources_touch before update on public.import_sources
  for each row execute function public.touch_updated_at();

-- ── Points d'eau ─────────────────────────────────────────────────────────────
create table public.water_points (
  id uuid primary key default gen_random_uuid(),
  kind public.water_point_kind not null,
  name text check (name is null or char_length(name) <= 120),
  location extensions.geography(Point, 4326) not null,
  address text check (address is null or char_length(address) <= 240),
  city text check (city is null or char_length(city) <= 120),
  country_code char(2) not null default 'FR' check (country_code ~ '^[A-Z]{2}$'),
  potability public.potability_status not null default 'unknown',
  potability_evidence_kind public.evidence_kind,
  potability_evidence_source text,
  potability_evidence_url text,
  potability_evidence_at date,
  operational_status public.operational_status not null default 'unknown',
  operational_status_at timestamptz,
  availability public.availability_status not null default 'unknown',
  water_type public.water_type not null default 'unknown',
  is_free boolean,
  wheelchair_accessible boolean,
  opening_hours text check (opening_hours is null or char_length(opening_hours) <= 255),
  last_verified_at timestamptz,
  primary_source_category public.source_category not null,
  publication_status public.publication_status not null default 'published',
  merged_into_id uuid references public.water_points (id),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Règle centrale (miroir de normalizePotability) : une potabilité certifiée exige une
  -- preuve officielle ou sanitaire, datée et sourcée.
  constraint certified_potability_requires_evidence check (
    potability <> 'certified_potable'
    or (
      potability_evidence_kind in ('official_dataset', 'sanitary_control')
      and potability_evidence_at is not null
      and potability_evidence_source is not null
    )
  ),
  constraint merged_points_have_target check (
    (publication_status = 'merged') = (merged_into_id is not null)
  )
);
create index water_points_location_idx on public.water_points using gist (location);
create index water_points_visible_idx on public.water_points using gist (location)
  where publication_status = 'published' and availability <> 'removed';
create index water_points_status_idx on public.water_points (publication_status);
create index water_points_created_by_idx on public.water_points (created_by);
create trigger water_points_touch before update on public.water_points
  for each row execute function public.touch_updated_at();

-- ── Provenances (un point peut venir de plusieurs sources) ───────────────────
create table public.water_point_sources (
  id uuid primary key default gen_random_uuid(),
  water_point_id uuid not null references public.water_points (id) on delete cascade,
  import_source_id uuid not null references public.import_sources (id),
  external_id text not null,
  url text,
  license text,
  raw jsonb not null default '{}'::jsonb,
  content_hash text not null,
  fetched_at timestamptz not null default now(),
  last_seen_run_id uuid,
  created_at timestamptz not null default now(),
  unique (import_source_id, external_id)
);
create index water_point_sources_point_idx on public.water_point_sources (water_point_id);

-- ── Photos ───────────────────────────────────────────────────────────────────
create table public.water_point_photos (
  id uuid primary key default gen_random_uuid(),
  water_point_id uuid not null references public.water_points (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  storage_path text not null unique,
  width integer check (width is null or width between 1 and 10000),
  height integer check (height is null or height between 1 and 10000),
  review_status public.review_status not null default 'pending',
  created_at timestamptz not null default now()
);
create index water_point_photos_point_idx on public.water_point_photos (water_point_id, review_status);

-- ── Signalements ─────────────────────────────────────────────────────────────
create table public.water_point_reports (
  id uuid primary key default gen_random_uuid(),
  water_point_id uuid not null references public.water_points (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  type public.report_type not null,
  comment text check (comment is null or char_length(comment) <= 500),
  review_status public.review_status not null default 'pending',
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create index water_point_reports_point_idx on public.water_point_reports (water_point_id, created_at desc);
create index water_point_reports_user_idx on public.water_point_reports (user_id, created_at desc);
create index water_point_reports_pending_idx on public.water_point_reports (created_at)
  where review_status = 'pending';

-- ── Propositions de modification ─────────────────────────────────────────────
create table public.water_point_revisions (
  id uuid primary key default gen_random_uuid(),
  water_point_id uuid not null references public.water_points (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  changes jsonb not null check (jsonb_typeof(changes) = 'object' and changes <> '{}'::jsonb),
  previous jsonb,
  comment text check (comment is null or char_length(comment) <= 500),
  review_status public.review_status not null default 'pending',
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index water_point_revisions_point_idx on public.water_point_revisions (water_point_id, created_at desc);
create index water_point_revisions_user_idx on public.water_point_revisions (user_id, created_at desc);

-- ── Favoris ──────────────────────────────────────────────────────────────────
create table public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  water_point_id uuid not null references public.water_points (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, water_point_id)
);

-- ── Imports ──────────────────────────────────────────────────────────────────
create table public.import_runs (
  id uuid primary key default gen_random_uuid(),
  import_source_id uuid not null references public.import_sources (id),
  status public.import_run_status not null default 'running',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  fetched_count integer not null default 0,
  inserted_count integer not null default 0,
  updated_count integer not null default 0,
  unchanged_count integer not null default 0,
  merged_count integer not null default 0,
  rejected_count integer not null default 0,
  error_log jsonb not null default '[]'::jsonb
);
create index import_runs_source_idx on public.import_runs (import_source_id, started_at desc);

-- ── Modération ───────────────────────────────────────────────────────────────
create table public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  moderator_id uuid references public.profiles (id) on delete set null,
  target_type text not null check (target_type in ('water_point', 'report', 'revision', 'photo', 'profile')),
  target_id uuid not null,
  action text not null,
  reason text check (reason is null or char_length(reason) <= 500),
  created_at timestamptz not null default now()
);
create index moderation_actions_target_idx on public.moderation_actions (target_type, target_id);

-- ── Notifications ────────────────────────────────────────────────────────────
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

-- ── Préférences synchronisées ────────────────────────────────────────────────
create table public.user_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  language text not null default 'fr' check (language in ('fr', 'en')),
  distance_unit text not null default 'metric' check (distance_unit in ('metric', 'imperial')),
  notify_contribution_updates boolean not null default true,
  notify_favorite_updates boolean not null default true,
  updated_at timestamptz not null default now()
);
create trigger user_preferences_touch before update on public.user_preferences
  for each row execute function public.touch_updated_at();

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
