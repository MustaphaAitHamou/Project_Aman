import type { WaterPointKind, WaterType } from '@water-finder/core';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  AppText,
  Banner,
  Button,
  EmptyState,
  LoadingState,
  Screen,
  TextField,
} from '@/components/ui';
import { AuthGate } from '@/features/auth/AuthGate';
import { errorMessage } from '@/features/auth/auth-errors';
import { ChoiceChips } from '@/features/contribute/ChoiceChips';
import { kindChoices, triStateChoices, waterTypeChoices } from '@/features/contribute/choices';
import { SubmittedState } from '@/features/contribute/SubmittedState';
import { proposeRevision, type RevisionChanges } from '@/services/community/api';
import type { WaterPointDetail } from '@/services/water-points/supabase-repository';
import { useWaterPoint } from '@/services/water-points/useWaterPoint';

export default function EditPointScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useWaterPoint(id);
  return (
    <AuthGate icon="pencil-outline" reason={t('contribute.authBody')}>
      {query.isPending ? (
        <LoadingState label={t('common.loading')} />
      ) : query.data ? (
        <EditForm point={query.data} />
      ) : (
        <EmptyState
          icon="map-marker-off-outline"
          tone="neutral"
          title={t('pointDetail.notFoundTitle')}
        />
      )}
    </AuthGate>
  );
}

/** Seuls les champs réellement modifiés sont envoyés. */
export function diffChanges(
  point: WaterPointDetail,
  draft: Required<RevisionChanges>,
): RevisionChanges {
  const changes: RevisionChanges = {};
  const norm = (value: string | null) => (value?.trim() ? value.trim() : null);
  if (norm(draft.name) !== norm(point.name)) changes.name = norm(draft.name);
  if (draft.kind !== point.kind) changes.kind = draft.kind;
  if (draft.water_type !== point.waterType) changes.water_type = draft.water_type;
  if (draft.is_free !== point.isFree) changes.is_free = draft.is_free;
  if (draft.wheelchair_accessible !== point.wheelchairAccessible)
    changes.wheelchair_accessible = draft.wheelchair_accessible;
  if (norm(draft.opening_hours) !== norm(point.openingHours))
    changes.opening_hours = norm(draft.opening_hours);
  if (norm(draft.address) !== norm(point.address)) changes.address = norm(draft.address);
  return changes;
}

function EditForm({ point }: { point: WaterPointDetail }) {
  const { t } = useTranslation();
  const [name, setName] = useState(point.name ?? '');
  const [kind, setKind] = useState<WaterPointKind>(point.kind);
  const [waterType, setWaterType] = useState<WaterType>(point.waterType);
  const [isFree, setIsFree] = useState<boolean | null>(point.isFree);
  const [accessible, setAccessible] = useState<boolean | null>(point.wheelchairAccessible);
  const [hours, setHours] = useState(point.openingHours ?? '');
  const [address, setAddress] = useState(point.address ?? '');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const changes = diffChanges(point, {
    name,
    kind,
    water_type: waterType,
    is_free: isFree,
    wheelchair_accessible: accessible,
    opening_hours: hours,
    address,
  });
  const changeCount = Object.keys(changes).length;

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      await proposeRevision(point.id, changes, comment);
      setDone(true);
    } catch (e) {
      setError(errorMessage(e, t));
    } finally {
      setBusy(false);
    }
  };

  if (done) return <SubmittedState />;

  return (
    <Screen safeTop={false} testID="edit-point-screen">
      <Banner tone="info" icon="information-outline" message={t('edit.notice')} live={false} />
      <TextField label={t('contribute.name')} value={name} onChangeText={setName} maxLength={120} />
      <ChoiceChips
        label={t('contribute.kind')}
        choices={kindChoices(t)}
        value={kind}
        onChange={setKind}
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
      <TextField
        label={t('edit.openingHours')}
        hint={t('edit.openingHoursHint')}
        value={hours}
        onChangeText={setHours}
        maxLength={255}
      />
      <TextField
        label={t('edit.address')}
        value={address}
        onChangeText={setAddress}
        maxLength={240}
      />
      <TextField
        label={t('contribute.comment')}
        hint={t('contribute.commentHint')}
        value={comment}
        onChangeText={setComment}
        multiline
        maxLength={500}
      />
      {error ? <Banner tone="error" icon="alert-circle-outline" message={error} /> : null}
      <Button
        testID="edit-submit"
        label={t('edit.submit', { count: changeCount })}
        icon="send-outline"
        size="lg"
        loading={busy}
        disabled={changeCount === 0}
        onPress={() => void submit()}
      />
      <AppText variant="footnote" tone="muted" align="center">
        {t('contribute.moderationNotice')}
      </AppText>
    </Screen>
  );
}
