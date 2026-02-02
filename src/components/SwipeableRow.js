import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, touchTargets, gradients, borderRadius } from '../constants/theme';

const SWIPE_THRESHOLD = 80;
const DELETE_BUTTON_WIDTH = 90;

export default function SwipeableRow({ children, onDelete, onEdit }) {
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          const maxSwipe = onEdit ? -DELETE_BUTTON_WIDTH * 2 : -DELETE_BUTTON_WIDTH;
          translateX.setValue(Math.max(gestureState.dx, maxSwipe));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -SWIPE_THRESHOLD) {
          const targetX = onEdit ? -DELETE_BUTTON_WIDTH * 2 : -DELETE_BUTTON_WIDTH;
          Animated.spring(translateX, {
            toValue: targetX,
            useNativeDriver: true,
            friction: 8,
          }).start();
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  const closeSwipe = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const handleDelete = () => {
    closeSwipe();
    onDelete?.();
  };

  const handleEdit = () => {
    closeSwipe();
    onEdit?.();
  };

  return (
    <View style={styles.container}>
      <View style={styles.actionsContainer}>
        {onEdit && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleEdit}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={gradients.ocean}
              style={styles.actionButtonGradient}
            >
              <Text style={styles.actionText}>Modifier</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleDelete}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#f43f5e', '#dc2626']}
            style={styles.actionButtonGradient}
          >
            <Text style={styles.actionText}>Supprimer</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      <Animated.View
        style={[styles.content, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  actionsContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: spacing.md,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingRight: spacing.xs,
  },
  actionButton: {
    width: DELETE_BUTTON_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: touchTargets.minimum,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  actionText: {
    color: colors.textInverse,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  content: {
    backgroundColor: colors.surface,
  },
});
