import { requireStaff } from '@/lib/auth';
import { formatDate, label, RUN_STATUS_LABELS } from '@/lib/labels';

interface Run {
  id: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  fetched_count: number;
  inserted_count: number;
  updated_count: number;
  unchanged_count: number;
  merged_count: number;
  rejected_count: number;
  error_log: unknown[];
  import_sources: { key: string; name: string; license: string | null } | null;
}

const TONE: Record<string, string> = { succeeded: 'success', partial: 'warning', failed: 'danger' };

export default async function ImportsPage() {
  const { supabase } = await requireStaff();
  const { data, error } = await supabase
    .from('import_runs')
    .select('*, import_sources(key, name, license)')
    .order('started_at', { ascending: false })
    .limit(50);
  if (error) return <div className="alert">Historique indisponible : {error.message}</div>;
  const runs = (data ?? []) as Run[];

  return (
    <div className="stack">
      <h1>Imports de données</h1>
      <p className="muted">
        Les imports sont lancés par le workflow GitHub « ETL » (hebdomadaire ou manuel) ou en local
        avec <code>npm run etl --workspace @water-finder/importers -- import &lt;source&gt;</code>.
        Ils ne suppriment jamais de point.
      </p>
      {runs.length === 0 ? <p className="muted">Aucun import enregistré.</p> : null}
      {runs.map((run) => (
        <details className="card" key={run.id}>
          <summary className="row">
            <strong>{run.import_sources?.name ?? '?'}</strong>
            <span className={`badge ${TONE[run.status] ?? ''}`}>
              {label(RUN_STATUS_LABELS, run.status)}
            </span>
            <span className="muted">
              {formatDate(run.started_at)} · reçus {run.fetched_count} · ajoutés{' '}
              {run.inserted_count} · mis à jour {run.updated_count} · inchangés{' '}
              {run.unchanged_count} · rattachés {run.merged_count} · rejetés {run.rejected_count}
            </span>
          </summary>
          <p className="muted">
            Source : {run.import_sources?.key} · licence : {run.import_sources?.license ?? '—'} ·
            fin : {formatDate(run.finished_at)}
          </p>
          {run.error_log.length > 0 ? (
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>
              {JSON.stringify(run.error_log.slice(0, 100), null, 2)}
            </pre>
          ) : (
            <p className="muted">Aucune erreur.</p>
          )}
        </details>
      ))}
    </div>
  );
}
