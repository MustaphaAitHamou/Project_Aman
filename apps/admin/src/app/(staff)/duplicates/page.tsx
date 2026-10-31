import Link from 'next/link';

import { requireStaff } from '@/lib/auth';
import { KIND_LABELS, label } from '@/lib/labels';

import { mergeAction } from './actions';

interface Candidate {
  point_a: string;
  point_b: string;
  distance_meters: number;
  kind_a: string;
  kind_b: string;
}

export default async function DuplicatesPage({
  searchParams,
}: {
  searchParams: Promise<{ distance?: string }>;
}) {
  const { supabase } = await requireStaff();
  const { distance } = await searchParams;
  const maxDistance = Math.min(Math.max(Number(distance) || 10, 1), 50);
  const { data, error } = await supabase.rpc('duplicate_candidates', {
    max_distance: maxDistance,
    max_rows: 200,
  });
  if (error) return <div className="alert">Recherche impossible : {error.message}</div>;
  const candidates = (data ?? []) as Candidate[];

  return (
    <div className="stack">
      <h1>Doublons probables</h1>
      <form className="row">
        <label>
          Distance maximale (m){' '}
          <input name="distance" type="number" min={1} max={50} defaultValue={maxDistance} />
        </label>
        <button type="submit">Rechercher</button>
      </form>
      <p className="muted">
        Points publiés distants de moins de {maxDistance} m. Vérifiez chaque paire avant de
        fusionner : deux robinets proches peuvent être distincts.
      </p>
      <table>
        <thead>
          <tr>
            <th>Point A</th>
            <th>Point B</th>
            <th>Distance</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((c) => (
            <tr key={`${c.point_a}-${c.point_b}`}>
              <td>
                <Link href={`/points?search=${c.point_a}`}>{label(KIND_LABELS, c.kind_a)}</Link>
                <div className="muted">{c.point_a.slice(0, 8)}</div>
              </td>
              <td>
                <Link href={`/points?search=${c.point_b}`}>{label(KIND_LABELS, c.kind_b)}</Link>
                <div className="muted">{c.point_b.slice(0, 8)}</div>
              </td>
              <td>{c.distance_meters.toFixed(1)} m</td>
              <td>
                <form action={mergeAction} className="row">
                  <input type="hidden" name="duplicate" value={c.point_b} />
                  <input type="hidden" name="target" value={c.point_a} />
                  <button type="submit">Fusionner B dans A</button>
                </form>
              </td>
            </tr>
          ))}
          {candidates.length === 0 ? (
            <tr>
              <td colSpan={4} className="muted">
                Aucun doublon probable.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
