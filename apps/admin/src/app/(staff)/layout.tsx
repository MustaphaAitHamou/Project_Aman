import Link from 'next/link';
import type { ReactNode } from 'react';

import { requireStaff } from '@/lib/auth';

import { signOutAction } from '../login/actions';

export const dynamic = 'force-dynamic';

export default async function StaffLayout({ children }: { children: ReactNode }) {
  const { user, role } = await requireStaff();
  return (
    <div className="shell">
      <nav className="nav" aria-label="Navigation principale">
        <div className="brand">Water Finder</div>
        <Link href="/">Tableau de bord</Link>
        <Link href="/moderation">Modération</Link>
        <Link href="/duplicates">Doublons</Link>
        <Link href="/points">Points d’eau</Link>
        <Link href="/imports">Imports</Link>
        {role === 'admin' ? <Link href="/users">Utilisateurs</Link> : null}
        <div style={{ flex: 1 }} />
        <span className="muted" style={{ padding: '0 12px' }}>
          {user.email} · {role === 'admin' ? 'administrateur' : 'modérateur'}
        </span>
        <form action={signOutAction} style={{ padding: '8px 12px' }}>
          <button type="submit">Se déconnecter</button>
        </form>
      </nav>
      <main>{children}</main>
    </div>
  );
}
