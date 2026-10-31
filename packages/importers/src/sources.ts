import { createDatagouvConnector } from './connectors/datagouv';
import { createOpendatasoftConnector, OPENDATASOFT_SOURCES } from './connectors/opendatasoft';
import { createOsmConnector, OSM_COUNTRIES } from './connectors/osm';
import type { Connector } from './types';

/** Toutes les sources connues. Ajouter un pays ou une ville = ajouter un connecteur ici. */
export function createConnectors(env: NodeJS.ProcessEnv = process.env): Connector[] {
  return [
    ...OSM_COUNTRIES.map((country) =>
      createOsmConnector(country, { overpassUrl: env.OVERPASS_URL || undefined }),
    ),
    createDatagouvConnector(),
    ...OPENDATASOFT_SOURCES.map(createOpendatasoftConnector),
  ];
}
