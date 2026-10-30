import { parseTabular, transformRows } from '../tabular';
import type {
  Connector,
  ConnectorContext,
  HttpClient,
  SourceInfo,
  TransformResult,
} from '../types';

/** API publique de data.gouv.fr (catalogue national des données ouvertes). */
export const DATAGOUV_API = 'https://www.data.gouv.fr/api/1';
/** Schéma national des fontaines à eau (https://schema.data.gouv.fr/datagouv/schema-fontaine-eau/). */
export const FOUNTAIN_SCHEMA = 'datagouv/schema-fontaine-eau';

interface DatagouvResource {
  id: string;
  title: string;
  format: string;
  url: string;
  last_modified?: string;
  schema?: { name?: string | null } | null;
}

export interface DatagouvDataset {
  id: string;
  title: string;
  page: string;
  license: string;
  last_modified: string;
  organization?: { name?: string } | null;
  resources: DatagouvResource[];
}

interface DatagouvPage {
  data: DatagouvDataset[];
  next_page: string | null;
  total: number;
}

const SUPPORTED_FORMATS = ['csv', 'json', 'geojson'];

/** Recherche de jeux de données (par mots-clés et/ou par schéma), toutes pages comprises. */
export async function searchDatasets(
  http: HttpClient,
  params: { query?: string; schema?: string; maxPages?: number },
): Promise<DatagouvDataset[]> {
  const search = new URLSearchParams({ page_size: '50' });
  if (params.query) search.set('q', params.query);
  if (params.schema) search.set('schema', params.schema);
  let url: string | null = `${DATAGOUV_API}/datasets/?${search.toString()}`;
  const datasets: DatagouvDataset[] = [];
  for (let page = 0; url && page < (params.maxPages ?? 10); page += 1) {
    const response: DatagouvPage = await http.getJson<DatagouvPage>(url);
    if (!Array.isArray(response.data)) throw new Error('Réponse inattendue de l’API data.gouv.fr');
    datasets.push(...response.data);
    url = response.next_page;
  }
  return datasets;
}

export const DATAGOUV_SOURCE: SourceInfo = {
  key: 'datagouv-fontaines',
  name: 'data.gouv.fr — jeux conformes au schéma « fontaine à eau »',
  category: 'official',
  countryCode: 'FR',
  url: `https://schema.data.gouv.fr/${FOUNTAIN_SCHEMA}/`,
  license: 'Licence propre à chaque jeu (Licence Ouverte, ODbL…)',
  attribution: 'Producteurs publics référencés sur data.gouv.fr',
  format: 'CSV / JSON / GeoJSON',
  // À vérifier : liste réelle des jeux, licences et champs (commande `discover`).
  verified: false,
  description:
    'Découvre via l’API data.gouv.fr les jeux de données déclarant le schéma national des fontaines à eau, puis importe leurs ressources.',
};

/**
 * Connecteur data.gouv.fr : chaque jeu déclarant le schéma national est importé ; un jeu ou une
 * ressource en échec est journalisé et n'interrompt pas les autres.
 */
export function createDatagouvConnector(): Connector {
  return {
    info: DATAGOUV_SOURCE,
    async run({ http, log }: ConnectorContext): Promise<TransformResult> {
      const datasets = await searchDatasets(http, { schema: FOUNTAIN_SCHEMA });
      log(`${datasets.length} jeu(x) déclarant le schéma ${FOUNTAIN_SCHEMA}`);
      const result: TransformResult = { records: [], rejections: [], notes: [] };
      for (const dataset of datasets) {
        const resources = dataset.resources.filter((r) =>
          SUPPORTED_FORMATS.includes(r.format?.toLowerCase()),
        );
        const resource = resources.find((r) => r.schema?.name === FOUNTAIN_SCHEMA) ?? resources[0];
        if (!resource) {
          result.notes.push(`« ${dataset.title} » : aucune ressource CSV/JSON/GeoJSON`);
          continue;
        }
        try {
          const content = await http.getText(resource.url);
          const rows = parseTabular(content, resource.format);
          const part = transformRows(rows, {
            sourceName: `${dataset.organization?.name ?? 'Producteur public'} — ${dataset.title}`,
            sourceUrl: dataset.page,
            license: dataset.license,
            datasetModifiedAt: resource.last_modified ?? dataset.last_modified ?? null,
            datasetIsDrinkingFountains: true,
            idPrefix: `${dataset.id}:`,
          });
          result.records.push(...part.records);
          result.rejections.push(...part.rejections);
          result.notes.push(
            `« ${dataset.title} » (${dataset.license}) : ${part.records.length} points ; ${part.notes.join(' ; ')}`,
          );
        } catch (error) {
          result.notes.push(`« ${dataset.title} » : échec (${String(error)})`);
        }
      }
      return result;
    },
  };
}
