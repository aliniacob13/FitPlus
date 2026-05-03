import { api } from "@/services/api";

type ChatResponse = {
  response: string;
  conversation_id?: string;
};

type ChatPayload = {
  message: string;
  conversation_id?: string;
};

const sendChat = async (agentType: "workout" | "diet", payload: ChatPayload): Promise<ChatResponse> => {
  const { data } = await api.post<ChatResponse>(`/ai/${agentType}/chat`, payload);
  return data;
};

export const aiApi = {
  sendWorkoutMessage: (payload: ChatPayload) => sendChat("workout", payload),
  sendDietMessage: (payload: ChatPayload) => sendChat("diet", payload),
};
