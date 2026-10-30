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

export const OSM_SOURCE: SourceInfo = {
  key: 'osm-fr',
  name: 'OpenStreetMap (France)',
  category: 'openstreetmap',
  countryCode: 'FR',
  url: 'https://www.openstreetmap.org/copyright',
  license: 'ODbL-1.0',
  attribution: '© les contributeurs d’OpenStreetMap',
  format: 'Overpass JSON',
  // Les tags utilisés sont documentés par le wiki OSM ; l'API publique Overpass impose des
  // limites d'usage (voir DATA_SOURCES.md). Vérification juridique ODbL à faire avant la production.
  verified: true,
  description: 'Points d’eau cartographiés par la communauté OpenStreetMap.',
};

/**
 * Requête Overpass : points d'eau potable déclarés, robinets, points d'eau, fontaines
 * explicitement potables et sources (jamais potables par défaut).
 */
export function buildOverpassQuery(bbox?: [number, number, number, number]): string {
  const scope = bbox ? `(${bbox[1]},${bbox[0]},${bbox[3]},${bbox[2]})` : '(area.searchArea)';
  const area = bbox ? '' : 'area["ISO3166-1"="FR"][admin_level=2]->.searchArea;\n';
  return `[out:json][timeout:900];
${area}(
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

export function createOsmConnector(
  overpassUrl = 'https://overpass-api.de/api/interpreter',
): Connector {
  return {
    info: OSM_SOURCE,
    async run({ http, log, bbox }) {
      const query = buildOverpassQuery(bbox);
      log(`Requête Overpass (${bbox ? 'emprise ' + bbox.join(',') : 'France entière'})…`);
      const response = await http.postForm<{ elements?: OsmElement[]; remark?: string }>(
        overpassUrl,
        {
          data: query,
        },
      );
      if (!Array.isArray(response.elements)) {
        throw new Error(
          `Réponse Overpass inattendue${response.remark ? ` : ${response.remark}` : ''}`,
        );
      }
      const result = transformOsmResponse(response.elements);
      if (response.remark) result.notes.push(`Remarque Overpass : ${response.remark}`);
      return result;
    },
  };
}
