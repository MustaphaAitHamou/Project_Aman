// Génère les types des routes Expo Router (.expo/types/router.d.ts) avant le typecheck.
// Ces types ne sont produits que par le serveur de développement : on le démarre hors ligne,
// on attend le fichier, puis on l'arrête. Option `--force` : régénère même si le fichier existe.
import { spawn } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const typesFile = path.join(appDir, '.expo', 'types', 'router.d.ts');
const force = process.argv.includes('--force');

if (existsSync(typesFile) && !force) {
  console.log('✓ types de routes déjà présents');
  process.exit(0);
}
if (force) rmSync(typesFile, { force: true });

const child = spawn('npx', ['expo', 'start', '--offline', '--port', '8099'], {
  cwd: appDir,
  env: { ...process.env, CI: '1', EXPO_OFFLINE: '1' },
  stdio: 'ignore',
  detached: true,
});

const deadline = Date.now() + 90_000;
const timer = setInterval(() => {
  const done = existsSync(typesFile);
  if (done || Date.now() > deadline) {
    clearInterval(timer);
    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch {
      // Processus déjà terminé.
    }
    if (done) {
      console.log('✓ .expo/types/router.d.ts généré');
      process.exit(0);
    }
    console.error('✗ délai dépassé : types de routes non générés');
    process.exit(1);
  }
}, 500);
