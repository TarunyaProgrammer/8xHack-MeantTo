import React, { useEffect } from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { color, radius } from '../theme/tokens';

interface Props {
  width: number;
  height: number;
  style?: ViewStyle;
  borderRadius?: number;
}

/**
 * Skeleton placeholder. A moving highlight reads as "loading" far better than
 * a spinner does — it implies the shape of what is coming, and it makes a 25s
 * wait feel like progress rather than a hang.
 *
 * The gradient is drawn with react-native-svg so this needs no extra native
 * module and therefore no rebuild.
 */
export function Shimmer({ width, height, style, borderRadius = radius.tile }: Props) {
  const x = useSharedValue(-1);

  useEffect(() => {
    x.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
      -1,
      false
    );
  }, [x]);

  const sweep = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value * width }],
  }));

  return (
    <View
      style={[{ width, height, borderRadius, backgroundColor: color.surfaceHi, overflow: 'hidden' }, style]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, sweep]}>
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="sheen" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={color.accent} stopOpacity="0" />
              <Stop offset="0.5" stopColor={color.accent} stopOpacity="0.16" />
              <Stop offset="1" stopColor={color.accent} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width={width} height={height} fill="url(#sheen)" />
        </Svg>
      </Animated.View>
    </View>
  );
}
