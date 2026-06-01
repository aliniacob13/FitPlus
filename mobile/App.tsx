import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect } from "react";
import { View } from "react-native";
import { useFonts } from "expo-font";
import {
  InstrumentSerif_400Regular,
  InstrumentSerif_400Regular_Italic,
} from "@expo-google-fonts/instrument-serif";
import {
  JetBrainsMono_500Medium,
} from "@expo-google-fonts/jetbrains-mono";

import { Loader } from "@/components/ui/Loader";
import { colors } from "@/constants/theme";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { useBootstrapApp } from "@/hooks/useBootstrapApp";
import { RootNavigator } from "@/navigation/RootNavigator";

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { isBootstrapped } = useBootstrapApp();
  const { colors: themeColors } = useTheme();

  const navTheme = {
    dark: true,
    colors: {
      primary:    themeColors.primaryBase,
      background: themeColors.bgBase,
      card:       themeColors.surfaceBase,
      text:       themeColors.ink,
      border:     themeColors.lineColor,
      notification: themeColors.accentBase,
    },
    fonts: {
      regular: { fontFamily: "System", fontWeight: "400" as const },
      medium:  { fontFamily: "System", fontWeight: "500" as const },
      bold:    { fontFamily: "System", fontWeight: "700" as const },
      heavy:   { fontFamily: "System", fontWeight: "900" as const },
    },
  };

  if (!isBootstrapped) {
    return (
      <View style={{ flex: 1, backgroundColor: themeColors.bgBase }}>
        <Loader />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style="light" />
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
    JetBrainsMono_500Medium,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (fontsLoaded) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <AppContent />
      </View>
    </ThemeProvider>
  );
}