import * as WebBrowser from 'expo-web-browser';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { AppText, Button, Card, Screen, StatusBadge } from '@/components/ui';
import { useAppTheme } from '@/theme';

type SourceKey = 'basemap' | 'osm' | 'official' | 'community';

interface SourceEntry {
  key: SourceKey;
  /** Phase d'intégration prévue ; `null` si déjà utilisée par l'application. */
  plannedPhase: number | null;
  url: string;
}

/**
 * Sources déclarées. Seul le fond de carte (données OpenStreetMap) est utilisé en phase 1 :
 * aucun point d'eau réel n'est encore importé.
 */
const SOURCES: SourceEntry[] = [
  { key: 'basemap', plannedPhase: null, url: 'https://openfreemap.org/' },
  { key: 'osm', plannedPhase: null, url: 'https://www.openstreetmap.org/copyright' },
  {
    key: 'official',
    plannedPhase: 3,
    url: 'https://schema.data.gouv.fr/datagouv/schema-fontaine-eau/',
  },
  { key: 'community', plannedPhase: 5, url: 'https://www.openstreetmap.org/copyright' },
];

export default function SourcesScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();

  return (
    <Screen safeTop={false} testID="sources-screen">
      <AppText variant="callout" tone="secondary">
        {t('sources.intro')}
      </AppText>
      {SOURCES.map((source) => (
        <Card key={source.key} style={{ gap: theme.space.sm }} testID={`source-${source.key}`}>
          <AppText variant="headline" accessibilityRole="header">
            {t(`sources.${source.key}Title`)}
          </AppText>
          <StatusBadge
            tone={source.plannedPhase === null ? 'success' : 'neutral'}
            icon={source.plannedPhase === null ? 'check-circle-outline' : 'progress-wrench'}
            label={
              source.plannedPhase === null
                ? t('sources.statusActive')
                : t('sources.statusPlanned', { phase: source.plannedPhase })
            }
          />
          <AppText variant="callout" tone="secondary">
            {t(`sources.${source.key}Body`)}
          </AppText>
          {source.key !== 'community' ? (
            <View>
              <Button
                label={t('sources.openLink')}
                variant="ghost"
                icon="open-in-new"
                onPress={() => void WebBrowser.openBrowserAsync(source.url)}
              />
            </View>
          ) : null}
        </Card>
      ))}
    </Screen>
  );
}
