import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Screen } from '../components';
import { color, radius, space } from '../theme/tokens';
import { type } from '../theme/type';

/**
 * Named steps rather than a spinner. A spinner says "wait"; naming the work
 * says what you are waiting for, which is what makes a slow call feel
 * intentional instead of broken.
 */
const STEPS = ['Reading undertone', 'Measuring contrast', 'Finding your season', 'Building the fit'];

const BARS = 5;

interface Props {
  done: number;
  total: number;
}

function Bar({ index }: { index: number }) {
  const v = useSharedValue(0.25);

  useEffect(() => {
    v.value = withRepeat(
      withTiming(1, { duration: 620, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [v]);

  // Each bar starts further through the cycle, so they read as a wave.
  const style = useAnimatedStyle(() => {
    const offset = (index / BARS) * 0.8;
    const t = (v.value + offset) % 1;
    const eased = 0.25 + Math.abs(0.5 - t) * 1.5;
    return { transform: [{ scaleY: eased }] };
  });

  return <Animated.View style={[styles.bar, style]} />;
}

export function ScanningScreen({ done, total }: Props) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStep((s) => {
        if (s < STEPS.length - 1) void Haptics.selectionAsync().catch(() => {});
        return (s + 1) % STEPS.length;
      });
    }, 1600);
    return () => clearInterval(id);
  }, []);

  return (
    <Screen center>
      <View style={{ alignItems: 'center' }}>
        <View style={styles.bars}>
          {Array.from({ length: BARS }, (_, i) => (
            <Bar key={i} index={i} />
          ))}
        </View>

        {total > 0 && <Text style={[type.number, { marginTop: space.lg }]}>{done}</Text>}

        <Animated.Text
          key={step}
          entering={FadeIn.duration(280)}
          exiting={FadeOut.duration(160)}
          style={[type.h1, { marginTop: space.xl, textAlign: 'center' }]}
        >
          {STEPS[step]}
        </Animated.Text>

        <View style={styles.dots}>
          {STEPS.map((label, i) => (
            <View key={label} style={[styles.dot, i === step && styles.dotOn]} />
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  bars: { flexDirection: 'row', alignItems: 'center', gap: 7, height: 76 },
  bar: {
    width: 9,
    height: 76,
    borderRadius: radius.chip,
    backgroundColor: color.accent,
  },
  dots: { flexDirection: 'row', gap: 6, marginTop: space.lg },
  dot: { width: 6, height: 6, borderRadius: 999, backgroundColor: color.border },
  dotOn: { backgroundColor: color.accent, width: 18 },
});
