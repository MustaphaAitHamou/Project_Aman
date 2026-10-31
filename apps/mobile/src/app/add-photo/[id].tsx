import { Image } from 'expo-image';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, View } from 'react-native';

import { AppText, Banner, Button, Screen } from '@/components/ui';
import { AuthGate } from '@/features/auth/AuthGate';
import { errorMessage } from '@/features/auth/auth-errors';
import { SubmittedState } from '@/features/contribute/SubmittedState';
import { useUserId } from '@/services/auth/session';
import { uploadPhoto } from '@/services/community/api';
import { useAppTheme } from '@/theme';

/** Côté le plus long après redimensionnement (pixels) : suffisant et léger. */
const MAX_SIDE = 1600;

interface PreparedPhoto {
  uri: string;
  width: number;
  height: number;
}

/**
 * Réencodage systématique en JPEG : supprime les métadonnées EXIF (dont la position GPS de la
 * prise de vue) et limite la taille avant l'envoi.
 */
async function preparePhoto(asset: ImagePicker.ImagePickerAsset): Promise<PreparedPhoto> {
  const context = ImageManipulator.manipulate(asset.uri);
  const longest = Math.max(asset.width, asset.height);
  if (longest > MAX_SIDE) {
    context.resize(asset.width >= asset.height ? { width: MAX_SIDE } : { height: MAX_SIDE });
  }
  const image = await context.renderAsync();
  const result = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });
  return { uri: result.uri, width: result.width, height: result.height };
}

export default function AddPhotoScreen() {
  const { t } = useTranslation();
  return (
    <AuthGate icon="camera-outline" reason={t('contribute.authBody')}>
      <AddPhotoForm />
    </AuthGate>
  );
}

function AddPhotoForm() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useUserId();
  const [photo, setPhoto] = useState<PreparedPhoto | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const pick = async (source: 'camera' | 'library') => {
    setError(null);
    try {
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) return setError(t('photo.cameraDenied'));
      }
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        quality: 1,
        exif: false,
      };
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(options)
          : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled || !result.assets[0]) return;
      setBusy(true);
      setPhoto(await preparePhoto(result.assets[0]));
    } catch {
      setError(t('photo.pickFailed'));
    } finally {
      setBusy(false);
    }
  };

  const send = async () => {
    if (!photo || !userId) return;
    setError(null);
    setBusy(true);
    try {
      await uploadPhoto(id, userId, photo);
      setDone(true);
    } catch (e) {
      setError(errorMessage(e, t));
    } finally {
      setBusy(false);
    }
  };

  if (done) return <SubmittedState body={t('photo.submitted')} />;

  return (
    <Screen safeTop={false} testID="add-photo-screen">
      <Banner tone="info" icon="shield-check-outline" message={t('photo.rules')} live={false} />
      {photo ? (
        <Image
          source={{ uri: photo.uri }}
          style={[
            styles.preview,
            { borderRadius: theme.radius.lg, aspectRatio: photo.width / photo.height },
          ]}
          contentFit="cover"
          accessibilityLabel={t('photo.previewLabel')}
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            { borderRadius: theme.radius.lg, backgroundColor: theme.colors.surfaceMuted },
          ]}
        >
          <AppText variant="callout" tone="secondary" align="center">
            {t('photo.noneSelected')}
          </AppText>
        </View>
      )}
      <View style={[styles.row, { gap: theme.space.sm }]}>
        {Platform.OS !== 'web' ? (
          <Button
            label={t('photo.takePhoto')}
            icon="camera-outline"
            variant="secondary"
            disabled={busy}
            onPress={() => void pick('camera')}
            style={styles.flex}
          />
        ) : null}
        <Button
          label={t('photo.chooseFromLibrary')}
          icon="image-outline"
          variant="secondary"
          disabled={busy}
          onPress={() => void pick('library')}
          style={styles.flex}
        />
      </View>
      {error ? <Banner tone="error" icon="alert-circle-outline" message={error} /> : null}
      <Button
        testID="photo-submit"
        label={t('photo.send')}
        icon="upload-outline"
        size="lg"
        loading={busy}
        disabled={!photo}
        onPress={() => void send()}
      />
      <AppText variant="footnote" tone="muted" align="center">
        {t('contribute.moderationNotice')}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  preview: {
    width: '100%',
    maxHeight: 420,
  },
  placeholder: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
});
