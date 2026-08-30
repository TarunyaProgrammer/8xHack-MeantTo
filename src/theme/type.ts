import { TextStyle } from 'react-native';
import { color } from './tokens';

/**
 * Editorial type scale. Display sizes are deliberately oversized with tight
 * negative tracking — the headline is the graphic. Body copy stays at 16+ and
 * high contrast so the loudness never costs legibility.
 */
export const type = {
  /** Screen-owning headline. One per screen, never two. */
  mega: {
    fontSize: 56,
    lineHeight: 54,
    fontWeight: '900',
    letterSpacing: -2.5,
    color: color.ink,
  },
  display: {
    fontSize: 40,
    lineHeight: 40,
    fontWeight: '800',
    letterSpacing: -1.6,
    color: color.ink,
  },
  h1: { fontSize: 28, lineHeight: 30, fontWeight: '800', letterSpacing: -0.8, color: color.ink },
  h2: { fontSize: 20, lineHeight: 24, fontWeight: '700', letterSpacing: -0.3, color: color.ink },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '500', color: color.ink },
  bodyMuted: { fontSize: 16, lineHeight: 22, fontWeight: '500', color: color.muted },
  /** Overline. Wide tracking is what makes small text feel deliberate. */
  caption: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: color.faint,
  },
  /** Oversized live numbers. */
  number: {
    fontSize: 72,
    lineHeight: 70,
    fontWeight: '900',
    letterSpacing: -4,
    color: color.ink,
  },
} satisfies Record<string, TextStyle>;
