import type { TFunction } from 'i18next';

import { AuthError } from '@/services/auth/auth-service';
import { CommunityError } from '@/services/community/api';

const COMMUNITY_CODES = [
  'authentication_required',
  'duplicate_nearby',
  'rate_limited',
  'already_reported',
  'invalid_coordinates',
  'field_not_editable',
  'water_point_not_found',
  'invalid_storage_path',
  'no_changes',
  'unavailable',
] as const;
type CommunityCode = (typeof COMMUNITY_CODES)[number];

/** Message lisible pour une erreur d'authentification ou de contribution. */
export function errorMessage(error: unknown, t: TFunction): string {
  if (error instanceof AuthError) return t(`auth.errors.${error.code}`);
  if (error instanceof CommunityError) {
    return COMMUNITY_CODES.includes(error.code as CommunityCode)
      ? t(`contribute.errors.${error.code as CommunityCode}`)
      : t('contribute.errors.unknown');
  }
  return t('errors.generic');
}
