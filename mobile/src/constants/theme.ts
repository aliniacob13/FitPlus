export const colors = {
  bg: {
    base: "#0d0d0d",
    surface: "#161616",
    elevated: "#1f1f1f",
    overlay: "#2a2a2a",
  },
  borderPalette: {
    default: "#2e2e2e",
    muted: "#1e1e1e",
    focus: "#c5f135",
  },
  accent: {
    base: "#c5f135",
    dim: "#a8cc2a",
    muted: "#c5f13520",
    text: "#c5f135",
  },
  textPalette: {
    primary: "#f2f2f2",
    secondary: "#9a9a9a",
    muted: "#555555",
    inverse: "#0d0d0d",
  },
  error: "#ff5a5a",
  success: "#4ade80",
  warning: "#facc15",
  info: "#60a5fa",
  white: "#FFFFFF",
  transparent: "transparent",

  // Backward-compatible aliases used across existing screens.
  background: "#0d0d0d",
  card: "#161616",
  text: "#f2f2f2",
  mutedText: "#9a9a9a",
  primary: "#c5f135",
  danger: "#ff5a5a",
  border: "#2e2e2e",
};

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
  "3xl": 64,
  screen: 20,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  card: 20,
  button: 12,
  chip: 9999,
};

export const typography = {
  size: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    "2xl": 28,
    "3xl": 34,
  },
  tracking: {
    wide: 0.5,
    wider: 1.5,
    widest: 3,
  },
  styles: {
    h2: {
      fontSize: 22,
      fontWeight: "700" as const,
      color: "#f2f2f2",
    },
    h3: {
      fontSize: 18,
      fontWeight: "600" as const,
      color: "#f2f2f2",
    },
    bodySmall: {
      fontSize: 13,
      color: "#9a9a9a",
    },
    label: {
      fontSize: 11,
      fontWeight: "600" as const,
      letterSpacing: 1.5,
      textTransform: "uppercase" as const,
      color: "#9a9a9a",
    },
    caption: {
      fontSize: 11,
      color: "#555555",
    },
  },
};

export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  accent: {
    shadowColor: "#c5f135",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
};
