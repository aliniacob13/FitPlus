/**
 * chatStore
 *
 * Keeps track of the active conversation per agent type so that switching
 * between the Workout and Diet tabs doesn't reset the chat session.
 *
 * Also holds each tab's message list so the FlatList content survives
 * navigation (no double-fetch on tab re-focus when the conversation hasn't
 * changed).
 */

import { create } from "zustand";
import { ChatMessage } from "@/components/chat/ChatBubble";

type AgentType = "workout" | "diet";

type ChatSlice = {
  /** The conversation currently open in this tab (null = new chat) */
  activeConversationId: number | null;
  /** Messages loaded for the active conversation */
  messages: ChatMessage[];
};

type ChatState = {
  workout: ChatSlice;
  diet: ChatSlice;

  // ── Selectors ──────────────────────────────────────────────────────────────
  getSlice: (agent: AgentType) => ChatSlice;

  // ── Mutators ──────────────────────────────────────────────────────────────
  setActiveConversationId: (agent: AgentType, id: number | null) => void;
  setMessages: (agent: AgentType, messages: ChatMessage[]) => void;
  appendMessage: (agent: AgentType, message: ChatMessage) => void;
  /** Update the content of a single message in place (used during streaming) */
  patchMessage: (
    agent: AgentType,
    id: string,
    patch: Partial<Omit<ChatMessage, "id">>,
  ) => void;
  /** Reset a tab to a clean "new chat" state */
  resetSlice: (agent: AgentType) => void;
  /** Reset both tabs (e.g. on logout) */
  resetAll: () => void;
};

const emptySlice = (): ChatSlice => ({
  activeConversationId: null,
  messages: [],
});

const updateSlice = (
  agent: AgentType,
  updater: (prev: ChatSlice) => ChatSlice,
) =>
  (state: ChatState) => ({
    [agent]: updater(state[agent]),
  });

export const useChatStore = create<ChatState>((set, get) => ({
  workout: emptySlice(),
  diet: emptySlice(),

  getSlice: (agent) => get()[agent],

  setActiveConversationId: (agent, id) =>
    set(updateSlice(agent, (s) => ({ ...s, activeConversationId: id }))),

  setMessages: (agent, messages) =>
    set(updateSlice(agent, (s) => ({ ...s, messages }))),

  appendMessage: (agent, message) =>
    set(
      updateSlice(agent, (s) => ({ ...s, messages: [...s.messages, message] })),
    ),

  patchMessage: (agent, id, patch) =>
    set(
      updateSlice(agent, (s) => ({
        ...s,
        messages: s.messages.map((m) =>
          m.id === id ? { ...m, ...patch } : m,
        ),
      })),
    ),

  resetSlice: (agent) => set({ [agent]: emptySlice() }),

  resetAll: () => set({ workout: emptySlice(), diet: emptySlice() }),
}));
