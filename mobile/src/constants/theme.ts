// ── Palette definitions ────────────────────────────────────────────────────────
export type PaletteId = "lime" | "forest" | "terracotta" | "indigo";

export interface ThemeTokens {
  bg: { base: string; deep: string };
  surface: { base: string; s2: string; s3: string };
  ink: { base: string; i2: string };
  muted: { base: string; m2: string };
  line: { base: string; soft: string };
  primary: { base: string; ink: string; soft: string };
  accent: { base: string; soft: string };
  good: string; warn: string; bad: string;
  macro: { protein: string; carbs: string; fat: string };
}

const lime: ThemeTokens = {
  bg:      { base: "#0d0d0d",  deep: "#050505" },
  surface: { base: "#161616",  s2: "#1f1f1f",  s3: "#2a2a2a" },
  ink:     { base: "#f2f2f2",  i2: "#e5e5e5" },
  muted:   { base: "#9a9a9a",  m2: "#6a6a6a" },
  line:    { base: "#2e2e2e",  soft: "#1f1f1f" },
  primary: { base: "#c5f135",  ink: "#0d0d0d",  soft: "#1e2a06" },
  accent:  { base: "#c5f135",  soft: "#1e2a06" },
  good: "#4ade80", warn: "#facc15", bad: "#ff5a5a",
  macro: { protein: "#c5f135", carbs: "#facc15", fat: "#ff5a5a" },
};

const forest: ThemeTokens = {
  bg:      { base: "#faf6ee",  deep: "#f3ecd9" },
  surface: { base: "#ffffff",  s2: "#f6efde",  s3: "#ece2c7" },
  ink:     { base: "#1a221d",  i2: "#2f352f" },
  muted:   { base: "#6e6f64",  m2: "#a09f93" },
  line:    { base: "#e3dac0",  soft: "#efe7d0" },
  primary: { base: "#2d4a3e",  ink: "#f7f3e9",  soft: "#e0e7dd" },
  accent:  { base: "#d97757",  soft: "#f3dccd" },
  good: "#5a8d6f", warn: "#c98b3a", bad: "#b85d4a",
  macro: { protein: "#2d4a3e", carbs: "#d97757", fat: "#c98b3a" },
};

const terracotta: ThemeTokens = {
  bg:      { base: "#fbf5ec",  deep: "#f1e2cf" },
  surface: { base: "#ffffff",  s2: "#f7ecd9",  s3: "#ead8b9" },
  ink:     { base: "#2a1a12",  i2: "#3d2a1f" },
  muted:   { base: "#7d6a5d",  m2: "#b39c84" },
  line:    { base: "#ecdcc1",  soft: "#f4e8d0" },
  primary: { base: "#a8533c",  ink: "#fbf3e6",  soft: "#f0d8c5" },
  accent:  { base: "#1f4744",  soft: "#cee0dc" },
  good: "#5a8d6f", warn: "#c98b3a", bad: "#b85d4a",
  macro: { protein: "#a8533c", carbs: "#1f4744", fat: "#c98b3a" },
};

const indigoP: ThemeTokens = {
  bg:      { base: "#f3f4fa",  deep: "#dbdef0" },
  surface: { base: "#ffffff",  s2: "#e9ebf6",  s3: "#d4d8ea" },
  ink:     { base: "#0f1428",  i2: "#1f2542" },
  muted:   { base: "#6c728c",  m2: "#9da3bd" },
  line:    { base: "#d8dcec",  soft: "#e6eaf3" },
  primary: { base: "#1f3a8a",  ink: "#eef0fc",  soft: "#d6deef" },
  accent:  { base: "#f59e0b",  soft: "#fde6c3" },
  good: "#16a07c", warn: "#f59e0b", bad: "#ef4444",
  macro: { protein: "#1f3a8a", carbs: "#f59e0b", fat: "#6c728c" },
};

export const palettes: Record<PaletteId, ThemeTokens> = {
  lime, forest, terracotta, indigo: indigoP,
};

// ── Explicit return type so every consumer gets correct IDE autocomplete ────────
export interface ColorTokens {
  // Legacy structured (used by old screens)
  bg: { base: string; deep: string; surface: string; elevated: string; overlay: string };
  borderPalette: { default: string; muted: string; focus: string };
  accent: { base: string; dim: string; muted: string; text: string };
  textPalette: { primary: string; secondary: string; muted: string; inverse: string };
  // New flat semantic tokens (used in redesigned screens)
  bgBase: string; bgDeep: string;
  surfaceBase: string; surface2: string; surface3: string;
  ink: string; ink2: string;
  mutedColor: string; muted2: string;
  lineColor: string; lineSoft: string;
  primaryBase: string; primaryInk: string; primarySoft: string;
  accentBase: string; accentSoft: string;
  macroProtein: string; macroCarbs: string; macroFat: string;
  // Status
  error: string; success: string; warning: string; good: string; info: string;
  white: string; transparent: string;
  // Backward-compat flat aliases
  background: string; card: string; text: string; mutedText: string;
  primary: string; danger: string; border: string;
}

export function buildColors(t: ThemeTokens): ColorTokens {
  return {
    // Structured (new style, used in redesigned screens)
    bg: {
      base:     t.bg.base,
      deep:     t.bg.deep,
      surface:  t.surface.base,
      elevated: t.surface.s2,
      overlay:  t.surface.s3,
    },
    borderPalette: {
      default: t.line.base,
      muted:   t.line.soft,
      focus:   t.primary.base,
    },
    accent: {
      base:  t.primary.base,  // lime theme: primary IS the accent
      dim:   t.primary.base,
      muted: t.primary.soft,
      text:  t.primary.base,
    },
    textPalette: {
      primary:   t.ink.base,
      secondary: t.muted.base,
      muted:     t.muted.m2,
      inverse:   t.primary.ink,
    },
    // Semantic flat tokens (used in redesigned screens)
    bgBase:      t.bg.base,
    bgDeep:      t.bg.deep,
    surfaceBase: t.surface.base,
    surface2:    t.surface.s2,
    surface3:    t.surface.s3,
    ink:         t.ink.base,
    ink2:        t.ink.i2,
    mutedColor:  t.muted.base,
    muted2:      t.muted.m2,
    lineColor:   t.line.base,
    lineSoft:    t.line.soft,
    primaryBase: t.primary.base,
    primaryInk:  t.primary.ink,
    primarySoft: t.primary.soft,
    accentBase:  t.accent.base,
    accentSoft:  t.accent.soft,
    macroProtein: t.macro.protein,
    macroCarbs:   t.macro.carbs,
    macroFat:     t.macro.fat,
    // Status
    error:       t.bad,
    success:     t.good,
    warning:     t.warn,
    good:        t.good,
    info:        "#60a5fa",
    white:       "#FFFFFF",
    transparent: "transparent",
    // Backward-compat flat aliases
    background: t.bg.base,
    card:       t.surface.base,
    text:       t.ink.base,
    mutedText:  t.muted.base,
    primary:    t.primary.base,
    danger:     t.bad,
    border:     t.line.base,
  };
}

// Default export: Lime · Dark (keeps all existing screens working)
export const colors = buildColors(lime);

export const spacing = {
  0: 0,  1: 4,  2: 8,  3: 12,  4: 16,  5: 20,
  6: 24, 7: 28, 8: 32, 10: 40, 12: 48, 16: 64, 20: 80,
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, "2xl": 48, "3xl": 64,
  screen: 22,
};

export const radius = {
  sm:     8,
  md:     14,
  lg:     22,
  card:   22,
  button: 999,
  chip:   999,
  input:  14,
  icon:   12,
};

// Font family names — loaded via useFonts() in App.tsx
export const fonts = {
  sans:        "Geist_400Regular",
  sansMedium:  "Geist_500Medium",
  sansSemiBold:"Geist_600SemiBold",
  sansBold:    "Geist_700Bold",
  serif:       "InstrumentSerif_400Regular",
  serifItalic: "InstrumentSerif_400Regular_Italic",
  mono:        "JetBrainsMono_500Medium",
};

export const typography = {
  size: {
    xs: 11, sm: 13, base: 15, md: 17,
    lg: 20, xl: 24, "2xl": 28, "3xl": 34, "4xl": 46,
  },
  tracking: { wide: 0.5, wider: 1.5, widest: 3 },
  styles: {
    heroSerif: {
      fontFamily: "InstrumentSerif_400Regular" as string,
      fontSize: 46,
      letterSpacing: -1.15,
      lineHeight: 48,
      color: lime.ink.base,
    } as const,
    h1Serif: {
      fontFamily: "InstrumentSerif_400Regular" as string,
      fontSize: 34,
      letterSpacing: -0.68,
      color: lime.ink.base,
    } as const,
    h2Serif: {
      fontFamily: "InstrumentSerif_400Regular" as string,
      fontSize: 30,
      letterSpacing: -0.6,
      color: lime.ink.base,
    } as const,
    h2: {
      fontSize: 22,
      fontWeight: "700" as const,
      color: lime.ink.base,
    },
    h3: {
      fontSize: 18,
      fontWeight: "600" as const,
      color: lime.ink.base,
    },
    bodySmall: {
      fontSize: 13,
      color: lime.muted.base,
    },
    eyebrow: {
      fontFamily: "JetBrainsMono_500Medium" as string,
      fontSize: 10,
      letterSpacing: 1.8,
      textTransform: "uppercase" as const,
      color: lime.muted.base,
    },
    label: {
      fontSize: 11,
      fontWeight: "600" as const,
      letterSpacing: 1.5,
      textTransform: "uppercase" as const,
      color: lime.muted.base,
    },
    caption: { fontSize: 11, color: lime.muted.m2 },
    mono: {
      fontFamily: "JetBrainsMono_500Medium" as string,
      fontSize: 12,
      color: lime.ink.i2,
    },
  },
};

export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  accent: {
    shadowColor: lime.primary.base,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
};