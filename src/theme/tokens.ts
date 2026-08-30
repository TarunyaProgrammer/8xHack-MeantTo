/**
 * Design tokens — warm, light, editorial.
 *
 * The background is bone rather than pure white. Pure #FFF plus grey text is
 * the single most generic combination in mobile design; a warm paper tone with
 * near-black ink reads as considered and costs nothing in contrast.
 */

export const color = {
  /** Warm bone. The canvas. */
  bg: '#F7F2EA',
  /** Cards lift off the canvas by being cleaner and brighter than it. */
  surface: '#FFFFFF',
  /** Recessed wells, inactive segments. */
  surfaceHi: '#EDE5D8',

  /** Warm near-black. Never pure #000 — it reads harsh on paper tones. */
  ink: '#17140F',
  muted: '#7A7167',
  faint: '#A79C8E',

  /**
   * Retail pink. The colour Indian shopping apps converge on because it reads
   * as "act now" at a glance — cobalt is calm, and calm is the wrong register
   * for a buy button.
   */
  accent: '#FF3F6C',
  /** Marigold. Prices, badges, anything that should catch the eye second. */
  hot: '#FF8A00',
  /** Deep grape, third voice for tags and secondary fills. */
  violet: '#7B2CBF',

  success: '#0E9F6E',
  danger: '#D92D20',

  border: '#E2D9C9',
  borderHi: '#CFC3AE',
} as const;

/**
 * Deliberately sharp. Heavy rounding on every surface is what makes an
 * interface read as a generic template; editorial layouts are built on crisp
 * corners. Only chips stay fully round, because a pill is a shape with meaning.
 */
export const radius = {
  card: 10,
  button: 12,
  chip: 999,
  tile: 8,
} as const;

export const space = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/** Soft and warm-tinted. A neutral grey shadow on a warm ground looks dirty. */
export const shadow = {
  card: {
    shadowColor: '#4A3F2E',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  glow: {
    shadowColor: color.accent,
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
} as const;

export const gutter = space.lg;
