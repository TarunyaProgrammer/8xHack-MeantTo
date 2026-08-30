import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
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
}

/** How far a card must travel before release counts as a dismiss. */
const THROW_RATIO = 0.28;
/** Cards drawn behind the active one. Beyond three nothing is visible. */
const VISIBLE = 3;

/**
 * Swipeable card stack.
 *
 * Cards are piled centrally; the top one follows the finger and rotates about a
 * pivot below the card, which is what makes a drag feel like tossing a physical
 * card rather than sliding a pane. Release past a threshold — or with enough
 * velocity — flings it off and promotes the next.
 *
 * Built on PanResponder with native-driven transforms rather than a gesture
 * library: it needs no additional native module, so it does not force another
 * dev build.
 */
export function SwipeDeck({ items, original, onOpen }: Props) {
  const { width } = useWindowDimensions();
  const [top, setTop] = useState(0);

  const pan = useRef(new Animated.ValueXY()).current;
  const cardW = Math.round(width * 0.84);
  const cardH = Math.round(cardW * 1.45);

  const advance = useCallback(() => {
    pan.setValue({ x: 0, y: 0 });
    setTop((t) => (t + 1) % items.length);
  }, [items.length, pan]);

  const responder = useMemo(
    () =>
      PanResponder.create({
        // Only claim the gesture once it is clearly horizontal, so the vertical
        // page scroll still works from on top of the card.
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: (_, g) => {
          const thrown = Math.abs(g.dx) > width * THROW_RATIO || Math.abs(g.vx) > 0.6;
          if (thrown) {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            Animated.timing(pan, {
              toValue: { x: Math.sign(g.dx) * width * 1.4, y: g.dy },
              duration: 240,
              // Matches onPanResponderMove, which cannot use the native driver
              // because Animated.event writes to the value from JS.
              useNativeDriver: false,
            }).start(advance);
            return;
          }
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            friction: 7,
            tension: 90,
            useNativeDriver: false,
          }).start();
        },
      }),
    [advance, pan, width]
  );

  const rotate = pan.x.interpolate({
    inputRange: [-width, 0, width],
    outputRange: ['-14deg', '0deg', '14deg'],
  });

  // How far the active card has travelled, 0 to 1 — drives the promotion of
  // the card behind it so the stack tightens as you drag.
  const progress = pan.x.interpolate({
    inputRange: [-width * 0.6, 0, width * 0.6],
    outputRange: [1, 0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={{ height: cardH + 132, alignItems: 'center', justifyContent: 'flex-start' }}>
      {Array.from({ length: Math.min(VISIBLE, items.length) }, (_, depth) => depth)
        // Furthest first, so the active card ends up last and therefore on top.
        .reverse()
        .map((depth) => {
          const item = items[(top + depth) % items.length];
          const active = depth === 0;

          const restScale = 1 - depth * 0.05;
          const restY = depth * 14;

          const style = active
            ? {
                transform: [
                  { translateX: pan.x },
                  { translateY: pan.y },
                  { rotate },
                ],
              }
            : {
                transform: [
                  {
                    scale: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [restScale, restScale + 0.05],
                    }),
                  },
                  {
                    translateY: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [restY, restY - 14],
                    }),
                  },
                ],
              };

          return (
            <Animated.View
              key={`${item.key}-${depth}`}
              style={[styles.layer, { width: cardW }, style]}
              {...(active ? responder.panHandlers : {})}
            >
              <Pressable onPress={() => active && onOpen((top + depth) % items.length)}>
                <View style={[styles.card, { width: cardW }]}>
                  {item.image ? (
                    <Image
                      source={{ uri: item.image }}
                      style={{ width: cardW, height: cardH }}
                      resizeMode="cover"
                    />
                  ) : item.error ? (
                    <View style={[styles.fallback, { width: cardW, height: cardH }]}>
                      <Text style={[type.bodyMuted, { textAlign: 'center' }]}>
                        Couldn't render
                      </Text>
                    </View>
                  ) : (
                    <View>
                      <Shimmer width={cardW} height={cardH} borderRadius={0} />
                      <Image
                        source={{ uri: original }}
                        style={{ position: 'absolute', width: cardW, height: cardH, opacity: 0.14 }}
                      />
                    </View>
                  )}

                  <View style={styles.meta}>
                    <Text style={styles.label}>{item.label}</Text>
                    <Text style={[type.body, { fontWeight: '700', marginTop: 4 }]} numberOfLines={2}>
                      {item.caption}
                    </Text>
                    <View style={styles.cta}>
                      <Text style={styles.ctaText}>Shop this look</Text>
                      <Icon name="link" size={14} color={color.onAccent} strokeWidth={2.4} />
                    </View>
                  </View>
                </View>
              </Pressable>
            </Animated.View>
          );
        })}

    </View>
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', top: 0 },
  card: {
    borderRadius: radius.card,
    backgroundColor: color.surface,
    overflow: 'hidden',
    shadowColor: '#1A1A18',
    shadowOpacity: 0.2,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
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
});
