/**
 * Design tokens. One accent colour, white surfaces, very soft shadows.
 * Do not add a second accent — the whole look depends on restraint.
 */

export const color = {
  bg: '#FFFFFF',
  surface: '#F7F8FA',
  ink: '#0B1B2B',
  muted: '#6B7280',
  accent: '#0B5FFF',
  success: '#12B76A',
  danger: '#E5484D',
  border: '#ECEEF2',
} as const;

export const radius = {
  card: 20,
  button: 14,
  chip: 999,
} as const;

export const space = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/** Barely-there elevation. Anything heavier reads as a template. */
export const shadow = {
  card: {
    shadowColor: '#0B1B2B',
    shadowOpacity: 0.06,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
} as const;

export const gutter = space.lg;
