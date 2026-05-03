/**
 * FitPlus Design System
 * Central source of truth for all visual constants.
 * Import from here — never hardcode colors/spacing in screens.
 */

// ─── Colors ──────────────────────────────────────────────────────────────────

export const colors = {
  // Backgrounds
  bg: {
    base:    '#0d0d0d', // deepest background (screen level)
    surface: '#161616', // cards, modals
    elevated:'#1f1f1f', // inputs, elevated cards
    overlay: '#2a2a2a', // hover states, pressed
  },

  // Borders
  border: {
    default: '#2e2e2e',
    muted:   '#1e1e1e',
    focus:   '#c5f135',
  },

  // Brand accent — the lime green
  accent: {
    base:    '#c5f135',
    dim:     '#a8cc2a',   // pressed / darkened
    muted:   '#c5f13520', // transparent tint (chips, tags)
    text:    '#c5f135',
  },

  // Text
  text: {
    primary:   '#f2f2f2',
    secondary: '#9a9a9a',
    muted:     '#555555',
    inverse:   '#0d0d0d', // text on lime buttons
    error:     '#ff5a5a',
    success:   '#4ade80',
    warning:   '#facc15',
  },

  // Semantic
  error:   '#ff5a5a',
  success: '#4ade80',
  warning: '#facc15',
  info:    '#60a5fa',

  // Misc
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────

export const typography = {
  // Font families (Expo loads system fonts by default; swap in custom ones here)
  fontFamily: {
    regular:    undefined, // system default
    medium:     undefined,
    semiBold:   undefined,
    bold:       undefined,
    mono:       undefined,
  },

  // Font sizes — named semantic scale
  size: {
    xs:   11,
    sm:   13,
    base: 15,
    md:   17,
    lg:   20,
    xl:   24,
    '2xl':28,
    '3xl':34,
    '4xl':40,
  },

  // Line heights
  lineHeight: {
    tight:  1.15,
    normal: 1.4,
    loose:  1.7,
  },

  // Letter spacing
  tracking: {
    tight:  -0.5,
    normal:  0,
    wide:    0.5,
    wider:   1.5,
    widest:  3,
  },

  // Predefined text styles for reuse
  styles: {
    hero: {
      fontSize: 40,
      fontWeight: '800' as const,
      letterSpacing: -1,
      color: '#f2f2f2',
    },
    h1: {
      fontSize: 28,
      fontWeight: '700' as const,
      letterSpacing: -0.5,
      color: '#f2f2f2',
    },
    h2: {
      fontSize: 22,
      fontWeight: '700' as const,
      letterSpacing: -0.3,
      color: '#f2f2f2',
    },
    h3: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: '#f2f2f2',
    },
    body: {
      fontSize: 15,
      fontWeight: '400' as const,
      lineHeight: 22,
      color: '#f2f2f2',
    },
    bodySmall: {
      fontSize: 13,
      fontWeight: '400' as const,
      lineHeight: 19,
      color: '#9a9a9a',
    },
    label: {
      fontSize: 11,
      fontWeight: '600' as const,
      letterSpacing: 1.5,
      textTransform: 'uppercase' as const,
      color: '#9a9a9a',
    },
    caption: {
      fontSize: 11,
      fontWeight: '400' as const,
      color: '#555555',
    },
    mono: {
      fontSize: 13,
      fontWeight: '400' as const,
      color: '#9a9a9a',
    },
  },
} as const;

// ─── Spacing ──────────────────────────────────────────────────────────────────

/** 4-point grid. Use multiples of 4 for all spacing. */
export const spacing = {
  0:    0,
  1:    4,
  2:    8,
  3:    12,
  4:    16,
  5:    20,
  6:    24,
  7:    28,
  8:    32,
  10:   40,
  12:   48,
  16:   64,
  20:   80,
  // Named aliases
  xs:   4,
  sm:   8,
  md:   16,
  lg:   24,
  xl:   32,
  '2xl':48,
  '3xl':64,
  // Page gutter
  screen: 20,
} as const;

// ─── Border Radius ────────────────────────────────────────────────────────────

export const radius = {
  none:   0,
  xs:     4,
  sm:     8,
  md:     12,
  lg:     16,
  xl:     20,
  '2xl':  28,
  full:   9999,
  // Aliases
  button: 12,
  card:   20,
  input:  12,
  chip:   9999,
} as const;

// ─── Shadows ──────────────────────────────────────────────────────────────────

/** React Native shadow style objects. Spread into StyleSheet entries. */
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  accent: {
    // Lime glow for highlighted cards / CTA buttons
    shadowColor: '#c5f135',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

// ─── Animation Durations ──────────────────────────────────────────────────────

export const duration = {
  instant:  0,
  fast:     150,
  normal:   250,
  slow:     400,
  verySlow: 600,
} as const;

// ─── Z-Index ──────────────────────────────────────────────────────────────────

export const zIndex = {
  base:    0,
  raised:  10,
  overlay: 20,
  modal:   30,
  toast:   40,
} as const;

// ─── Icon Sizes ───────────────────────────────────────────────────────────────

export const iconSize = {
  xs:  14,
  sm:  18,
  md:  22,
  lg:  28,
  xl:  36,
} as const;

// ─── Default export (convenience) ────────────────────────────────────────────

const theme = {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  duration,
  zIndex,
  iconSize,
} as const;

export default theme;
