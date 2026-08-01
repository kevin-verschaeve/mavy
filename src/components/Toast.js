import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows, animation } from '../constants/theme';

const ToastContext = createContext(null);

const TOAST_DURATION = 3000;
const ENTER_OFFSET = 24;

/**
 * Snackbar de confirmation, ancré en bas d'écran.
 *
 * Le bas est la seule zone libre de contrôles : tous les boutons d'action
 * (+, ×, retour, profil) vivent dans le Header. Un toast en haut recouvrait
 * le bouton + et débordait sous la status bar.
 *
 * Un seul message à la fois : pour des confirmations de 3s, empiler ne fait
 * qu'ajouter du bruit. Un nouveau message remplace le précédent.
 */
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const toastId = useRef(0);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ id: toastId.current++, message, type });
  }, []);

  const hideToast = useCallback((id) => {
    setToast((current) => (current && current.id === id ? null : current));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Snackbar
          // La clé force un remontage : le nouveau message rejoue l'animation
          // d'entrée et repart sur un timer neuf au lieu d'hériter de l'ancien.
          key={toast.id}
          toast={toast}
          onHide={() => hideToast(toast.id)}
        />
      )}
    </ToastContext.Provider>
  );
}

function Snackbar({ toast, onHide }) {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(ENTER_OFFSET)).current;

  useEffect(() => {
    let dismissed = false;

    const animateTo = (toOpacity, toTranslate, onDone) =>
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: toOpacity,
          duration: animation.normal,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: toTranslate,
          duration: animation.normal,
          useNativeDriver: true,
        }),
      ]).start(onDone);

    animateTo(1, 0);

    const timeout = setTimeout(() => {
      dismissed = true;
      animateTo(0, ENTER_OFFSET, onHide);
    }, TOAST_DURATION);

    return () => {
      clearTimeout(timeout);
      // Démontage anticipé (nouveau toast) : ne pas laisser le timer déclencher
      // onHide, il effacerait le message qui vient de le remplacer.
      if (!dismissed) opacity.stopAnimation();
    };
  }, []);

  const isError = toast.type === 'error';

  return (
    <View
      style={[styles.container, { paddingBottom: insets.bottom + spacing.lg }]}
      pointerEvents="box-none"
    >
      <Animated.View
        style={[
          styles.snackbar,
          isError && styles.snackbarError,
          { opacity, transform: [{ translateY }] },
        ]}
      >
        <Ionicons
          name={isError ? 'alert-circle' : 'checkmark-circle'}
          size={18}
          color={isError ? colors.textInverse : colors.success}
        />
        <Text style={styles.text} numberOfLines={2}>
          {toast.message}
        </Text>
        <TouchableOpacity
          onPress={onHide}
          style={styles.closeButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Fermer la notification"
          accessibilityRole="button"
        >
          <Ionicons name="close" size={16} color={colors.warmGray400} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  snackbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    maxWidth: '100%',
    paddingVertical: spacing.md,
    paddingLeft: spacing.lg,
    paddingRight: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.warmGray900,
    ...shadows.lg,
  },
  snackbarError: {
    backgroundColor: colors.danger,
  },
  text: {
    color: colors.textInverse,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    flexShrink: 1,
  },
  closeButton: {
    padding: spacing.xs,
  },
});
