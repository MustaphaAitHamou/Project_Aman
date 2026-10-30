-- Stockage des photos (Supabase Storage). Ignoré si le schéma `storage` n'existe pas
-- (tests locaux sur PostgreSQL nu).
do $do$
begin
  if not exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    raise notice 'Schéma storage absent : politiques de stockage ignorées.';
    return;
  end if;

  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('water-point-photos', 'water-point-photos', false, 6291456,
    array['image/jpeg', 'image/webp'])
  on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

  -- Dépôt : uniquement dans son propre dossier `<uid>/…`.
  execute $p$
    create policy photos_upload_own_folder on storage.objects for insert to authenticated
    with check (bucket_id = 'water-point-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  $p$;
  -- Lecture : photos approuvées (tous), ses propres photos, modérateurs.
  execute $p$
    create policy photos_read on storage.objects for select to anon, authenticated
    using (bucket_id = 'water-point-photos' and (
      exists (select 1 from public.water_point_photos p
              where p.storage_path = name and p.review_status = 'approved')
      or (storage.foldername(name))[1] = auth.uid()::text
      or public.is_moderator()
    ))
  $p$;
  execute $p$
    create policy photos_delete on storage.objects for delete to authenticated
    using (bucket_id = 'water-point-photos' and (
      (storage.foldername(name))[1] = auth.uid()::text or public.is_moderator()
    ))
  $p$;
end
$do$;
