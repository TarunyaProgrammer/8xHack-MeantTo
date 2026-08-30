import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { color, radius } from '../theme/tokens';

interface Props {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
  tone?: 'default' | 'danger';
}

export function GhostButton({ label, onPress, style, tone = 'default' }: Props) {
  const tint = tone === 'danger' ? color.danger : color.ink;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, style]}
    >
      <Text style={[styles.label, { color: tint }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: color.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
  label: { fontSize: 16, fontWeight: '600' },
});
