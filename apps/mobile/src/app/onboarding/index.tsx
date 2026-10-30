import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ReduceMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button, Icon, type IconName } from '@/components/ui';
import { useAppTheme } from '@/theme';

type SlideKey = 'slide1' | 'slide2' | 'slide3';

const SLIDES: { key: SlideKey; icon: IconName }[] = [
  { key: 'slide1', icon: 'map-marker-radius' },
  { key: 'slide2', icon: 'shield-check-outline' },
  { key: 'slide3', icon: 'account-group-outline' },
];

/** Présentation de Water Finder (3 étapes), puis demande d'autorisation de localisation. */
export default function OnboardingScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index] ?? SLIDES[0]!;
  const isLast = index === SLIDES.length - 1;

  const goToLocation = () => router.push('/onboarding/location');

  return (
    <View
      testID="onboarding-screen"
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          paddingTop: insets.top + theme.space.sm,
          paddingBottom: insets.bottom + theme.space.lg,
          paddingHorizontal: theme.space['2xl'],
        },
      ]}
    >
      <View style={styles.topBar}>
        <Pressable
          testID="onboarding-skip"
          accessibilityRole="button"
          accessibilityLabel={t('common.skip')}
          hitSlop={12}
          onPress={goToLocation}
          style={styles.skip}
        >
          <AppText variant="label" tone="primary">
            {t('common.skip')}
          </AppText>
        </Pressable>
      </View>

      <Animated.View
        key={slide.key}
        entering={FadeIn.duration(280).reduceMotion(ReduceMotion.System)}
        exiting={FadeOut.duration(120).reduceMotion(ReduceMotion.System)}
        style={[styles.slide, { gap: theme.space['2xl'] }]}
      >
        <View style={[styles.illustration, { backgroundColor: theme.colors.primarySoft }]}>
          <View style={[styles.illustrationInner, { backgroundColor: theme.colors.primary }]}>
            <Icon name={slide.icon} size={64} color={theme.colors.onPrimary} />
          </View>
        </View>
        <View style={{ gap: theme.space.md }}>
          <AppText variant="display" align="center" accessibilityRole="header">
            {t(`onboarding.${slide.key}Title`)}
          </AppText>
          <AppText variant="body" tone="secondary" align="center">
            {t(`onboarding.${slide.key}Body`)}
          </AppText>
        </View>
      </Animated.View>

      <View style={{ gap: theme.space.xl }}>
        <View
          style={[styles.dots, { gap: theme.space.sm }]}
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={t('onboarding.progress', {
            current: index + 1,
            total: SLIDES.length,
          })}
        >
          {SLIDES.map((item, dotIndex) => (
            <View
              key={item.key}
              style={[
                styles.dot,
                {
                  width: dotIndex === index ? 24 : 8,
                  backgroundColor: dotIndex === index ? theme.colors.primary : theme.colors.border,
                },
              ]}
            />
          ))}
        </View>
        <Button
          testID="onboarding-next"
          size="lg"
          label={isLast ? t('onboarding.start') : t('common.next')}
          onPress={() => (isLast ? goToLocation() : setIndex(index + 1))}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  skip: {
    minHeight: 48,
    minWidth: 48,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustration: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationInner: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
