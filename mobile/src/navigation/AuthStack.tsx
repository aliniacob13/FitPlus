import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { WelcomeScreen } from "@/screens/auth/WelcomeScreen";
import { LoginScreen } from "@/screens/auth/LoginScreen";
import { RegisterScreen } from "@/screens/auth/RegisterScreen";
import { AuthStackParamList } from "@/types/navigation";

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthStack = () => (
  <Stack.Navigator
    initialRouteName="Welcome"
    screenOptions={{ headerShown: false, animation: "fade" }}
  >
    <Stack.Screen name="Welcome" component={WelcomeScreen} />
    <Stack.Screen name="Login" component={LoginScreen} options={{ animation: "slide_from_right" }} />
    <Stack.Screen name="Register" component={RegisterScreen} options={{ animation: "slide_from_right" }} />
  </Stack.Navigator>
);