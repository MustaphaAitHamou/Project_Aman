import { normalizeKey } from '../normalize';
import { transformRows } from '../tabular';
import type { Connector, SourceInfo, TransformResult } from '../types';

/**
 * Connecteur générique pour les portails Opendatasoft (API Explore v2.1), utilisés par de
 * nombreuses collectivités (Paris, métropoles…). Chaque jeu est déclaré dans `OPENDATASOFT_SOURCES`
 * avec son portail et son identifiant ; aucun n'est importé tant qu'il n'est pas vérifié.
 */
export interface OpendatasoftSource extends SourceInfo {
  portal: string;
  datasetId: string;
  /** Champs dont la présence est exigée : sinon l'import échoue explicitement. */
  requiredFields: string[];
  datasetIsDrinkingFountains: boolean;
}

export const OPENDATASOFT_SOURCES: OpendatasoftSource[] = [
  {
    key: 'paris-fontaines-a-boire',
    name: 'Ville de Paris — Fontaines à boire',
    category: 'official',
    countryCode: 'FR',
    portal: 'https://opendata.paris.fr',
    datasetId: 'fontaines-a-boire',
    url: 'https://opendata.paris.fr/explore/dataset/fontaines-a-boire/',
    license: 'ODbL-1.0 (à confirmer sur la fiche du jeu)',
    attribution: 'Ville de Paris / Eau de Paris',
    format: 'Opendatasoft JSON',
    requiredFields: ['geo_point_2d'],
    datasetIsDrinkingFountains: true,
    verified: false,
    description:
      'Fontaines à boire de Paris, avec disponibilité (identifiant et champs à vérifier).',
  },
];

interface DatasetMeta {
  metas?: { default?: { modified?: string; title?: string; license?: string } };
}

export function createOpendatasoftConnector(source: OpendatasoftSource): Connector {
  const base = `${source.portal}/api/explore/v2.1/catalog/datasets/${source.datasetId}`;
  return {
    info: source,
    async run({ http, log }): Promise<TransformResult> {
      const meta = await http.getJson<DatasetMeta>(base);
      const modified = meta.metas?.default?.modified ?? null;
      log(
        `Jeu « ${meta.metas?.default?.title ?? source.datasetId} », licence ${meta.metas?.default?.license ?? '?'}, mis à jour ${modified ?? '?'}`,
      );
      const rows = await http.getJson<Record<string, unknown>[]>(`${base}/exports/json`);
      if (!Array.isArray(rows))
        throw new Error('Export Opendatasoft inattendu (tableau JSON attendu)');
      const columns = new Set(Object.keys(rows[0] ?? {}).map(normalizeKey));
      const missing = source.requiredFields.filter((field) => !columns.has(normalizeKey(field)));
      if (rows.length && missing.length) {
        throw new Error(
          `Champs requis absents (${missing.join(', ')}) : structure du jeu modifiée, import annulé.`,
        );
      }
      const result = transformRows(rows, {
        sourceName: source.name,
        sourceUrl: source.url,
        license: meta.metas?.default?.license ?? source.license,
        datasetModifiedAt: modified,
        datasetIsDrinkingFountains: source.datasetIsDrinkingFountains,
        idPrefix: `${source.datasetId}:`,
      });
      result.notes.unshift(`${rows.length} lignes reçues`);
      return result;
    },
  };
}
