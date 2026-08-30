import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
/** Cards visible behind the active one. Beyond three nothing shows through. */
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

  const cardW = Math.round(width * 0.84);
  const cardH = Math.round(cardW * 1.45);

  /**
   * Cards are absolutely positioned, so the container has to reserve their
   * full height itself — the image plus the meta block beneath it (label,
   * two-line caption and the Shop action), plus the offset of the deepest
   * card in the stack. Sizing this to the image alone let the cards overhang
   * whatever came next on the page.
   */
  const metaH = 152;
  const stackOffset = (VISIBLE - 1) * 14;
  const deckH = cardH + metaH + stackOffset;
  const count = items.length;

  /**
   * One animated value per card, keyed by look, rather than one shared by the
   * deck.
   *
   * A shared value has to be recentred when the next card is promoted, and
   * that recentre necessarily lands while the thrown card is still the one
   * bound to it — so the card snaps back into frame for a frame before the
   * promotion renders. Ordering the two statements cannot fix it, because
   * `setTop` is a batched React update while `setValue` writes to the view
   * immediately; the reset always wins the race.
   *
   * With a value per card there is nothing to recentre: the thrown card keeps
   * its own offset, and the promoted card is already sitting at rest.
   */
  const pans = useRef(new Map<string, Animated.ValueXY>()).current;
  const panFor = useCallback(
    (key: string): Animated.ValueXY => {
      let value = pans.get(key);
      if (!value) {
        value = new Animated.ValueXY();
        pans.set(key, value);
      }
      return value;
    },
    [pans]
  );

  const activeKey = count > 0 ? items[top % count].key : '';
  const pan = panFor(activeKey);

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
            }).start(() => setTop((t) => (t + 1) % count));
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
    [count, pan, width]
  );

  /**
   * Recentre a card only after it has left the front.
   *
   * The thrown card keeps its offset until this runs, so it never snaps back
   * into frame. By the time the effect fires the promotion has rendered and
   * the card is buried at the back of the stack at opacity 0, so moving it is
   * invisible — and it is back at rest for when it cycles round to the front.
   *
   * Driven off the committed `top` rather than a frame callback, so it cannot
   * race the React update the way a `requestAnimationFrame` reset would.
   */
  const wasTop = useRef(top);
  useEffect(() => {
    if (wasTop.current === top || count === 0) return;
    const left = items[wasTop.current % count];
    wasTop.current = top;
    if (left) panFor(left.key).setValue({ x: 0, y: 0 });
  }, [top, items, count, panFor]);

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
    <View style={{ height: deckH, alignItems: 'center', justifyContent: 'flex-start' }}>
      {/*
        * Every card stays mounted, not just the three that show.
        *
        * Rendering a window of three meant that each promotion unmounted the
        * card leaving the window and mounted the one entering it. The new card
        * mounted with an empty Image, which then had to load its file from
        * disk — so a card popped in at the back of the stack on every swipe.
        * Six mounted Images cost little and never reload.
        */}
      {Array.from({ length: count }, (_, depth) => depth)
        // Furthest first, so the active card ends up last and therefore on top.
        .reverse()
        .map((depth) => {
          const item = items[(top + depth) % count];
          const active = depth === 0;
          // Cards past the visible depth are held at the back rest position
          // and faded out. They keep their images; they just do not show.
          const buried = depth >= VISIBLE;
          const tier = Math.min(depth, VISIBLE - 1);

          const restScale = 1 - tier * 0.05;
          const restY = tier * 14;

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
              /*
               * Keyed by the look alone, never by depth. Including depth meant
               * a card promoted from second to first changed key, so React
               * unmounted and rebuilt it — the image reloaded and the card
               * visibly blinked out mid-swipe.
               */
              key={item.key}
              style={[
                styles.layer,
                // Explicit stacking. With stable keys React reorders these
                // views rather than rebuilding them, so draw order can no
                // longer be inferred from position in the JSX.
                { width: cardW, zIndex: count - depth, elevation: count - depth },
                buried && styles.buried,
                style,
              ]}
              pointerEvents={active ? 'auto' : 'none'}
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
  // Mounted, positioned, and invisible — the image stays decoded and ready.
  buried: { opacity: 0 },
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
