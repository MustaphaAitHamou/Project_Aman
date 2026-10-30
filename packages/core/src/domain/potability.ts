import type { PotabilityEvidence, PotabilityEvidenceKind, PotabilityStatus } from './water-point';

/** Seules ces preuves peuvent certifier la potabilité. Un avis utilisateur ne le peut jamais. */
export const CERTIFYING_EVIDENCE_KINDS: readonly PotabilityEvidenceKind[] = [
  'official_dataset',
  'sanitary_control',
];

export function isCertifyingEvidence(evidence: PotabilityEvidence | null | undefined): boolean {
  if (!evidence) return false;
  if (!CERTIFYING_EVIDENCE_KINDS.includes(evidence.kind)) return false;
  // Une certification doit être datée.
  if (!evidence.observedAt || Number.isNaN(Date.parse(evidence.observedAt))) return false;
  return evidence.sourceName.trim().length > 0;
}

/**
 * Garantit qu'un statut `certified_potable` repose sur une preuve officielle datée.
 * Sinon, le statut est rétrogradé en `declared_potable` (information non certifiée).
 */
export function normalizePotability(
  status: PotabilityStatus,
  evidence: PotabilityEvidence | null | undefined,
): PotabilityStatus {
  if (status === 'certified_potable' && !isCertifyingEvidence(evidence)) {
    return 'declared_potable';
  }
  return status;
}

/** Statut de potabilité qu'une contribution communautaire est autorisée à produire. */
export function potabilityFromCommunityClaim(claim: 'potable' | 'not_potable'): PotabilityStatus {
  return claim === 'potable' ? 'declared_potable' : 'not_potable';
}

/** Vrai si l'eau est indiquée potable, certifiée ou non. */
export function isIndicatedPotable(status: PotabilityStatus): boolean {
  return status === 'certified_potable' || status === 'declared_potable';
}
