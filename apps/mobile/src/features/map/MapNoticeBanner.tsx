import { useTranslation } from 'react-i18next';

import { Banner } from '@/components/ui';

import type { MapNotice, NoticeAction } from './map-notice';

export interface MapNoticeBannerProps {
  notice: MapNotice;
  onAction: (action: NoticeAction) => void;
}

const ACTION_LABEL_KEYS = {
  retry: 'common.retry',
  request_location: 'map.actionAllow',
  open_settings: 'common.openSettings',
  reset_filters: 'filters.reset',
} as const;

export function MapNoticeBanner({ notice, onAction }: MapNoticeBannerProps) {
  const { t } = useTranslation();
  const { action } = notice;
  return (
    <Banner
      testID={`map-notice-${notice.message}`}
      tone={notice.tone}
      message={t(`map.${notice.message}`)}
      actionLabel={action ? t(ACTION_LABEL_KEYS[action]) : undefined}
      onAction={action ? () => onAction(action) : undefined}
    />
  );
}
