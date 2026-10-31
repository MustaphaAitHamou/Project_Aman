import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';

import { AppText } from '@/components/ui';
import { usePhotoUrls } from '@/services/community/hooks';
import type { WaterPointPhoto } from '@/services/water-points/supabase-repository';
import { useAppTheme } from '@/theme';

/** Photos approuvées (URL signées temporaires, le stockage étant privé). */
export function PhotoStrip({ photos }: { photos: WaterPointPhoto[] }) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const urls = usePhotoUrls(photos.map((photo) => photo.storagePath));

  if (photos.length === 0) {
    return (
      <AppText variant="subhead" tone="secondary">
        {t('pointDetail.noPhotos')}
      </AppText>
    );
  }
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: theme.space.sm }}
    >
      {photos.map((photo, index) => {
        const uri = urls.data?.[photo.storagePath];
        return (
          <Image
            key={photo.id}
            source={uri ? { uri } : null}
            style={{
              width: 200,
              height: 150,
              borderRadius: theme.radius.md,
              backgroundColor: theme.colors.surfaceMuted,
            }}
            contentFit="cover"
            transition={150}
            accessibilityLabel={t('pointDetail.photoLabel', {
              index: index + 1,
              total: photos.length,
            })}
          />
        );
      })}
    </ScrollView>
  );
}
