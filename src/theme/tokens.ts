/**
 * Design tokens — monochrome UI, colour from photography.
 *
 * The reference this is built to has no accent colour at all: black pills,
 * white cards, cool grey ground. All the colour comes from the imagery. That
 * restraint is what reads as premium — an accent hue competing with product
 * photography is what makes an interface look cheap.
 */

export const color = {
  /** Cool light grey. Not warm cream — warmth fights photography. */
  bg: '#EFEFEC',
  surface: '#FFFFFF',
  /** Recessed wells and inactive segments. */
  surfaceHi: '#E4E4DF',

  ink: '#0E0E0E',
  muted: '#6E6E6E',
  faint: '#9C9C98',

  /** Black IS the action colour. Pills, active chips, primary buttons. */
  accent: '#0E0E0E',
  /** Inverse, for text and icons sitting on black. */
  onAccent: '#FFFFFF',

  /** Used sparingly — a live value, a positive delta. Never a whole surface. */
  hot: '#E4572E',
  violet: '#2F6F4F',

  success: '#2F6F4F',
  danger: '#C8372D',

  border: '#E2E2DD',
  borderHi: '#CFCFC9',

  /** Scrim stops for hero imagery. */
  scrimTop: 'rgba(12,14,12,0.72)',
  scrimBottom: 'rgba(12,14,12,0.05)',
} as const;

/**
 * Generous and soft. The reference leans hard on large radii — sharp corners
 * read as utilitarian, and this app is meant to feel considered.
 */
export const radius = {
  card: 26,
  button: 999,
  chip: 999,
  tile: 22,
} as const;

export const space = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const shadow = {
  card: {
    shadowColor: '#1A1A18',
    shadowOpacity: 0.07,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  glow: {
    shadowColor: '#000000',
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
} as const;

export const gutter = space.lg;
