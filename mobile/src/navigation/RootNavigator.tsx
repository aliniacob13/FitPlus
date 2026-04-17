import { AuthStack } from "@/navigation/AuthStack";
import { MainTabs } from "@/navigation/MainTabs";
import { useAuthStore } from "@/store/authStore";

export const RootNavigator = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <MainTabs /> : <AuthStack />;
};
