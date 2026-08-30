import React, { useEffect } from 'react';
import { Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { color } from '../theme/tokens';

const IMAGES = [
  require('../../assets/collage/1.jpg'),
  require('../../assets/collage/4.jpg'),
  require('../../assets/collage/6.jpg'),
  require('../../assets/collage/2.jpg'),
];

interface Props {
  index: number;
}

/**
 * Full-bleed hero with a slow push-in and a gradient scrim.
 *
 * The scrim is the reason white type stays legible over unpredictable
 * photography — a flat translucent wash cannot, because it lightens dark
 * frames and darkens light ones by the same amount. A gradient anchored dark
 * at the top guarantees the headline always has something to sit on.
 */
export function HeroImage({ index }: Props) {
  const { width, height } = useWindowDimensions();
  const zoom = useSharedValue(0);

  useEffect(() => {
    zoom.value = withRepeat(
      withTiming(1, { duration: 14000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [zoom]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 1.06 + zoom.value * 0.09 }, { translateY: zoom.value * -10 }],
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, style]}>
        <Image
          source={IMAGES[index % IMAGES.length]}
          style={{ width, height }}
          resizeMode="cover"
        />
      </Animated.View>

      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#0C0E0C" stopOpacity="0.82" />
            <Stop offset="0.42" stopColor="#0C0E0C" stopOpacity="0.42" />
            <Stop offset="0.72" stopColor="#0C0E0C" stopOpacity="0.55" />
            <Stop offset="1" stopColor="#0C0E0C" stopOpacity="0.86" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width={width} height={height} fill="url(#scrim)" />
      </Svg>
    </View>
  );
}
