import React from 'react';
import { ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface Props {
  children: React.ReactNode;
  /** Position in the sequence. Stagger is what makes a screen feel authored. */
  index?: number;
  style?: ViewStyle;
}

/**
 * Staggered entrance. Content arriving all at once is the single biggest tell
 * of a generated interface; 60ms apart reads as deliberate without feeling slow.
 */
export function Reveal({ children, index = 0, style }: Props) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60)
        .duration(420)
        .springify()
        .damping(18)}
      style={style}
    >
      {children}
    </Animated.View>
  );
}
