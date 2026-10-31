/* eslint-disable @next/next/no-img-element -- URL signées temporaires, pas d'optimisation. */
import { requireStaff } from '@/lib/auth';
import {
  describeChanges,
  formatDate,
  formatValue,
  KIND_LABELS,
  label,
  osmLink,
  POTABILITY_LABELS,
  REPORT_EFFECTS,
  REPORT_LABELS,
} from '@/lib/labels';

import { DecisionForm } from './DecisionForm';

type Row = Record<string, unknown>;
interface Queue {
  points: Row[];
  reports: Row[];
  revisions: Row[];
  photos: Row[];
}

export default async function ModerationPage() {
  const { supabase } = await requireStaff();
  const { data, error } = await supabase.rpc('moderation_queue', { max_rows: 50 });
  if (error || !data) return <div className="alert">File indisponible : {error?.message}</div>;
  const queue = data as Queue;
  const photoPaths = queue.photos.map((p) => String(p.storage_path));
  const signed = photoPaths.length
    ? (await supabase.storage.from('water-point-photos').createSignedUrls(photoPaths, 600)).data
    : [];
  const photoUrl = (path: string) => signed?.find((s) => s.path === path)?.signedUrl;

  return (
    <div className="stack">
      <h1>Modération</h1>
      <p className="muted">
        Rappel : une contribution ne certifie jamais la potabilité. Seule une source officielle
        datée (import) peut le faire.
      </p>

      <h2>Nouveaux points ({queue.points.length})</h2>
      {queue.points.length === 0 ? <p className="muted">Rien en attente.</p> : null}
      {queue.points.map((p) => (
        <div className="card stack" key={String(p.id)}>
          <div className="row">
            <strong>{String(p.name ?? label(KIND_LABELS, p.kind))}</strong>
            <span className="badge">{label(KIND_LABELS, p.kind)}</span>
            {Number(p.nearby_count) > 0 ? (
              <span className="badge warning">
                {String(p.nearby_count)} point(s) publié(s) à moins de 30 m
              </span>
            ) : null}
          </div>
          <div className="muted">
            Par {String(p.author ?? 'anonyme')} · {formatDate(p.created_at)} · potabilité déclarée :{' '}
            {label(POTABILITY_LABELS, p.potability)} · gratuit : {formatValue(p.is_free)} · PMR :{' '}
            {formatValue(p.wheelchair_accessible)}
          </div>
          {p.comment ? <blockquote>{String(p.comment)}</blockquote> : null}
          <a
            href={osmLink(Number(p.latitude), Number(p.longitude))}
            target="_blank"
            rel="noreferrer"
          >
            Vérifier l’emplacement ({Number(p.latitude).toFixed(6)},{' '}
            {Number(p.longitude).toFixed(6)})
          </a>
          <DecisionForm target="water_point" id={String(p.id)} />
        </div>
      ))}

      <h2>Signalements ({queue.reports.length})</h2>
      {queue.reports.length === 0 ? <p className="muted">Rien en attente.</p> : null}
      {queue.reports.map((r) => (
        <div className="card stack" key={String(r.id)}>
          <div className="row">
            <strong>{label(REPORT_LABELS, r.type)}</strong>
            <span className="muted">sur « {String(r.point_name)} »</span>
          </div>
          <div className="muted">
            Par {String(r.author ?? 'anonyme')} · {formatDate(r.created_at)}
          </div>
          {r.comment ? <blockquote>{String(r.comment)}</blockquote> : null}
          <div className="muted">Si validé : {REPORT_EFFECTS[String(r.type)] ?? '—'}</div>
          <DecisionForm target="report" id={String(r.id)} />
        </div>
      ))}

      <h2>Modifications ({queue.revisions.length})</h2>
      {queue.revisions.length === 0 ? <p className="muted">Rien en attente.</p> : null}
      {queue.revisions.map((v) => (
        <div className="card stack" key={String(v.id)}>
          <strong>« {String(v.point_name)} »</strong>
          <div className="muted">
            Par {String(v.author ?? 'anonyme')} · {formatDate(v.created_at)}
          </div>
          <table>
            <thead>
              <tr>
                <th>Champ</th>
                <th>Actuel</th>
                <th>Proposé</th>
              </tr>
            </thead>
            <tbody>
              {describeChanges(v.changes as Row, v.current as Row).map((c) => (
                <tr key={c.field}>
                  <td>{c.field}</td>
                  <td>{c.before}</td>
                  <td>{c.after}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {v.comment ? <blockquote>{String(v.comment)}</blockquote> : null}
          <DecisionForm target="revision" id={String(v.id)} />
        </div>
      ))}

      <h2>Photos ({queue.photos.length})</h2>
      {queue.photos.length === 0 ? <p className="muted">Rien en attente.</p> : null}
      <div className="cards">
        {queue.photos.map((ph) => {
          const url = photoUrl(String(ph.storage_path));
          return (
            <div className="card stack" key={String(ph.id)}>
              {url ? (
                <img src={url} alt={`Photo proposée pour ${String(ph.point_name)}`} width="100%" />
              ) : (
                <span className="muted">Aperçu indisponible</span>
              )}
              <span className="muted">
                « {String(ph.point_name)} » · {formatDate(ph.created_at)}
              </span>
              <DecisionForm target="photo" id={String(ph.id)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
