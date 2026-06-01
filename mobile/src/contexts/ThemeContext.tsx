import { createContext, useContext, useState, type ReactNode } from "react";
import { PaletteId, ThemeTokens, palettes, buildColors } from "@/constants/theme";

interface ThemeContextValue {
  paletteId: PaletteId;
  palette: ThemeTokens;
  colors: ReturnType<typeof buildColors>;
  setPalette: (id: PaletteId) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [paletteId, setPaletteId] = useState<PaletteId>("lime");
  const palette = palettes[paletteId];
  const colors = buildColors(palette);

  return (
    <ThemeContext.Provider value={{ paletteId, palette, colors, setPalette: setPaletteId }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be inside ThemeProvider");
  return ctx;
};