import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";

import { Loader } from "@/components/ui/Loader";
import { colors } from "@/constants/theme";
import { useBootstrapApp } from "@/hooks/useBootstrapApp";
import { RootNavigator } from "@/navigation/RootNavigator";

const appTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.card,
    border: colors.border,
    text: colors.text,
    primary: colors.primary,
  },
};

export default function App() {
  const { isBootstrapped } = useBootstrapApp();

  if (!isBootstrapped) {
    return <Loader />;
  }

  return (
    <NavigationContainer theme={appTheme}>
      <StatusBar style="light" />
      <RootNavigator />
    </NavigationContainer>
  );
}
