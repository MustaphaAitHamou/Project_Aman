/* eslint-disable no-console */
import pg from 'pg';

import { searchDatasets } from './connectors/datagouv';
import { createHttpClient } from './http';
import { loadRecords, recordFailedRun } from './load';
import { createConnectors } from './sources';

const USAGE = `Imports Water Finder

  npm run etl -- list                         Sources disponibles et état de vérification
  npm run etl -- discover [mots-clés]         Cherche des jeux sur data.gouv.fr (défaut : fontaines à boire)
  npm run etl -- import <clé…|all> [options]  Importe une ou plusieurs sources

Options d'import :
  --dry-run              Télécharge et transforme sans écrire en base
  --bbox=O,S,E,N         Limite l'import à une emprise (ex. Paris : 2.22,48.81,2.47,48.91)
  --allow-unverified     Autorise une source dont la vérification n'est pas faite

Base de données : SUPABASE_DB_URL (ou DATABASE_URL), connexion serveur uniquement.`;

function option(args: string[], name: string): string | undefined {
  return args.find((arg) => arg.startsWith(`--${name}=`))?.split('=')[1];
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  const http = createHttpClient();
  const connectors = createConnectors();

  if (!command || command === 'help') {
    console.log(USAGE);
    return;
  }

  if (command === 'list') {
    for (const { info } of connectors) {
      console.log(
        `${info.verified ? '✓' : '⚠'} ${info.key.padEnd(28)} ${info.name} [${info.license}]`,
      );
    }
    console.log(
      '\n⚠ = à vérifier (licence, champs, conditions) avant import : voir DATA_SOURCES.md',
    );
    return;
  }

  if (command === 'discover') {
    const query = args.join(' ') || 'fontaines à boire';
    const datasets = await searchDatasets(http, { query, maxPages: 2 });
    for (const d of datasets) {
      console.log(
        `\n• ${d.title} — ${d.organization?.name ?? '?'}\n  ${d.page}\n  licence : ${d.license} · mis à jour : ${d.last_modified?.slice(0, 10)}`,
      );
      for (const r of d.resources.slice(0, 5)) {
        console.log(
          `    - [${r.format}] ${r.title}${r.schema?.name ? ` (schéma ${r.schema.name})` : ''}`,
        );
      }
    }
    console.log(`\n${datasets.length} jeu(x) trouvé(s) pour « ${query} ».`);
    return;
  }

  if (command === 'import') {
    const keys = args.filter((arg) => !arg.startsWith('--'));
    const dryRun = args.includes('--dry-run');
    const allowUnverified = args.includes('--allow-unverified');
    const bboxText = option(args, 'bbox');
    const bbox = bboxText
      ? (bboxText.split(',').map(Number) as [number, number, number, number])
      : undefined;
    if (bbox && (bbox.length !== 4 || bbox.some((n) => !Number.isFinite(n))))
      throw new Error('--bbox invalide');

    const selected = connectors.filter((c) => keys.includes('all') || keys.includes(c.info.key));
    if (!selected.length) throw new Error(`Aucune source correspondante. ${USAGE}`);

    const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
    if (!dryRun && !dbUrl) throw new Error('SUPABASE_DB_URL manquant (ou utilisez --dry-run).');
    const client = dryRun ? null : new pg.Client({ connectionString: dbUrl });
    await client?.connect();

    let failures = 0;
    try {
      for (const connector of selected) {
        const { info } = connector;
        if (!info.verified && !allowUnverified) {
          console.log(
            `⚠ ${info.key} ignorée : source non vérifiée (--allow-unverified pour forcer).`,
          );
          continue;
        }
        console.log(`\n▶ ${info.name}`);
        try {
          const result = await connector.run({ http, log: (m) => console.log(`  ${m}`), bbox });
          result.notes.forEach((note) => console.log(`  · ${note}`));
          console.log(
            `  ${result.records.length} points valides, ${result.rejections.length} rejetés`,
          );
          if (client) {
            const stats = await loadRecords(
              client,
              info,
              result.records,
              result.rejections,
              result.notes,
            );
            console.log(
              `  ✓ ${stats.status} : ${stats.inserted} ajoutés, ${stats.updated} mis à jour, ${stats.merged} rattachés à un point existant, ${stats.unchanged} inchangés, ${stats.rejected} rejetés`,
            );
          }
        } catch (error) {
          // Une source en échec est journalisée ; les autres continuent.
          failures += 1;
          console.error(`  ✗ ${info.key} : ${String(error)}`);
          if (client) await recordFailedRun(client, info, error).catch(() => undefined);
        }
      }
    } finally {
      await client?.end();
    }
    if (failures) process.exitCode = 1;
    return;
  }

  console.log(USAGE);
  process.exitCode = 1;
}

main().catch((error) => {
  console.error(String(error));
  process.exitCode = 1;
});
