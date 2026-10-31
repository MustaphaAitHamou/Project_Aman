import type { Coordinates, WaterPointKind, WaterType } from '@water-finder/core';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  AppText,
  Banner,
  Button,
  Card,
  Screen,
  SegmentedControl,
  TextField,
} from '@/components/ui';
import { AuthGate } from '@/features/auth/AuthGate';
import { errorMessage } from '@/features/auth/auth-errors';
import { ChoiceChips } from '@/features/contribute/ChoiceChips';
import { kindChoices, triStateChoices, waterTypeChoices } from '@/features/contribute/choices';
import { SubmittedState } from '@/features/contribute/SubmittedState';
import { CommunityError, submitWaterPoint, type PotabilityClaim } from '@/services/community/api';
import { useLocationStore } from '@/stores/location';
import { useMapCameraStore } from '@/stores/map-camera';
import { useAppTheme } from '@/theme';

/** Précision GPS au-delà de laquelle la position n'est pas proposée (mètres). */
const MAX_GPS_ACCURACY = 50;
/** Zoom minimal pour placer un point au centre de la carte (≈ précision de la rue). */
const MIN_PLACEMENT_ZOOM = 16;

type LocationMode = 'gps' | 'map';

export default function NewPointScreen() {
  const { t } = useTranslation();
  return (
    <AuthGate icon="map-marker-plus-outline" reason={t('contribute.authBody')}>
      <NewPointForm />
    </AuthGate>
  );
}

function NewPointForm() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const router = useRouter();
  const position = useLocationStore((state) => state.position);
  const lastView = useMapCameraStore((state) => state.lastView);
  const gpsUsable = !!position && (position.accuracy ?? Infinity) <= MAX_GPS_ACCURACY;
  const mapUsable = !!lastView && lastView.zoom >= MIN_PLACEMENT_ZOOM;
  const [mode, setMode] = useState<LocationMode>(gpsUsable || !mapUsable ? 'gps' : 'map');
  const [kind, setKind] = useState<WaterPointKind>('drinking_fountain');
  const [name, setName] = useState('');
  const [waterType, setWaterType] = useState<WaterType>('still');
  const [isFree, setIsFree] = useState<boolean | null>(true);
  const [accessible, setAccessible] = useState<boolean | null>(null);
  const [potability, setPotability] = useState<PotabilityClaim>('unknown');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateId, setDuplicateId] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const location: Coordinates | null =
    mode === 'gps'
      ? gpsUsable && position
        ? { latitude: position.latitude, longitude: position.longitude }
        : null
      : mapUsable && lastView
        ? { latitude: lastView.center[1], longitude: lastView.center[0] }
        : null;

  const submit = async () => {
    setError(null);
    setDuplicateId(null);
    if (!location) return setError(t('contribute.locationMissing'));
    setBusy(true);
    try {
      await submitWaterPoint({
        kind,
        location,
        name,
        waterType,
        isFree,
        wheelchairAccessible: accessible,
        potabilityClaim: potability,
        comment,
      });
      setDone(true);
    } catch (e) {
      setError(errorMessage(e, t));
      if (e instanceof CommunityError && e.code === 'duplicate_nearby' && e.detail) {
        setDuplicateId(e.detail);
      }
    } finally {
      setBusy(false);
    }
  };

  if (done) return <SubmittedState body={t('contribute.newPointSubmitted')} />;

  return (
    <Screen safeTop={false} testID="new-point-screen">
      <Card style={{ gap: theme.space.md }}>
        <AppText variant="headline">{t('contribute.locationTitle')}</AppText>
        <SegmentedControl
          accessibilityLabel={t('contribute.locationTitle')}
          options={[
            { value: 'gps', label: t('contribute.locationGps') },
            { value: 'map', label: t('contribute.locationMap') },
          ]}
          value={mode}
          onChange={setMode}
        />
        {location ? (
          <AppText variant="subhead" tone="secondary" testID="new-point-coordinates">
            {`${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`}
            {mode === 'gps' && position?.accuracy ? ` · ±${Math.round(position.accuracy)} m` : ''}
          </AppText>
        ) : (
          <Banner
            tone="warning"
            icon="crosshairs-question"
            message={
              mode === 'gps'
                ? t('contribute.gpsUnavailable', { meters: MAX_GPS_ACCURACY })
                : t('contribute.mapTooFar')
            }
            actionLabel={mode === 'map' ? t('contribute.openMap') : undefined}
            onAction={mode === 'map' ? () => router.navigate('/') : undefined}
          />
        )}
        <AppText variant="footnote" tone="muted">
          {t('contribute.locationHint')}
        </AppText>
      </Card>

      <ChoiceChips
        label={t('contribute.kind')}
        choices={kindChoices(t)}
        value={kind}
        onChange={setKind}
        testID="new-point-kind"
      />
      <TextField
        label={t('contribute.name')}
        hint={t('contribute.nameHint')}
        value={name}
        onChangeText={setName}
        maxLength={120}
      />
      <ChoiceChips
        label={t('point.waterTypeLabel')}
        choices={waterTypeChoices(t)}
        value={waterType}
        onChange={setWaterType}
      />
      <ChoiceChips
        label={t('contribute.isFree')}
        choices={triStateChoices(t)}
        value={isFree}
        onChange={setIsFree}
      />
      <ChoiceChips
        label={t('point.accessibleLabel')}
        choices={triStateChoices(t)}
        value={accessible}
        onChange={setAccessible}
      />

      <Card style={{ gap: theme.space.md }}>
        <ChoiceChips
          label={t('contribute.potabilityQuestion')}
          choices={[
            { value: 'potable', label: t('contribute.potabilityPotable') },
            { value: 'not_potable', label: t('contribute.potabilityNotPotable') },
            { value: 'unknown', label: t('contribute.dontKnow') },
          ]}
          value={potability}
          onChange={setPotability}
        />
        <AppText variant="footnote" tone="muted">
          {t('contribute.potabilityNotice')}
        </AppText>
      </Card>

      <TextField
        label={t('contribute.comment')}
        hint={t('contribute.commentHint')}
        value={comment}
        onChangeText={setComment}
        multiline
        maxLength={500}
      />

      {error ? (
        <Banner
          tone="error"
          icon="alert-circle-outline"
          message={error}
          actionLabel={duplicateId ? t('contribute.openExisting') : undefined}
          onAction={
            duplicateId
              ? () => router.replace({ pathname: '/point/[id]', params: { id: duplicateId } })
              : undefined
          }
        />
      ) : null}
      <Button
        testID="new-point-submit"
        label={t('contribute.submit')}
        icon="send-outline"
        size="lg"
        loading={busy}
        disabled={!location}
        onPress={() => void submit()}
      />
      <AppText variant="footnote" tone="muted" align="center">
        {t('contribute.moderationNotice')}
      </AppText>
    </Screen>
  );
}
