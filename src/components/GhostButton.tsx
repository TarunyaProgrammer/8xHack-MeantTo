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
    height: 56,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: color.borderHi,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  pressed: { opacity: 0.55, transform: [{ scale: 0.98 }] },
  label: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
});
