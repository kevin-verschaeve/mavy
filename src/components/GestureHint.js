import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

const HINT_STORAGE_KEY = 'gesture_hints_shown';

export default function GestureHint({ id, message, children, showOnce = true }) {
  const [visible, setVisible] = useState(false);
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkAndShowHint();
  }, []);

  const checkAndShowHint = async () => {
    try {
      const hintsShown = await AsyncStorage.getItem(HINT_STORAGE_KEY);
      const hints = hintsShown ? JSON.parse(hintsShown) : {};

      if (showOnce && hints[id]) {
        return;
      }

      // Afficher le hint après un délai
      setTimeout(() => {
        setVisible(true);
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();

        // Marquer comme vu
        if (showOnce) {
          hints[id] = true;
          AsyncStorage.setItem(HINT_STORAGE_KEY, JSON.stringify(hints));
        }

        // Auto-hide après 5 secondes
        setTimeout(() => {
          hideHint();
        }, 5000);
      }, 1000);
    } catch (error) {
      console.error('Error checking hint:', error);
    }
  };

  const hideHint = () => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  };

  return (
    <View style={styles.container}>
      {children}
      {visible && (
        <Animated.View style={[styles.hintContainer, { opacity }]}>
          <TouchableOpacity onPress={hideHint} style={styles.hint}>
            <Text style={styles.hintText}>{message}</Text>
            <Text style={styles.dismissText}>Appuyez pour fermer</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

// Composant pour afficher un hint inline (sous un élément)
export function InlineHint({ message, visible }) {
  if (!visible) return null;

  return (
    <View style={styles.inlineHint}>
      <Text style={styles.inlineHintText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  hintContainer: {
    position: 'absolute',
    bottom: '100%',
    left: spacing.lg,
    right: spacing.lg,
    marginBottom: spacing.sm,
    zIndex: 1000,
  },
  hint: {
    backgroundColor: colors.gray800,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  hintText: {
    color: colors.textInverse,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },
  dismissText: {
    color: colors.gray400,
    fontSize: typography.sizes.xs,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  inlineHint: {
    backgroundColor: colors.primaryLight,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  inlineHintText: {
    color: colors.gray700,
    fontSize: typography.sizes.sm,
  },
});
