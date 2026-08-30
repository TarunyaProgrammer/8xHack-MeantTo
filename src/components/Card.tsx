import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { color, radius, shadow, space } from '../theme/tokens';

export function Card({ style, children, ...rest }: ViewProps) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.bg,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: color.border,
    padding: space.lg,
    ...shadow.card,
  },
});
