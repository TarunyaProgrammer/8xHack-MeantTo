import { TextStyle } from 'react-native';
import { color } from './tokens';

export const type = {
  display: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: color.ink,
  },
  h1: { fontSize: 28, fontWeight: '700', color: color.ink },
  h2: { fontSize: 20, fontWeight: '600', color: color.ink },
  body: { fontSize: 16, fontWeight: '400', color: color.ink },
  bodyMuted: { fontSize: 16, fontWeight: '400', color: color.muted },
  caption: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: color.muted,
  },
  /** The big stat on the Verdict screen. */
  number: { fontSize: 48, fontWeight: '800', letterSpacing: -1, color: color.ink },
} satisfies Record<string, TextStyle>;
