import { StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/Icon';
import { useAppTheme } from '@/theme';

import { withAlpha } from './BrandHero';
import { Bubbles } from './Bubbles';
import { DropMascot } from './DropMascot';

/**
 * Scène d'illustration (présentation, autorisations) : un bassin clair où montent des bulles,
 * la mascotte et une pastille d'icône qui résume l'écran. Décorative.
 */
export function MascotStage({ icon, size = 220 }: { icon: IconName; size?: number }) {
  const theme = useAppTheme();
  return (
    <View
      style={[styles.stage, { width: size, height: size }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.pool,
          { borderRadius: size / 2, backgroundColor: theme.colors.primarySoft },
        ]}
      >
        <Bubbles rise={size * 0.75} color={withAlpha(theme.colors.primary, 0.55)} />
      </View>
      <DropMascot
        size={size * 0.44}
        ripplesColor={theme.colors.primary}
        accessory={
          <View
            style={[
              styles.badge,
              { backgroundColor: theme.colors.primary, borderColor: theme.colors.primarySoft },
            ]}
          >
            <Icon name={icon} size={24} color={theme.colors.onPrimary} />
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pool: {
    overflow: 'hidden',
  },
  badge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
