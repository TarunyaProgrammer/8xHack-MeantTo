import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  FadeIn,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Icon } from './Icon';
import { Shimmer } from './Shimmer';
import { color, radius, space } from '../theme/tokens';
import { type } from '../theme/type';

export interface DeckItem {
  key: string;
  label: string;
  caption: string;
  image: string | null;
  error: string | null;
}

interface Props {
  items: DeckItem[];
  original: string;
  onOpen: (index: number) => void;
  /** Horizontal padding the parent screen applies, so the deck can escape it. */
  gutter: number;
}

/**
 * Stacked carousel — the active card sits in front, its neighbours tucked
 * behind it on both sides.
 *
 * Neighbours are pulled inward so they slide *under* the centre card rather
 * than sitting beside it, scaled down, dimmed, and pushed back with zIndex.
 * Without the inward translate they read as a filmstrip; without the zIndex
 * they would draw over the card in front on one side and behind on the other.
 *
 * Still a ScrollView with snapToInterval rather than a gesture library:
 * momentum and snapping come out native, and it adds no module that would
 * force another dev build.
 */
function Anim({ scroll, index, step, children }: {
  scroll: SharedValue<number>;
  index: number;
  step: number;
  children: React.ReactNode;
}) {
  const style = useAnimatedStyle(() => {
    const at = scroll.value / step;
    const offset = at - index;
    const distance = Math.abs(offset);

    return {
      // Pull neighbours toward the centre so they tuck under the active card.
      transform: [
        { translateX: interpolate(offset, [-1, 0, 1], [step * 0.16, 0, -step * 0.16], 'clamp') },
        { scale: interpolate(distance, [0, 1], [1, 0.86], 'clamp') },
      ],
      opacity: interpolate(distance, [0, 1, 2], [1, 0.6, 0.25], 'clamp'),
      // Nearest card draws on top, so the stack layers correctly on both sides.
      zIndex: Math.round(100 - distance * 10),
    };
  });

  return <Animated.View style={style}>{children}</Animated.View>;
}

export function LookDeck({ items, original, onOpen, gutter }: Props) {
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const scroll = useSharedValue(0);

  // Cards are narrower than the screen so the neighbours show behind them.
  const cardW = Math.round(width * 0.76);
  const step = cardW;
  const sidePad = Math.round((width - cardW) / 2);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scroll.value = e.contentOffset.x;
    },
  });

  return (
    <View>
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        onScroll={onScroll}
        scrollEventThrottle={16}
        snapToInterval={step}
        snapToAlignment="start"
        style={{ marginHorizontal: -gutter }}
        contentContainerStyle={{ paddingHorizontal: sidePad + gutter }}
        onMomentumScrollEnd={(e) => {
          const next = Math.round(e.nativeEvent.contentOffset.x / step);
          if (next !== page) {
            setPage(next);
            void Haptics.selectionAsync().catch(() => {});
          }
        }}
      >
        {items.map((item, i) => (
          <View key={item.key} style={{ width: step }}>
            <Anim scroll={scroll} index={i} step={step}>
              <Pressable onPress={() => onOpen(i)}>
                <View style={[styles.card, { width: cardW }]}>
                {item.image ? (
                  <Animated.Image
                    entering={FadeIn.duration(450)}
                    source={{ uri: item.image }}
                    style={{ width: cardW, height: cardW * 1.42 }}
                    resizeMode="cover"
                  />
                ) : item.error ? (
                  <View style={[styles.fallback, { width: cardW, height: cardW * 1.42 }]}>
                    <Text style={[type.bodyMuted, { textAlign: 'center' }]}>Couldn't render</Text>
                  </View>
                ) : (
                  <View>
                    <Shimmer width={cardW} height={cardW * 1.42} borderRadius={0} />
                    <Image
                      source={{ uri: original }}
                      style={{ position: 'absolute', width: cardW, height: cardW * 1.42, opacity: 0.14 }}
                    />
                  </View>
                )}

                  <View style={styles.meta}>
                    <Text style={styles.label}>{item.label}</Text>
                    <Text style={[type.body, { fontWeight: '700', marginTop: 4 }]} numberOfLines={2}>
                      {item.caption}
                    </Text>

                    {/* An explicit action. The card was tappable before, but
                        nothing on it said so, so the shop links were invisible. */}
                    <View style={styles.cta}>
                      <Text style={styles.ctaText}>Shop this look</Text>
                      <Icon name="link" size={14} color={color.onAccent} strokeWidth={2.4} />
                    </View>
                  </View>
                </View>
              </Pressable>
            </Anim>
          </View>
        ))}
      </Animated.ScrollView>

      <View style={styles.dots}>
        {items.map((item, i) => (
          <View key={item.key} style={[styles.dot, i === page && styles.dotOn]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    backgroundColor: color.surface,
    overflow: 'hidden',
    // The front card has to cast onto the ones tucked behind it, or the stack
    // reads flat.
    shadowColor: '#1A1A18',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  fallback: { backgroundColor: color.surfaceHi, alignItems: 'center', justifyContent: 'center' },
  meta: { padding: space.md },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: space.md,
    paddingVertical: 13,
    borderRadius: radius.button,
    backgroundColor: color.accent,
  },
  ctaText: { color: color.onAccent, fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: color.faint,
  },
  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: space.md },
  dot: { width: 6, height: 6, borderRadius: 999, backgroundColor: color.borderHi },
  dotOn: { backgroundColor: color.ink, width: 20 },
});
