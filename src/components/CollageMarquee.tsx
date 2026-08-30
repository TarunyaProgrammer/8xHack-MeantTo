import React, { useEffect } from 'react';
import { Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { color, radius, space } from '../theme/tokens';

const IMAGES = [
  require('../../assets/collage/1.jpg'),
  require('../../assets/collage/2.jpg'),
  require('../../assets/collage/3.jpg'),
  require('../../assets/collage/4.jpg'),
  require('../../assets/collage/5.jpg'),
  require('../../assets/collage/6.jpg'),
];

/**
 * Three columns of photography drifting vertically at different speeds.
 *
 * The tile list is duplicated and the track translates by exactly one copy's
 * height, so the loop point is invisible — that seam is what makes most
 * marquees look cheap. Columns move in opposite directions at unrelated
 * durations so they never resynchronise.
 */
function Column({
  images,
  width,
  speed,
  up,
}: {
  images: number[];
  width: number;
  speed: number;
  up: boolean;
}) {
  const tileH = width * 1.38;
  const gap = space.sm;
  const runH = images.length * (tileH + gap);
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: speed, easing: Easing.linear }), -1, false);
  }, [t, speed]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: up ? -t.value * runH : t.value * runH - runH }],
  }));

  return (
    <View style={{ width, overflow: 'hidden' }}>
      <Animated.View style={style}>
        {[...images, ...images].map((src, i) => (
          <Image
            key={i}
            source={IMAGES[src]}
            style={{
              width,
              height: tileH,
              marginBottom: gap,
              borderRadius: radius.tile,
              backgroundColor: color.surfaceHi,
            }}
            resizeMode="cover"
          />
        ))}
      </Animated.View>
    </View>
  );
}

export function CollageMarquee() {
  const { width } = useWindowDimensions();
  const col = (width - space.sm * 2) / 2.6;

  return (
    <View style={styles.wrap} pointerEvents="none">
      <View style={styles.cols}>
        <Column images={[0, 3, 1]} width={col} speed={26000} up />
        <Column images={[2, 5, 4]} width={col} speed={31000} up={false} />
        <Column images={[4, 1, 5]} width={col} speed={36000} up />
      </View>
      {/* Two-stage wash: an overall lift, then a heavier band across the lower
          half where the headline, quote and action sit. */}
      <View style={styles.veil} />
      <View style={styles.veilStrong} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { ...StyleSheet.absoluteFillObject },
  cols: {
    flexDirection: 'row',
    gap: space.sm,
    transform: [{ rotate: '-8deg' }, { scale: 1.35 }],
  },
  veil: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(247,242,234,0.72)' },
  veilStrong: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '18%',
    bottom: 0,
    backgroundColor: 'rgba(247,242,234,0.9)',
  },
});
