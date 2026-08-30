import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { color, radius, shadow } from '../theme/tokens';

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  tone?: 'accent' | 'hot';
}

export function PrimaryButton({ label, onPress, disabled, loading, style, tone = 'accent' }: Props) {
  const inactive = disabled || loading;
  const fill = tone === 'hot' ? color.hot : color.accent;
  const label_ = color.onAccent;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={inactive}
      onPress={() => {
        // Haptics are cosmetic and unavailable on some devices. A failure here
        // must never swallow the tap.
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: inactive ? color.surfaceHi : fill },

        pressed && !inactive && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color.onAccent} />
      ) : (
        <Text style={[styles.label, { color: inactive ? color.faint : label_ }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 60,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  pressed: { transform: [{ scale: 0.97 }], opacity: 0.9 },
  label: { fontSize: 17, fontWeight: '800', letterSpacing: -0.2 },
});
