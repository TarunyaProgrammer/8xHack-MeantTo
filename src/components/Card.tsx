import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { color, radius, shadow, space } from '../theme/tokens';

interface Props extends ViewProps {
  /** Lifts the panel and hardens the border — for the one card that matters. */
  hero?: boolean;
}

export function Card({ style, children, hero, ...rest }: Props) {
  return (
    <View style={[styles.card, hero && styles.hero, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: color.border,
    padding: space.lg,
    ...shadow.card,
  },
  hero: { backgroundColor: color.surfaceHi, borderColor: color.borderHi },
});
