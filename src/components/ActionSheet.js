import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, touchTargets, shadows } from '../constants/theme';

/**
 * Menu contextuel en bottom sheet, à la place d'une `Alert.alert` détournée.
 * L'alerte système impose l'ordre de ses boutons sur Android et ne sait pas
 * porter d'icône : ici la liste garde l'ordre donné, du plus courant au plus
 * destructeur, et reste à portée de pouce.
 *
 * `options` : [{ label, icon, onPress, destructive }]
 * L'entrée « Annuler » est fournie par le composant, pas par l'appelant.
 */
export default function ActionSheet({ visible, title, subtitle, options = [], onClose }) {
  const insets = useSafeAreaInsets();
  const pendingAction = useRef(null);

  // L'action est mise en attente, puis jouée une fois la feuille fermée :
  // ouvrir une seconde modale (renommer, rappel) dans le même rendu que la
  // fermeture les fait se marcher dessus sur iOS, où la nouvelle modale ne
  // s'affiche alors jamais.
  const handleSelect = (option) => {
    pendingAction.current = option.onPress;
    onClose();
  };

  // `onDismiss` de `Modal` est iOS-only : on déclenche sur le passage à
  // invisible, qui a lieu sur les deux plateformes. Le délai laisse
  // l'animation de fermeture se terminer avant la modale suivante.
  useEffect(() => {
    if (visible || !pendingAction.current) return;

    const action = pendingAction.current;
    pendingAction.current = null;
    const timer = setTimeout(action, Platform.OS === 'ios' ? 350 : 0);
    return () => clearTimeout(timer);
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View
          style={[styles.container, { paddingBottom: spacing.md + insets.bottom }]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.handle} />

          {(title || subtitle) && (
            <View style={styles.header}>
              {title && <Text style={styles.title} numberOfLines={1}>{title}</Text>}
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
          )}

          {options.map((option) => (
            <TouchableOpacity
              key={option.label}
              style={styles.option}
              onPress={() => handleSelect(option)}
              activeOpacity={0.6}
              accessibilityRole="button"
              accessibilityLabel={option.label}
            >
              {option.icon && (
                <Ionicons
                  name={option.icon}
                  size={20}
                  color={option.destructive ? colors.danger : colors.textSecondary}
                />
              )}
              <Text style={[styles.optionText, option.destructive && styles.optionTextDestructive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            activeOpacity={0.6}
            accessibilityRole="button"
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    ...shadows.xl,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.warmGray300,
    borderRadius: borderRadius.xs,
    alignSelf: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    minHeight: touchTargets.comfortable,
  },
  optionText: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
  },
  optionTextDestructive: {
    color: colors.danger,
  },
  cancelButton: {
    marginTop: spacing.sm,
    marginHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    backgroundColor: colors.warmGray100,
    minHeight: touchTargets.minimum,
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
});
