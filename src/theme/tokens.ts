/**
 * Design tokens — bold, high-contrast, editorial.
 *
 * Near-black canvas is a functional choice as much as an aesthetic one: this
 * app's whole job is showing colour, and swatches read far more accurately
 * against black than against white. White-on-near-black is also the highest
 * contrast text pairing available, which keeps a loud UI readable.
 */

export const color = {
  bg: '#0A0A0F',
  /** Raised panels. Deliberately close to bg — separation comes from the hairline. */
  surface: '#15151F',
  surfaceHi: '#1E1E2B',

  ink: '#FFFFFF',
  muted: '#8E8EA3',
  faint: '#5A5A6E',

  /** Acid lime. Primary action, live values, anything the eye should hit first. */
  accent: '#CCFF00',
  /** Hot magenta. Energy and emphasis only — never load-bearing for meaning. */
  hot: '#FF2D9B',
  /** Electric violet. Third voice for gradients and highlights. */
  violet: '#7C5CFF',

  success: '#3DFFA8',
  danger: '#FF4D5E',

  border: '#26263A',
  borderHi: '#3A3A55',
} as const;

export const radius = {
  card: 26,
  button: 999,
  chip: 999,
  tile: 18,
} as const;

export const space = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/** Glow rather than drop shadow — a dark canvas swallows conventional elevation. */
export const shadow = {
  card: {
    shadowColor: '#000000',
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  glow: {
    shadowColor: color.accent,
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
} as const;

export const gutter = space.lg;
