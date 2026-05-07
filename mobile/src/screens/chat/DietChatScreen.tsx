import { useRoute, RouteProp } from "@react-navigation/native";
import { ChatScreenBase } from "@/screens/chat/ChatScreenBase";
import { MainTabParamList } from "@/types/navigation";

type RouteProps = RouteProp<MainTabParamList, "Diet">;

export const DietChatScreen = () => {
  const route = useRoute<RouteProps>();
  const conversationId = route.params?.conversationId;

  return (
    <ChatScreenBase
      agentType="diet"
      title="Diet AI"
      subtitle="Nutrition Counselor"
      emptyEmoji="🥗"
      emptyHint="Ask me about meal plans, macros, grocery lists, calorie targets, or dietary restrictions — I'll tailor advice to your needs."
      inputPlaceholder="Ask about nutrition, meals, diet plans…"
      initialConversationId={conversationId}
    />
  );
};
