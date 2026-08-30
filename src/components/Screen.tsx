import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, gutter } from '../theme/tokens';

interface Props {
  children: React.ReactNode;
  /** Centre content vertically — used by the permission and scanning screens. */
  center?: boolean;
  style?: ViewStyle;
}

export function Screen({ children, center, style }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + gutter, paddingBottom: insets.bottom + gutter },
        center && styles.center,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bg,
    paddingHorizontal: gutter,
  },
  center: { justifyContent: 'center' },
});
