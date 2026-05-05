import { api } from "@/services/api";

// ── Types ────────────────────────────────────────────────────────────────────

export type ChatResponse = {
  response: string;
  conversation_id: number;
};

export type ChatPayload = {
  message: string;
  conversation_id?: number;
};

export type Conversation = {
  id: number;
  agent_type: "workout" | "diet" | "nutrition_vision";
  title: string;
  created_at: string;
};

export type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

// ── Chat endpoints ────────────────────────────────────────────────────────────

const sendChat = async (
  agentType: "workout" | "diet",
  payload: ChatPayload,
): Promise<ChatResponse> => {
  const { data } = await api.post<ChatResponse>(`/ai/${agentType}/chat`, payload);
  return data;
};

// ── Conversation management ───────────────────────────────────────────────────

const getConversations = async (): Promise<Conversation[]> => {
  const { data } = await api.get<Conversation[]>("/ai/conversations");
  return data;
};

const getMessages = async (conversationId: number): Promise<Message[]> => {
  const { data } = await api.get<Message[]>(
    `/ai/conversations/${conversationId}/messages`,
  );
  return data;
};

const deleteConversation = async (conversationId: number): Promise<void> => {
  await api.delete(`/ai/conversations/${conversationId}`);
};

// ── Exported API object ───────────────────────────────────────────────────────

export const aiApi = {
  sendWorkoutMessage: (payload: ChatPayload) => sendChat("workout", payload),
  sendDietMessage: (payload: ChatPayload) => sendChat("diet", payload),
  getConversations,
  getMessages,
  deleteConversation,
};
