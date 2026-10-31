import type { PotabilityStatus, WaterPointKind } from '@water-finder/core';

import { cleanText, parseDate, toCoordinates } from '../normalize';
import type {
  Connector,
  ImportPayload,
  ImportRecord,
  Rejection,
  SourceInfo,
  TransformResult,
} from '../types';

export interface OsmElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

type BBox = [number, number, number, number];

/** Pays couverts par l'import OpenStreetMap. Ajouter un pays = ajouter une entrée. */
export interface OsmCountry {
  /** Code ISO 3166-1 alpha-2 (filtre de zone Overpass et pays des points). */
  code: string;
  name: string;
  /** Emprises [ouest, sud, est, nord] couvrant le territoire (plusieurs pour les territoires éclatés). */
  extents: BBox[];
  /** Taille des tuiles en degrés : petite pour les zones denses, plus grande pour les déserts. */
  tileDegrees: number;
}

export const OSM_COUNTRIES: readonly OsmCountry[] = [
  { code: 'DZ', name: 'Algérie', extents: [[-8.7, 18.9, 12.0, 37.2]], tileDegrees: 4 },
  // Métropole et Corse (les territoires d'outre-mer feront l'objet d'emprises dédiées).
  { code: 'FR', name: 'France', extents: [[-5.3, 41.3, 9.6, 51.2]], tileDegrees: 2 },
  { code: 'BE', name: 'Belgique', extents: [[2.5, 49.4, 6.5, 51.6]], tileDegrees: 2 },
  { code: 'CH', name: 'Suisse', extents: [[5.9, 45.8, 10.5, 47.9]], tileDegrees: 2 },
  {
    code: 'ES',
    name: 'Espagne',
    extents: [
      [-9.4, 35.9, 4.4, 43.8],
      [-18.2, 27.6, -13.4, 29.5],
    ],
    tileDegrees: 2,
  },
  { code: 'IT', name: 'Italie', extents: [[6.6, 35.4, 18.6, 47.1]], tileDegrees: 2 },
  { code: 'CA', name: 'Canada', extents: [[-141.1, 41.6, -52.6, 83.2]], tileDegrees: 5 },
  {
    code: 'US',
    name: 'États-Unis',
    extents: [
      [-125.0, 24.4, -66.9, 49.4],
      [-180.0, 51.0, -129.9, 71.5],
      [-160.6, 18.8, -154.7, 22.3],
    ],
    tileDegrees: 3,
  },
];

export function osmSourceInfo(country: OsmCountry): SourceInfo {
  return {
    key: `osm-${country.code.toLowerCase()}`,
    name: `OpenStreetMap (${country.name})`,
    category: 'openstreetmap',
    countryCode: country.code,
    url: 'https://www.openstreetmap.org/copyright',
    license: 'ODbL-1.0',
    attribution: '© les contributeurs d’OpenStreetMap',
    format: 'Overpass JSON',
    // Les tags utilisés sont documentés par le wiki OSM ; l'API publique Overpass impose des
    // limites d'usage (voir DATA_SOURCES.md). Vérification juridique ODbL à faire avant la production.
    verified: true,
    description: `Points d’eau cartographiés par la communauté OpenStreetMap (${country.name}).`,
  };
}

const FRANCE = OSM_COUNTRIES.find((c) => c.code === 'FR') as OsmCountry;
export const OSM_SOURCE: SourceInfo = osmSourceInfo(FRANCE);

/** Découpe une emprise en tuiles d'au plus `size` degrés (bords alignés sur l'emprise). */
export function tileBBox(bbox: BBox, size: number): BBox[] {
  const [west, south, east, north] = bbox;
  const tiles: BBox[] = [];
  for (let y = south; y < north; y += size) {
    for (let x = west; x < east; x += size) {
      const round = (n: number) => Math.round(n * 1e6) / 1e6;
      tiles.push([
        round(x),
        round(y),
        round(Math.min(x + size, east)),
        round(Math.min(y + size, north)),
      ]);
    }
  }
  return tiles;
}

/**
 * Requête Overpass pour une tuile, restreinte au pays (filtre de zone ISO) pour ne pas importer
 * les points des pays voisins : points d'eau potable déclarés, robinets, points d'eau,
 * fontaines explicitement potables et sources (jamais potables par défaut).
 */
export function buildOverpassQuery(countryCode: string, bbox?: BBox): string {
  const box = bbox ? `(${bbox[1]},${bbox[0]},${bbox[3]},${bbox[2]})` : '';
  const scope = `(area.searchArea)${box}`;
  return `[out:json][timeout:180];
area["ISO3166-1"="${countryCode}"][admin_level=2]->.searchArea;
(
  nwr["amenity"="drinking_water"]${scope};
  nwr["man_made"="water_tap"]${scope};
  nwr["amenity"="water_point"]${scope};
  nwr["amenity"="fountain"]["drinking_water"="yes"]${scope};
  nwr["natural"="spring"]["drinking_water"]${scope};
);
out center tags;`;
}

function kindFromTags(tags: Record<string, string>): WaterPointKind {
  if (tags.amenity === 'drinking_water') return 'drinking_fountain';
  if (tags.amenity === 'fountain')
    return tags.drinking_water === 'yes' ? 'drinking_fountain' : 'decorative_fountain';
  if (tags.man_made === 'water_tap' || tags.amenity === 'water_point') return 'water_tap';
  if (tags.natural === 'spring') return 'spring';
  if (tags.man_made === 'water_well') return 'well_pump';
  return 'other';
}

/**
 * Potabilité déduite des tags, jamais certifiée : `amenity=drinking_water` ou
 * `drinking_water=yes` → indiquée potable ; `drinking_water=no` → non potable ; une source ou un
 * robinet sans indication reste inconnu. `drinking_water:legal` ne certifie pas à lui seul.
 */
function potabilityFromTags(tags: Record<string, string>): PotabilityStatus {
  const declared = tags.drinking_water;
  if (declared === 'no') return 'not_potable';
  if (declared === 'yes') return 'declared_potable';
  if (tags.amenity === 'drinking_water' && declared === undefined) return 'declared_potable';
  return 'unknown';
}

const triState = (value: string | undefined): boolean | null =>
  value === 'yes' ? true : value === 'no' ? false : null;

export function transformOsmElement(element: OsmElement): ImportRecord | Rejection {
  const externalId = `${element.type}/${element.id}`;
  const tags = element.tags ?? {};
  const coords = toCoordinates(
    element.lat ?? element.center?.lat,
    element.lon ?? element.center?.lon,
  );
  if (!coords) return { externalId, reason: 'coordonnées absentes ou invalides' };

  const potability = potabilityFromTags(tags);
  const disused =
    tags.disused === 'yes' || ['broken', 'closed'].includes(tags.operational_status ?? '');
  const restricted = ['private', 'no', 'customers', 'permissive_customers'].includes(
    tags.access ?? '',
  );
  const payload: ImportPayload = {
    kind: kindFromTags(tags),
    latitude: coords.latitude,
    longitude: coords.longitude,
    name: cleanText(tags.name, 120),
    potability,
    potability_evidence:
      potability === 'unknown' ? null : { kind: 'osm_tag', source_name: 'OpenStreetMap' },
    // L'existence d'un objet OSM ne prouve pas qu'il fonctionne : état inconnu sauf indication.
    operational_status: disused ? 'out_of_order' : 'unknown',
    availability: restricted ? 'restricted_access' : 'available',
    water_type: 'unknown',
    is_free: tags.fee === 'no' ? true : tags.fee === 'yes' ? false : null,
    wheelchair_accessible: triState(tags.wheelchair),
    opening_hours: cleanText(tags.opening_hours, 255),
    last_verified_at: parseDate(tags.check_date ?? tags['survey:date']),
    url: `https://www.openstreetmap.org/${externalId}`,
    license: 'ODbL-1.0',
  };
  return { externalId, payload };
}

export function transformOsmResponse(elements: OsmElement[]): TransformResult {
  const records: ImportRecord[] = [];
  const rejections: Rejection[] = [];
  for (const element of elements) {
    const result = transformOsmElement(element);
    if ('payload' in result) records.push(result);
    else rejections.push(result);
  }
  return { records, rejections, notes: [`${elements.length} éléments reçus d’Overpass`] };
}

/** Intersection de deux emprises, ou `null` si elles sont disjointes. */
function intersect(a: BBox, b: BBox): BBox | null {
  const box: BBox = [
    Math.max(a[0], b[0]),
    Math.max(a[1], b[1]),
    Math.min(a[2], b[2]),
    Math.min(a[3], b[3]),
  ];
  return box[0] < box[2] && box[1] < box[3] ? box : null;
}

export interface OsmConnectorOptions {
  overpassUrl?: string;
  /** Pause entre deux tuiles (politesse envers le service public). */
  pauseMs?: number;
  sleep?: (ms: number) => Promise<void>;
}

/**
 * Connecteur OpenStreetMap d'un pays. Le territoire est découpé en tuiles interrogées l'une
 * après l'autre : une tuile en échec est journalisée (l'import devient « partiel ») sans bloquer
 * les autres ; l'import n'échoue que si toutes les tuiles échouent.
 */
export function createOsmConnector(
  country: OsmCountry = FRANCE,
  options: OsmConnectorOptions = {},
): Connector {
  const {
    overpassUrl = 'https://overpass-api.de/api/interpreter',
    pauseMs = 1_000,
    sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  } = options;
  return {
    info: osmSourceInfo(country),
    async run({ http, log, bbox }) {
      const areas = bbox
        ? country.extents.map((extent) => intersect(extent, bbox)).filter((b): b is BBox => !!b)
        : country.extents;
      const tiles = areas.flatMap((area) => tileBBox(area, country.tileDegrees));
      if (tiles.length === 0) throw new Error(`L’emprise demandée ne recoupe pas ${country.name}.`);
      log(`${country.name} : ${tiles.length} tuile(s) Overpass…`);

      const seen = new Set<string>();
      const result: TransformResult = { records: [], rejections: [], notes: [] };
      let received = 0;
      let failed = 0;
      for (const [index, tile] of tiles.entries()) {
        if (index > 0 && pauseMs > 0) await sleep(pauseMs);
        try {
          const response = await http.postForm<{ elements?: OsmElement[]; remark?: string }>(
            overpassUrl,
            { data: buildOverpassQuery(country.code, tile) },
          );
          if (!Array.isArray(response.elements)) {
            throw new Error(`réponse inattendue${response.remark ? ` : ${response.remark}` : ''}`);
          }
          // Un objet à cheval sur deux tuiles n'est retenu qu'une fois.
          const fresh = response.elements.filter((e) => {
            const id = `${e.type}/${e.id}`;
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
          });
          received += fresh.length;
          const part = transformOsmResponse(fresh);
          result.records.push(...part.records);
          result.rejections.push(...part.rejections);
          if (response.remark) result.notes.push(`Tuile ${tile.join(',')} : ${response.remark}`);
          log(`  tuile ${index + 1}/${tiles.length} : ${fresh.length} éléments`);
        } catch (error) {
          failed += 1;
          result.rejections.push({
            externalId: `tuile:${tile.join(',')}`,
            reason: `tuile en échec : ${String(error)}`,
          });
          log(`  tuile ${index + 1}/${tiles.length} en échec : ${String(error)}`);
        }
      }
      if (failed === tiles.length)
        throw new Error(`Toutes les tuiles ont échoué (${country.name}).`);
      result.notes.push(
        `${received} éléments reçus d’Overpass (${tiles.length} tuiles, ${failed} en échec)`,
      );
      return result;
    },
  };
}
