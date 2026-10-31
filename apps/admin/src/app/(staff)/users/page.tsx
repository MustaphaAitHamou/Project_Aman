import { requireStaff } from '@/lib/auth';
import { formatDate } from '@/lib/labels';

import { setRoleAction } from './actions';

interface Profile {
  id: string;
  display_name: string | null;
  role: string;
  created_at: string;
}

/** Gestion des rôles (administrateurs uniquement). Les e-mails ne sont pas exposés ici. */
export default async function UsersPage() {
  const { supabase, user } = await requireStaff('admin');
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, role, created_at')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) return <div className="alert">Liste indisponible : {error.message}</div>;
  const profiles = (data ?? []) as Profile[];

  return (
    <div className="stack">
      <h1>Utilisateurs</h1>
      <table>
        <thead>
          <tr>
            <th>Pseudonyme</th>
            <th>Inscription</th>
            <th>Rôle</th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((p) => (
            <tr key={p.id}>
              <td>
                {p.display_name ?? '—'}
                <div className="muted">{p.id.slice(0, 8)}</div>
              </td>
              <td>{formatDate(p.created_at)}</td>
              <td>
                {p.id === user.id ? (
                  <span>{p.role} (vous)</span>
                ) : (
                  <form action={setRoleAction} className="row">
                    <input type="hidden" name="user" value={p.id} />
                    <select name="role" defaultValue={p.role} aria-label="Rôle">
                      <option value="user">Utilisateur</option>
                      <option value="moderator">Modérateur</option>
                      <option value="admin">Administrateur</option>
                    </select>
                    <button type="submit">Enregistrer</button>
                  </form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
