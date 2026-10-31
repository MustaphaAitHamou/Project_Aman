import Link from 'next/link';

import { requireStaff } from '@/lib/auth';
import { formatDate, label, RUN_STATUS_LABELS } from '@/lib/labels';

interface Stats {
  points_published: number;
  points_pending: number;
  points_certified: number;
  points_out_of_order: number;
  reports_pending: number;
  revisions_pending: number;
  photos_pending: number;
  users: number;
  by_source: Record<string, number>;
  last_import_runs: Record<string, unknown>[];
}

export default async function DashboardPage() {
  const { supabase } = await requireStaff();
  const { data, error } = await supabase.rpc('admin_stats');
  if (error || !data)
    return <div className="alert">Statistiques indisponibles : {error?.message}</div>;
  const stats = data as Stats;
  const toModerate =
    stats.points_pending + stats.reports_pending + stats.revisions_pending + stats.photos_pending;

  const cards: [string, number][] = [
    ['Points publiés', stats.points_published],
    ['Potabilité certifiée', stats.points_certified],
    ['Hors service', stats.points_out_of_order],
    ['Utilisateurs', stats.users],
    ['Points en attente', stats.points_pending],
    ['Signalements en attente', stats.reports_pending],
    ['Modifications en attente', stats.revisions_pending],
    ['Photos en attente', stats.photos_pending],
  ];

  return (
    <div className="stack">
      <h1>Tableau de bord</h1>
      {toModerate > 0 ? (
        <p>
          <Link href="/moderation">{toModerate} élément(s) à modérer →</Link>
        </p>
      ) : null}
      <div className="cards">
        {cards.map(([title, value]) => (
          <div className="card" key={title}>
            <div className="muted">{title}</div>
            <div className="stat">{value.toLocaleString('fr-FR')}</div>
          </div>
        ))}
      </div>
      <h2>Points publiés par source</h2>
      <div className="cards">
        {Object.entries(stats.by_source).map(([source, count]) => (
          <div className="card" key={source}>
            <div className="muted">{source}</div>
            <div className="stat">{count.toLocaleString('fr-FR')}</div>
          </div>
        ))}
      </div>
      <h2>Derniers imports</h2>
      <table>
        <thead>
          <tr>
            <th>Source</th>
            <th>Statut</th>
            <th>Début</th>
            <th>Ajoutés</th>
            <th>Mis à jour</th>
            <th>Inchangés</th>
            <th>Rejetés</th>
          </tr>
        </thead>
        <tbody>
          {stats.last_import_runs.map((run, index) => (
            <tr key={index}>
              <td>{String(run.source)}</td>
              <td>{label(RUN_STATUS_LABELS, run.status)}</td>
              <td>{formatDate(run.started_at)}</td>
              <td>{String(run.inserted_count)}</td>
              <td>{String(run.updated_count)}</td>
              <td>{String(run.unchanged_count)}</td>
              <td>{String(run.rejected_count)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
