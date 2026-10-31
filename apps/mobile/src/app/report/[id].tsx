import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AppText, Banner, Button, Screen, TextField } from '@/components/ui';
import { AuthGate } from '@/features/auth/AuthGate';
import { errorMessage } from '@/features/auth/auth-errors';
import { ChoiceChips } from '@/features/contribute/ChoiceChips';
import { SubmittedState } from '@/features/contribute/SubmittedState';
import { REPORT_TYPES, submitReport, type ReportType } from '@/services/community/api';
import { useWaterPoint } from '@/services/water-points/useWaterPoint';

export default function ReportScreen() {
  const { t } = useTranslation();
  return (
    <AuthGate icon="flag-outline" reason={t('contribute.authBody')}>
      <ReportForm />
    </AuthGate>
  );
}

function ReportForm() {
  const { t } = useTranslation();
  const { id, type: initialType } = useLocalSearchParams<{ id: string; type?: string }>();
  const point = useWaterPoint(id);
  const [type, setType] = useState<ReportType>(
    REPORT_TYPES.find((candidate) => candidate === initialType) ?? 'broken',
  );
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const commentRequired = type === 'other';

  const submit = async () => {
    setError(null);
    if (commentRequired && !comment.trim()) return setError(t('report.commentRequired'));
    setBusy(true);
    try {
      await submitReport(id, type, comment);
      setDone(true);
    } catch (e) {
      setError(errorMessage(e, t));
    } finally {
      setBusy(false);
    }
  };

  if (done) return <SubmittedState />;

  const pointName = point.data ? (point.data.name ?? t(`point.kind.${point.data.kind}`)) : null;

  return (
    <Screen safeTop={false} testID="report-screen">
      {pointName ? <AppText variant="title3">{pointName}</AppText> : null}
      <ChoiceChips
        testID="report-type"
        label={t('report.typeQuestion')}
        choices={REPORT_TYPES.map((value) => ({ value, label: t(`report.type.${value}`) }))}
        value={type}
        onChange={setType}
      />
      {type === 'potability_potable' || type === 'potability_not_potable' ? (
        <Banner
          tone="info"
          icon="water-check-outline"
          message={t('report.potabilityNotice')}
          live={false}
        />
      ) : null}
      <TextField
        label={commentRequired ? t('report.commentRequiredLabel') : t('contribute.comment')}
        hint={t('contribute.commentHint')}
        value={comment}
        onChangeText={setComment}
        multiline
        maxLength={500}
      />
      {error ? <Banner tone="error" icon="alert-circle-outline" message={error} /> : null}
      <Button
        testID="report-submit"
        label={t('report.submit')}
        icon="send-outline"
        size="lg"
        loading={busy}
        onPress={() => void submit()}
      />
      <AppText variant="footnote" tone="muted" align="center">
        {t('contribute.moderationNotice')}
      </AppText>
    </Screen>
  );
}
