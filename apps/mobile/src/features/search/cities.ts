import type { LngLat } from '@water-finder/core';

export interface City {
  id: string;
  name: string;
  region: string;
  /** Centre-ville approximatif [longitude, latitude], pour positionner la carte. */
  center: LngLat;
}

/**
 * Grandes villes de France métropolitaine et de Corse, pour la recherche manuelle
 * (sans GPS) en attendant le géocodage d'adresses (Base Adresse Nationale, phase 4).
 * Les coordonnées servent uniquement à cadrer la carte : ce ne sont pas des points d'eau.
 */
export const FRENCH_CITIES: readonly City[] = [
  { id: 'paris', name: 'Paris', region: 'Île-de-France', center: [2.3522, 48.8566] },
  {
    id: 'marseille',
    name: 'Marseille',
    region: 'Provence-Alpes-Côte d’Azur',
    center: [5.3698, 43.2965],
  },
  { id: 'lyon', name: 'Lyon', region: 'Auvergne-Rhône-Alpes', center: [4.8357, 45.764] },
  { id: 'toulouse', name: 'Toulouse', region: 'Occitanie', center: [1.4442, 43.6047] },
  { id: 'nice', name: 'Nice', region: 'Provence-Alpes-Côte d’Azur', center: [7.262, 43.7102] },
  { id: 'nantes', name: 'Nantes', region: 'Pays de la Loire', center: [-1.5536, 47.2184] },
  { id: 'montpellier', name: 'Montpellier', region: 'Occitanie', center: [3.8767, 43.6108] },
  { id: 'strasbourg', name: 'Strasbourg', region: 'Grand Est', center: [7.7521, 48.5734] },
  { id: 'bordeaux', name: 'Bordeaux', region: 'Nouvelle-Aquitaine', center: [-0.5792, 44.8378] },
  { id: 'lille', name: 'Lille', region: 'Hauts-de-France', center: [3.0573, 50.6292] },
  { id: 'rennes', name: 'Rennes', region: 'Bretagne', center: [-1.6778, 48.1173] },
  { id: 'reims', name: 'Reims', region: 'Grand Est', center: [4.0317, 49.2583] },
  { id: 'toulon', name: 'Toulon', region: 'Provence-Alpes-Côte d’Azur', center: [5.928, 43.1242] },
  {
    id: 'saint-etienne',
    name: 'Saint-Étienne',
    region: 'Auvergne-Rhône-Alpes',
    center: [4.3872, 45.4397],
  },
  { id: 'le-havre', name: 'Le Havre', region: 'Normandie', center: [0.1079, 49.4944] },
  { id: 'grenoble', name: 'Grenoble', region: 'Auvergne-Rhône-Alpes', center: [5.7245, 45.1885] },
  { id: 'dijon', name: 'Dijon', region: 'Bourgogne-Franche-Comté', center: [5.0415, 47.322] },
  { id: 'angers', name: 'Angers', region: 'Pays de la Loire', center: [-0.5632, 47.4784] },
  { id: 'nimes', name: 'Nîmes', region: 'Occitanie', center: [4.3601, 43.8367] },
  {
    id: 'clermont-ferrand',
    name: 'Clermont-Ferrand',
    region: 'Auvergne-Rhône-Alpes',
    center: [3.087, 45.7772],
  },
  {
    id: 'aix-en-provence',
    name: 'Aix-en-Provence',
    region: 'Provence-Alpes-Côte d’Azur',
    center: [5.4474, 43.5297],
  },
  { id: 'le-mans', name: 'Le Mans', region: 'Pays de la Loire', center: [0.1996, 48.0061] },
  { id: 'brest', name: 'Brest', region: 'Bretagne', center: [-4.4861, 48.3904] },
  { id: 'tours', name: 'Tours', region: 'Centre-Val de Loire', center: [0.6848, 47.3941] },
  { id: 'amiens', name: 'Amiens', region: 'Hauts-de-France', center: [2.2958, 49.8941] },
  { id: 'limoges', name: 'Limoges', region: 'Nouvelle-Aquitaine', center: [1.2611, 45.8336] },
  { id: 'annecy', name: 'Annecy', region: 'Auvergne-Rhône-Alpes', center: [6.1294, 45.8992] },
  { id: 'perpignan', name: 'Perpignan', region: 'Occitanie', center: [2.8948, 42.6887] },
  { id: 'metz', name: 'Metz', region: 'Grand Est', center: [6.1757, 49.1193] },
  {
    id: 'besancon',
    name: 'Besançon',
    region: 'Bourgogne-Franche-Comté',
    center: [6.0241, 47.2378],
  },
  { id: 'orleans', name: 'Orléans', region: 'Centre-Val de Loire', center: [1.9093, 47.9029] },
  { id: 'rouen', name: 'Rouen', region: 'Normandie', center: [1.0993, 49.4431] },
  { id: 'caen', name: 'Caen', region: 'Normandie', center: [-0.3707, 49.1829] },
  { id: 'nancy', name: 'Nancy', region: 'Grand Est', center: [6.1844, 48.6921] },
  {
    id: 'avignon',
    name: 'Avignon',
    region: 'Provence-Alpes-Côte d’Azur',
    center: [4.8055, 43.9493],
  },
  {
    id: 'la-rochelle',
    name: 'La Rochelle',
    region: 'Nouvelle-Aquitaine',
    center: [-1.1511, 46.1603],
  },
  { id: 'pau', name: 'Pau', region: 'Nouvelle-Aquitaine', center: [-0.3708, 43.2951] },
  { id: 'bayonne', name: 'Bayonne', region: 'Nouvelle-Aquitaine', center: [-1.4748, 43.4929] },
  { id: 'ajaccio', name: 'Ajaccio', region: 'Corse', center: [8.7386, 41.9192] },
  { id: 'bastia', name: 'Bastia', region: 'Corse', center: [9.4509, 42.6977] },
];

export const CITY_ZOOM = 13;

/** Minuscules, sans accents, tirets et apostrophes remplacés par des espaces. */
export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[-'’_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Les villes dont le nom commence par la saisie passent avant celles qui la contiennent. */
export function searchCities(query: string, cities: readonly City[] = FRENCH_CITIES): City[] {
  const needle = normalizeSearchText(query);
  if (!needle) return [...cities];
  const startsWith: City[] = [];
  const contains: City[] = [];
  for (const city of cities) {
    const name = normalizeSearchText(city.name);
    if (name.startsWith(needle)) startsWith.push(city);
    else if (name.includes(needle) || normalizeSearchText(city.region).includes(needle))
      contains.push(city);
  }
  return [...startsWith, ...contains];
}
