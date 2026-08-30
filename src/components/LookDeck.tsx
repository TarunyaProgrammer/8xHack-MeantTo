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
}

/**
 * Horizontally paged deck of looks.
 *
 * A paged ScrollView rather than a gesture library: snapping is native, the
 * momentum feels right for free, and it adds no module that would force a
 * rebuild. Neighbouring cards scale down slightly so the deck reads as a stack
 * rather than a filmstrip.
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

export function LookDeck({ items, original, onOpen }: Props) {
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const scroll = useSharedValue(0);

  const cardW = width - space.lg * 2;
  const gap = space.sm;
  const step = cardW + gap;

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
        snapToInterval={step}
        decelerationRate="fast"
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ gap }}
        onMomentumScrollEnd={(e) => {
          const next = Math.round(e.nativeEvent.contentOffset.x / step);
          if (next !== page) {
            setPage(next);
            void Haptics.selectionAsync().catch(() => {});
          }
        }}
      >
        {items.map((item, i) => (
          <Anim key={item.key} scroll={scroll} index={i} cardW={step}>
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
