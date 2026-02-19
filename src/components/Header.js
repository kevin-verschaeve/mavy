import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, spacing, typography, borderRadius, touchTargets, shadows } from '../constants/theme';

/**
 * Unified Header component for all screens.
 *
 * Props:
 *   title        (string)   – main title text
 *   subtitle     (string)   – small label above title; null = no subtitle row
 *   count        (number)   – count badge next to title; null = no badge
 *   onBack       (function) – back button handler; null = no back button
 *   onAdd        (function) – add button handler; null = no add button
 *   addOpen      (boolean)  – show × instead of + in the add button
 *   extended     (boolean)  – HomeScreen layout (large title, rounded bottom, profile chip)
 *   profile      (object)   – { name, onPress } profile chip (extended only)
 */
export default function Header({
  title,
  subtitle = null,
  count = null,
  onBack = null,
  onAdd = null,
  addOpen = false,
  extended = false,
  profile = null,
}) {
  const gradientColors = __DEV__ ? ['#064e3b', '#065f46'] : gradients.night;

  const DevBadge = () => __DEV__ ? (
    <View style={styles.devBadge}>
      <Text style={styles.devBadgeText}>DEV</Text>
    </View>
  ) : null;

  const CountBadge = () => count !== null ? (
    <View style={styles.countBadge}>
      <Text style={styles.countBadgeText}>{count}</Text>
    </View>
  ) : null;

  const AddButton = () => {
    if (!onAdd) return null;

    if (extended) {
      return (
        <TouchableOpacity
          style={styles.addButtonLarge}
          onPress={onAdd}
          accessibilityLabel="Ajouter"
          accessibilityRole="button"
        >
          <LinearGradient colors={gradients.primary} style={styles.addButtonLargeGradient}>
            <Ionicons name="add" size={32} color={colors.textInverse} />
          </LinearGradient>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={styles.addButtonSmall}
        onPress={onAdd}
        accessibilityLabel="Ajouter"
        accessibilityRole="button"
      >
        <LinearGradient colors={gradients.primary} style={styles.addButtonSmallGradient}>
          <Text style={styles.addButtonText}>{addOpen ? '×' : '+'}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  if (extended) {
    return (
      <>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.containerExtended}
        >
          <View style={styles.contentExtended}>
            <View style={styles.extendedLeft}>
              <View style={styles.titleRow}>
                <Text style={styles.titleExtended}>{title}</Text>
                <CountBadge />
                <DevBadge />
              </View>
              {profile && (
                <TouchableOpacity
                  style={styles.profileButton}
                  onPress={profile.onPress}
                  activeOpacity={0.7}
                >
                  <Ionicons name="person-circle-outline" size={16} color={colors.textInverse} />
                  <Text style={styles.profileButtonText}>{profile.name}</Text>
                </TouchableOpacity>
              )}
            </View>
            <AddButton />
          </View>
        </LinearGradient>
      </>
    );
  }

  // Standard layout
  return (
    <>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <View style={styles.content}>
          {/* Left: back button or spacer */}
          <View style={styles.leftSection}>
            {onBack && (
              <TouchableOpacity style={styles.backButton} onPress={onBack} accessibilityLabel="Retour">
                <Ionicons name="arrow-back" size={28} color={colors.textInverse} />
              </TouchableOpacity>
            )}
          </View>

          {/* Center: subtitle + title */}
          <View style={styles.middleSection}>
            {subtitle && (
              <View style={styles.subtitleRow}>
                <Text style={styles.subtitle}>{subtitle}</Text>
                <DevBadge />
              </View>
            )}
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={1}>{title}</Text>
              <CountBadge />
              {!subtitle && <DevBadge />}
            </View>
          </View>

          {/* Right: add button or spacer */}
          <View style={styles.rightSection}>
            <AddButton />
          </View>
        </View>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  // ── Extended (HomeScreen) ────────────────────────────────────────────
  containerExtended: {
    paddingTop: spacing.huge + spacing.lg,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xl,
    borderBottomLeftRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.xxl,
  },
  contentExtended: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  extendedLeft: {
    flex: 1,
  },
  titleExtended: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
    color: colors.textInverse,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
  },
  profileButtonText: {
    fontSize: typography.sizes.sm,
    color: colors.textInverse,
    marginLeft: spacing.xs,
    fontWeight: typography.weights.medium,
  },
  addButtonLarge: {
    ...shadows.primary,
  },
  addButtonLargeGradient: {
    width: touchTargets.large,
    height: touchTargets.large,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Standard ─────────────────────────────────────────────────────────
  container: {
    paddingTop: spacing.huge,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftSection: {
    width: touchTargets.minimum,
    alignItems: 'flex-start',
  },
  middleSection: {
    flex: 1,
  },
  rightSection: {
    width: touchTargets.minimum,
    alignItems: 'flex-end',
  },
  backButton: {
    width: touchTargets.minimum,
    height: touchTargets.minimum,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.warmGray400,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.textInverse,
    flexShrink: 1,
  },
  addButtonSmall: {
    borderRadius: touchTargets.minimum / 2,
    overflow: 'hidden',
    ...shadows.primary,
  },
  addButtonSmallGradient: {
    width: touchTargets.minimum,
    height: touchTargets.minimum,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: colors.textInverse,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.medium,
  },

  // ── Shared badges ─────────────────────────────────────────────────────
  countBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    marginLeft: spacing.sm,
  },
  countBadgeText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textInverse,
  },
  devBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
  },
  devBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: '#ffffff',
    letterSpacing: 1,
  },
});
