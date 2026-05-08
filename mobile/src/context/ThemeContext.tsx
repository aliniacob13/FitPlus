import React, { createContext, useContext, useState } from 'react';
import { PALETTES, type PaletteName, type PaletteTokens } from '@/constants/palettes';

interface ThemeContextType {
  palette: PaletteName;
  setPalette: (p: PaletteName) => void;
  t: PaletteTokens;
}

const ThemeContext = createContext<ThemeContextType>({
  palette: 'lime',
  setPalette: () => {},
  t: PALETTES.lime,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [palette, setPalette] = useState<PaletteName>('lime');
  return (
    <ThemeContext.Provider value={{ palette, setPalette, t: PALETTES[palette] }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);