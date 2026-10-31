import { signInAction } from './actions';

const ERRORS: Record<string, string> = {
  credentials: 'Adresse e-mail ou mot de passe incorrect.',
  forbidden: 'Accès réservé aux modérateurs et administrateurs.',
  config:
    'Supabase n’est pas configuré : renseignez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY (voir apps/admin/.env.example).',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main style={{ maxWidth: 420, margin: '10vh auto' }}>
      <div className="card stack">
        <h1 style={{ margin: 0 }}>Water Finder — Administration</h1>
        <p className="muted">Connexion avec un compte modérateur.</p>
        {error && ERRORS[error] ? <div className="alert">{ERRORS[error]}</div> : null}
        <form action={signInAction} className="stack">
          <label className="stack" style={{ gap: 4 }}>
            Adresse e-mail
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label className="stack" style={{ gap: 4 }}>
            Mot de passe
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          <button className="primary" type="submit">
            Se connecter
          </button>
        </form>
      </div>
    </main>
  );
}
