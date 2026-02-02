import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  TouchableOpacity,
} from 'react-native';
import { colors, spacing, typography, touchTargets } from '../constants/theme';

const SWIPE_THRESHOLD = 80;
const DELETE_BUTTON_WIDTH = 80;

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
            style={[styles.actionButton, styles.editButton]}
            onPress={handleEdit}
          >
            <Text style={styles.actionText}>Modifier</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDelete}
        >
          <Text style={styles.actionText}>Supprimer</Text>
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
    bottom: 0,
    flexDirection: 'row',
  },
  actionButton: {
    width: DELETE_BUTTON_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: touchTargets.minimum,
  },
  editButton: {
    backgroundColor: colors.primary,
  },
  deleteButton: {
    backgroundColor: colors.danger,
  },
  actionText: {
    color: colors.textInverse,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  content: {
    backgroundColor: colors.surface,
  },
});
