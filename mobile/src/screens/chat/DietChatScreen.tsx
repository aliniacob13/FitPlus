import { ChatScreenBase } from "@/screens/chat/ChatScreenBase";

export const DietChatScreen = () => (
  <ChatScreenBase
    agentType="diet"
    title="Diet AI"
    subtitle="Nutrition Counselor"
    emptyEmoji="🥗"
    emptyHint="Ask me about meal plans, macros, grocery lists, calorie targets, or dietary restrictions — I'll tailor advice to your needs."
    inputPlaceholder="Ask about nutrition, meals, diet plans…"
  />
);
