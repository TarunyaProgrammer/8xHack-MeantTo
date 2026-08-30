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
 * Horizontally paged deck of looks — exactly one card per frame.
 *
 * Each page is the full window width with the card inset inside it, so no
 * neighbour peeks in at the edges. The deck escapes the screen gutter with a
 * negative margin; without it the pages would be narrower than the window and
 * the paging would drift out of alignment.
 *
 * A paged ScrollView rather than a gesture library: snapping is native, the
 * momentum feels right for free, and it adds no module that would force
 * another dev build.
 */
function Anim({ scroll, index, cardW, children }: {
  scroll: SharedValue<number>;
  index: number;
  cardW: number;
  children: React.ReactNode;
}) {
  const style = useAnimatedStyle(() => {
    const at = scroll.value / cardW;
    const distance = Math.abs(at - index);
    return {
      transform: [{ scale: interpolate(distance, [0, 1], [1, 0.93], 'clamp') }],
      opacity: interpolate(distance, [0, 1], [1, 0.55], 'clamp'),
    };
  });
  return <Animated.View style={style}>{children}</Animated.View>;
}

export function LookDeck({ items, original, onOpen, gutter }: Props) {
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const scroll = useSharedValue(0);

  // One page per screen width; the card sits inset within it.
  const step = width;
  const cardW = width - gutter * 2;

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scroll.value = e.contentOffset.x;
    },
  });

  return (
    <View>
      <Animated.ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ marginHorizontal: -gutter }}
        onMomentumScrollEnd={(e) => {
          const next = Math.round(e.nativeEvent.contentOffset.x / step);
          if (next !== page) {
            setPage(next);
            void Haptics.selectionAsync().catch(() => {});
          }
        }}
      >
        {items.map((item, i) => (
          <View key={item.key} style={{ width: step, paddingHorizontal: gutter }}>
            <Anim scroll={scroll} index={i} cardW={step}>
              <Pressable onPress={() => onOpen(i)} disabled={!item.image}>
                <View style={[styles.card, { width: cardW }]}>
                {item.image ? (
                  <Animated.Image
                    entering={FadeIn.duration(450)}
                    source={{ uri: item.image }}
                    style={{ width: cardW, height: cardW * 1.34 }}
                    resizeMode="cover"
                  />
                ) : item.error ? (
                  <View style={[styles.fallback, { width: cardW, height: cardW * 1.34 }]}>
                    <Text style={[type.bodyMuted, { textAlign: 'center' }]}>Couldn't render</Text>
                  </View>
                ) : (
                  <View>
                    <Shimmer width={cardW} height={cardW * 1.34} borderRadius={0} />
                    <Image
                      source={{ uri: original }}
                      style={{ position: 'absolute', width: cardW, height: cardW * 1.34, opacity: 0.14 }}
                    />
                  </View>
                )}

                  <View style={styles.meta}>
                    <Text style={styles.label}>{item.label}</Text>
                    <Text style={[type.body, { fontWeight: '700', marginTop: 4 }]} numberOfLines={2}>
                      {item.caption}
                    </Text>
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
  },
  fallback: { backgroundColor: color.surfaceHi, alignItems: 'center', justifyContent: 'center' },
  meta: { padding: space.md },
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
