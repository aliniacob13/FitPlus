import { ChatScreenBase } from "@/screens/chat/ChatScreenBase";

export const WorkoutChatScreen = () => (
  <ChatScreenBase
    agentType="workout"
    title="Workout AI"
    subtitle="Personal Trainer"
    emptyEmoji="💪"
    emptyHint="Ask me about exercise plans, muscle groups, workout splits, or anything fitness-related — I'll build a plan around your goals."
    inputPlaceholder="Ask about workouts, plans, exercises…"
  />
);
