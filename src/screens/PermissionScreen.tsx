import React, { useEffect, useState } from 'react';
import { Linking, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Chip, CollageMarquee, GhostButton, PrimaryButton, Screen } from '../components';
import { color, space } from '../theme/tokens';
import { type } from '../theme/type';
import { PermissionState } from '../lib/screenshots';
import { QUOTES } from '../lib/quotes';

interface Props {
  permission: PermissionState;
  onScan: () => void;
  /** Camera works without library access, so denial must not be a dead end. */
  onCamera: () => void;
}

/** A slow drift on the headline keeps the screen alive without asking for attention. */
function useFloat() {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 4200, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [t]);
  return useAnimatedStyle(() => ({ transform: [{ translateY: -4 + t.value * 8 }] }));
}

export function PermissionScreen({ permission, onScan, onCamera }: Props) {
  const blocked = permission === 'denied';
  const float = useFloat();
  const [q, setQ] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setQ((n) => (n + 1) % QUOTES.length), 5200);
    return () => clearInterval(id);
  }, []);

  const quote = QUOTES[q];

  return (
    <Screen center>
      <CollageMarquee />

      <Animated.View entering={FadeInDown.duration(600).springify().damping(18)}>
        <Chip label="Colour · Fit · Try-on" tone="accent" />
      </Animated.View>

      <Animated.View style={float}>
        <Animated.Text
          entering={FadeInDown.delay(90).duration(600).springify().damping(18)}
          style={[type.mega, { marginTop: space.md }]}
        >
          YOUR{'\n'}COLOURS
        </Animated.Text>
      </Animated.View>

      <Animated.Text
        entering={FadeInDown.delay(160).duration(600)}
        style={[type.body, { color: color.muted, marginTop: space.sm }]}
      >
        One photo. Real answers.
      </Animated.Text>

      {/* Fixed height so a longer quote cannot shift the button under the user's thumb. */}
      <View style={{ height: 92, justifyContent: 'center', marginTop: space.xl }}>
        <Animated.View key={q} entering={FadeIn.duration(600)} exiting={FadeOut.duration(300)}>
          <View style={{ width: 3, height: 22, backgroundColor: color.hot, marginBottom: space.sm }} />
          <Text style={[type.h2, { lineHeight: 26 }]}>{quote.text}</Text>
          {quote.by && (
            <Text style={[type.caption, { marginTop: 6 }]}>{quote.by}</Text>
          )}
        </Animated.View>
      </View>

      <Animated.View entering={FadeInDown.delay(240).duration(600)} style={{ marginTop: space.lg }}>
        {blocked ? (
          <>
            <Text style={[type.bodyMuted, { marginBottom: space.md }]}>Photo access is off.</Text>
            <PrimaryButton label="Take a photo instead" onPress={onCamera} />
            <GhostButton
              label="Open Settings"
              onPress={() => Linking.openSettings()}
              style={{ marginTop: space.sm }}
            />
          </>
        ) : (
          <PrimaryButton label="Start" onPress={onScan} />
        )}
      </Animated.View>
    </Screen>
  );
}
