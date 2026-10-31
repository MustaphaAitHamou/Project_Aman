import { requireStaff } from '@/lib/auth';
import {
  formatDate,
  KIND_LABELS,
  label,
  OPERATIONAL_LABELS,
  osmLink,
  POTABILITY_LABELS,
  PUBLICATION_LABELS,
} from '@/lib/labels';

import { PointsMap } from './PointsMap';

interface PointRow {
  id: string;
  name: string | null;
  kind: string;
  city: string | null;
  latitude: number;
  longitude: number;
  publication_status: string;
  potability: string;
  operational_status: string;
  primary_source_category: string;
  updated_at: string;
}

const STATUSES = ['published', 'pending', 'rejected', 'merged'] as const;

export default async function PointsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const { supabase } = await requireStaff();
  const { search = '', status = '' } = await searchParams;
  const validStatus = STATUSES.find((s) => s === status) ?? null;
  const { data, error } = await supabase.rpc('admin_search_points', {
    search: search.trim() || null,
    status: validStatus,
    max_rows: 300,
  });
  if (error) return <div className="alert">Recherche impossible : {error.message}</div>;
  const points = (data ?? []) as PointRow[];

  return (
    <div className="stack">
      <h1>Points d’eau</h1>
      <form className="row">
        <input name="search" defaultValue={search} placeholder="Nom, commune ou identifiant" />
        <select name="status" defaultValue={validStatus ?? ''} aria-label="Statut">
          <option value="">Tous les statuts</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {PUBLICATION_LABELS[s]}
            </option>
          ))}
        </select>
        <button type="submit">Rechercher</button>
      </form>
      <PointsMap
        points={points.map((p) => ({
          id: p.id,
          name: p.name ?? label(KIND_LABELS, p.kind),
          latitude: p.latitude,
          longitude: p.longitude,
          status: p.publication_status,
        }))}
      />
      <p className="muted">{points.length} résultat(s) (300 au maximum).</p>
      <table>
        <thead>
          <tr>
            <th>Nom</th>
            <th>Commune</th>
            <th>Statut</th>
            <th>Potabilité</th>
            <th>Fonctionnement</th>
            <th>Source</th>
            <th>Mis à jour</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.id}>
              <td>
                <a href={osmLink(p.latitude, p.longitude)} target="_blank" rel="noreferrer">
                  {p.name ?? label(KIND_LABELS, p.kind)}
                </a>
                <div className="muted">{p.id.slice(0, 8)}</div>
              </td>
              <td>{p.city ?? '—'}</td>
              <td>{label(PUBLICATION_LABELS, p.publication_status)}</td>
              <td>{label(POTABILITY_LABELS, p.potability)}</td>
              <td>{label(OPERATIONAL_LABELS, p.operational_status)}</td>
              <td>{p.primary_source_category}</td>
              <td>{formatDate(p.updated_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
