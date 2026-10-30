import type { LocationPermission, TrackingStatus } from '@/services/location/types';
import type { ViewportData } from '@/services/water-points/useWaterPointsInViewport';

import type { StatusTone } from '@/components/ui/StatusBadge';

export type NoticeAction = 'retry' | 'request_location' | 'open_settings' | 'reset_filters';

export type NoticeMessage =
  | 'loadError'
  | 'locationBlocked'
  | 'locationDenied'
  | 'locationServicesOff'
  | 'locationError'
  | 'noSource'
  | 'zoomIn'
  | 'truncated'
  | 'noResults'
  | 'emptyArea'
  | 'loading';

export interface MapNotice {
  message: NoticeMessage;
  tone: StatusTone;
  action?: NoticeAction;
}

export interface MapNoticeInput {
  data: ViewportData;
  permission: LocationPermission;
  canAskAgain: boolean;
  trackingStatus: TrackingStatus;
  activeFilterCount: number;
}

/**
 * Choisit le message le plus utile à afficher sur la carte (un seul à la fois),
 * du plus bloquant au plus informatif.
 */
export function selectMapNotice({
  data,
  permission,
  canAskAgain,
  trackingStatus,
  activeFilterCount,
}: MapNoticeInput): MapNotice | null {
  if (data.status === 'error') return { message: 'loadError', tone: 'error', action: 'retry' };

  if (permission === 'denied') {
    return canAskAgain
      ? { message: 'locationDenied', tone: 'warning', action: 'request_location' }
      : { message: 'locationBlocked', tone: 'warning', action: 'open_settings' };
  }
  if (permission === 'granted' && trackingStatus === 'services_disabled') {
    return { message: 'locationServicesOff', tone: 'warning', action: 'open_settings' };
  }
  if (permission === 'granted' && trackingStatus === 'error') {
    return { message: 'locationError', tone: 'neutral' };
  }

  switch (data.status) {
    case 'no_source':
      return { message: 'noSource', tone: 'info' };
    case 'zoom_in':
      return { message: 'zoomIn', tone: 'neutral' };
    case 'loading':
      return { message: 'loading', tone: 'neutral' };
    case 'ready':
      if (data.truncated) return { message: 'truncated', tone: 'warning' };
      if (data.points.length === 0) {
        return activeFilterCount > 0
          ? { message: 'noResults', tone: 'neutral', action: 'reset_filters' }
          : { message: 'emptyArea', tone: 'neutral' };
      }
      return null;
    default:
      return null;
  }
}
