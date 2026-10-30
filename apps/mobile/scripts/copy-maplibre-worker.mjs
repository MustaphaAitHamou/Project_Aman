// Copie le worker de maplibre-gl dans `public/` pour la version web.
// maplibre-gl 6 localise son worker via `import.meta.url`, non fiable une fois bundlé par Metro :
// on le sert donc comme fichier statique (même version que la bibliothèque installée).
import { copyFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const require = createRequire(path.join(appDir, 'package.json'));
const packageDir = path.dirname(require.resolve('maplibre-gl/package.json'));

const source = path.join(packageDir, 'dist', 'maplibre-gl-worker.mjs');
const targetDir = path.join(appDir, 'public');
await mkdir(targetDir, { recursive: true });
await copyFile(source, path.join(targetDir, 'maplibre-gl-worker.mjs'));
console.log('✓ public/maplibre-gl-worker.mjs');
