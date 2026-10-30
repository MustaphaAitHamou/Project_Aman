import { createDatagouvConnector } from './connectors/datagouv';
import { createOpendatasoftConnector, OPENDATASOFT_SOURCES } from './connectors/opendatasoft';
import { createOsmConnector } from './connectors/osm';
import type { Connector } from './types';

/** Toutes les sources connues. Ajouter un pays ou une ville = ajouter un connecteur ici. */
export function createConnectors(env: NodeJS.ProcessEnv = process.env): Connector[] {
  return [
    createOsmConnector(env.OVERPASS_URL || undefined),
    createDatagouvConnector(),
    ...OPENDATASOFT_SOURCES.map(createOpendatasoftConnector),
  ];
}
