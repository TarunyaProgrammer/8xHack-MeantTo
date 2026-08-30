import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, gutter } from '../theme/tokens';
import { TAB_CLEARANCE } from './TabBar';

interface Props {
  children: React.ReactNode;
  /** Centre content vertically — used by the permission and scanning screens. */
  center?: boolean;
  /**
   * Reserve room for the floating tab bar. Only for screens whose content is
   * NOT scrollable — a scroll view should pad its own content instead, so the
   * list scrolls under the bar rather than stopping short of it.
   */
  tabSafe?: boolean;
  style?: ViewStyle;
}

export function Screen({ children, center, tabSafe, style }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.screen,
        {
          paddingTop: insets.top + gutter,
          paddingBottom: insets.bottom + gutter + (tabSafe ? TAB_CLEARANCE : 0),
        },
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
