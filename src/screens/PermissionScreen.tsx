import React, { useEffect, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { GhostButton, HeroImage, PrimaryButton } from '../components';
import { color, radius, space } from '../theme/tokens';
import { type } from '../theme/type';
import { PermissionState } from '../lib/screenshots';
import { QUOTES } from '../lib/quotes';

interface Props {
  permission: PermissionState;
  onScan: () => void;
  /** Camera works without library access, so denial must not be a dead end. */
  onCamera: () => void;
}

export function PermissionScreen({ permission, onScan, onCamera }: Props) {
  const blocked = permission === 'denied';
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setQ((n) => (n + 1) % QUOTES.length), 5600);
    return () => clearInterval(id);
  }, []);

  const quote = QUOTES[q];

  return (
    <View style={styles.root}>
      <HeroImage index={q} />

      <View style={[styles.content, { paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + space.lg }]}>
        <Animated.View entering={FadeInDown.duration(700).springify().damping(20)}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Colour · Fit · Try-on</Text>
          </View>
          <Text style={styles.title}>Wear what{'\n'}actually suits you</Text>
        </Animated.View>

        <View style={{ flex: 1 }} />

        {/* Fixed height so a longer quote cannot shift the card under the thumb. */}
        <View style={{ height: 74, justifyContent: 'flex-end', marginBottom: space.md }}>
          <Animated.View key={q} entering={FadeIn.duration(700)} exiting={FadeOut.duration(320)}>
            <Text style={styles.quote}>“{quote.text}”</Text>
            {quote.by && <Text style={styles.by}>{quote.by}</Text>}
          </Animated.View>
        </View>

        <Animated.View
          entering={FadeInDown.delay(160).duration(700).springify().damping(20)}
          style={styles.panel}
        >
          <Text style={styles.panelTitle}>One photo. Real answers.</Text>
          <Text style={styles.panelBody}>
            Your season, your palette, and a look put on you.
          </Text>

          {blocked ? (
            <>
              <PrimaryButton
                label="Take a photo"
                onPress={onCamera}
                style={{ marginTop: space.md }}
              />
              <GhostButton
                label="Open Settings"
                onPress={() => Linking.openSettings()}
                style={{ marginTop: space.xs }}
              />
            </>
          ) : (
            <PrimaryButton label="Start" onPress={onScan} style={{ marginTop: space.md }} />
          )}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.ink },
  content: { flex: 1, paddingHorizontal: space.lg },

  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.chip,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    paddingHorizontal: space.sm,
    paddingVertical: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 42,
    lineHeight: 44,
    fontWeight: '800',
    letterSpacing: -1.6,
    marginTop: space.md,
  },

  quote: { color: 'rgba(255,255,255,0.94)', fontSize: 17, lineHeight: 23, fontWeight: '600' },
  by: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 6,
  },

  panel: {
    backgroundColor: color.surface,
    borderRadius: radius.card,
    padding: space.lg,
  },
  panelTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.6, color: color.ink },
  panelBody: { fontSize: 15, lineHeight: 21, color: color.muted, marginTop: 6 },
});
