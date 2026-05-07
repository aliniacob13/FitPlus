import { useRoute, RouteProp } from "@react-navigation/native";
import { ChatScreenBase } from "@/screens/chat/ChatScreenBase";
import { MainTabParamList } from "@/types/navigation";

type RouteProps = RouteProp<MainTabParamList, "Workout">;

export const WorkoutChatScreen = () => {
  const route = useRoute<RouteProps>();
  const conversationId = route.params?.conversationId;

  return (
    <ChatScreenBase
      agentType="workout"
      title="Workout AI"
      subtitle="Personal Trainer"
      emptyEmoji="💪"
      emptyHint={
        "Ask me about exercise plans, muscle groups, workout splits,\nor recovery — I'll build a plan around your goals."
      }
      inputPlaceholder="Ask about workouts, splits, exercises…"
      initialConversationId={conversationId}
    />
  );
};
