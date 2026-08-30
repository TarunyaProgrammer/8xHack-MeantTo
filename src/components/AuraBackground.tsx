import React, { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { color } from '../theme/tokens';

/**
 * Drifting colour fields behind the landing screen.
 *
 * Soft radial gradients rather than a blur filter — react-native-svg's blur
 * support is patchy across Android versions, and a wide gradient stop reads as
 * the same diffuse glow with none of the risk. No new native module, so this
 * costs no rebuild.
 */

interface BlobProps {
  tint: string;
  size: number;
  from: { x: number; y: number };
  to: { x: number; y: number };
  duration: number;
  delay?: number;
  id: string;
}

function Blob({ tint, size, from, to, duration, delay = 0, id }: BlobProps) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [t, duration]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: from.x + (to.x - from.x) * t.value },
      { translateY: from.y + (to.y - from.y) * t.value },
      { scale: 0.9 + t.value * 0.25 },
    ],
  }));

  return (
    <Animated.View style={[styles.blob, { width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={tint} stopOpacity="0.55" />
            <Stop offset="0.55" stopColor={tint} stopOpacity="0.18" />
            <Stop offset="1" stopColor={tint} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
}

export function AuraBackground() {
  const { width, height } = useWindowDimensions();
  const s = Math.max(width, height) * 0.85;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Blob
        id="a"
        tint={color.accent}
        size={s}
        from={{ x: -s * 0.32, y: -s * 0.18 }}
        to={{ x: width - s * 0.55, y: s * 0.1 }}
        duration={11000}
      />
      <Blob
        id="b"
        tint={color.hot}
        size={s * 0.9}
        from={{ x: width - s * 0.6, y: height * 0.34 }}
        to={{ x: -s * 0.12, y: height * 0.5 }}
        duration={14000}
      />
      <Blob
        id="c"
        tint={color.violet}
        size={s * 0.75}
        from={{ x: width * 0.1, y: height * 0.62 }}
        to={{ x: width * 0.5, y: height * 0.4 }}
        duration={17000}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  blob: { position: 'absolute' },
});
