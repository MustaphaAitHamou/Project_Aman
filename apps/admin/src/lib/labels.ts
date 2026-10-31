/** Libellés français des valeurs du modèle (miroir des textes de l'application mobile). */

export const KIND_LABELS: Record<string, string> = {
  drinking_fountain: 'Fontaine à boire',
  water_tap: 'Robinet',
  bottle_refill_station: 'Station de remplissage',
  spring: 'Source naturelle',
  well_pump: 'Puits ou pompe',
  decorative_fountain: 'Fontaine décorative',
  other: 'Point d’eau',
};

export const POTABILITY_LABELS: Record<string, string> = {
  certified_potable: 'Potable (source officielle)',
  declared_potable: 'Indiquée potable, non certifiée',
  not_potable: 'Non potable',
  unknown: 'Inconnue',
};

export const OPERATIONAL_LABELS: Record<string, string> = {
  working: 'En service',
  out_of_order: 'Hors service',
  unknown: 'Inconnu',
};

export const REPORT_LABELS: Record<string, string> = {
  broken: 'Ne fonctionne pas',
  fixed: 'Fonctionne à nouveau',
  not_existing: 'N’existe plus',
  potability_potable: 'Indiquée potable sur place',
  potability_not_potable: 'Signalée non potable',
  other: 'Autre',
};

/** Effet d'une validation de signalement, affiché avant la décision. */
export const REPORT_EFFECTS: Record<string, string> = {
  broken: 'Le point passera « hors service ».',
  fixed: 'Le point passera « en service ».',
  not_existing: 'Le point sera marqué « n’existe plus » et masqué de la carte.',
  potability_potable:
    'La potabilité deviendra « indiquée potable » (jamais « certifiée » ; aucun effet si déjà certifiée).',
  potability_not_potable: 'La potabilité deviendra « non potable » (principe de précaution).',
  other: 'Aucun changement automatique.',
};

export const PUBLICATION_LABELS: Record<string, string> = {
  published: 'Publié',
  pending: 'En attente',
  rejected: 'Refusé',
  merged: 'Fusionné',
};

export const RUN_STATUS_LABELS: Record<string, string> = {
  running: 'En cours',
  succeeded: 'Réussi',
  partial: 'Partiel',
  failed: 'Échec',
};

export const label = (map: Record<string, string>, value: unknown): string =>
  typeof value === 'string' ? (map[value] ?? value) : '—';

export function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (value === true) return 'Oui';
  if (value === false) return 'Non';
  if (typeof value === 'string') return KIND_LABELS[value] ?? value;
  return JSON.stringify(value);
}

/** Lignes « champ : avant → après » d'une proposition de modification. */
export function describeChanges(
  changes: Record<string, unknown>,
  current: Record<string, unknown>,
): { field: string; before: string; after: string }[] {
  return Object.entries(changes).map(([field, after]) => ({
    field,
    before: formatValue(current[field]),
    after: formatValue(after),
  }));
}

export function formatDate(value: unknown): string {
  if (typeof value !== 'string') return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Europe/Paris',
  }).format(date);
}

/** Lien OpenStreetMap pour vérifier un emplacement. */
export function osmLink(latitude: number, longitude: number): string {
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=19/${latitude}/${longitude}`;
}
