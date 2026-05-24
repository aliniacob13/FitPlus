import { api } from "@/services/api";
import { env } from "@/constants/env";
import { useAuthStore } from "@/store/authStore";

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

export type StreamCallbacks = {
  /** Called for each text chunk arriving from the AI */
  onChunk: (chunk: string) => void;
  /** Called when the stream ends successfully, with the resolved conversation_id */
  onDone: (conversationId: number) => void;
  /** Called when the server signals an error event */
  onError: (message: string) => void;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Parse raw SSE text (accumulated since last '\n\n') into event + data. */
function parseSSEBlock(block: string): { event: string; data: string } {
  let event = "message";
  const dataLines: string[] = [];
  for (const line of block.split("\n")) {
    if (line.startsWith("event: ")) {
      event = line.slice(7).trim();
    } else if (line.startsWith("data:")) {
      const value = line.slice(5);
      dataLines.push(value.startsWith(" ") ? value.slice(1) : value);
    }
  }
  // Multiple data: lines are one logical payload joined with newlines (SSE spec).
  const data = dataLines.join("\n");
  return { event, data };
}

// ── Chat endpoints (non-streaming) ────────────────────────────────────────────

const sendChat = async (
  agentType: "workout" | "diet",
  payload: ChatPayload,
): Promise<ChatResponse> => {
  const { data } = await api.post<ChatResponse>(`/ai/${agentType}/chat`, payload);
  return data;
};

// ── Streaming via XHR (works on native + web) ─────────────────────────────────

/**
 * Opens an SSE stream to the backend and calls the appropriate callback for
 * each server-sent event.  Returns a cleanup function that aborts the request.
 *
 * Events emitted by the server:
 *   event: chunk  →  onChunk(data)
 *   event: meta   →  onDone(Number(data))   ← conversation_id
 *   event: done   →  (already resolved via meta)
 *   event: error  →  onError(data)
 */
const streamChat = (
  agentType: "workout" | "diet",
  payload: ChatPayload,
  callbacks: StreamCallbacks,
): (() => void) => {
  const token = useAuthStore.getState().accessToken;

  const params = new URLSearchParams({ message: payload.message });
  if (payload.conversation_id != null) {
    params.set("conversation_id", String(payload.conversation_id));
  }

  const url = `${env.apiBaseUrl}/ai/${agentType}/chat/stream?${params.toString()}`;

  const xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);
  xhr.setRequestHeader("Authorization", `Bearer ${token ?? ""}`);
  xhr.setRequestHeader("Accept", "text/event-stream");
  xhr.setRequestHeader("Cache-Control", "no-cache");
  xhr.timeout = 600_000;

  let processedLength = 0;
  let sseBuffer = "";

  function processRaw(raw: string) {
    sseBuffer += raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const blocks = sseBuffer.split("\n\n");
    // Last element might be an incomplete block — keep it in the buffer.
    sseBuffer = blocks.pop() ?? "";

    for (const block of blocks) {
      if (!block.trim()) continue;
      const { event, data } = parseSSEBlock(block);

      if (event === "chunk") {
        callbacks.onChunk(data);
      } else if (event === "meta") {
        const convId = parseInt(data, 10);
        if (!isNaN(convId)) callbacks.onDone(convId);
      } else if (event === "error") {
        callbacks.onError(data || "Stream error");
      }
    }
  }

  /** Drain new bytes from responseText (cursor-based — safe if handlers fire multiple times). */
  function pump() {
    const full = xhr.responseText;
    const newText = full.slice(processedLength);
    processedLength = full.length;
    if (newText.length > 0) processRaw(newText);
  }

  /**
   * Many browsers / RN Web never fire incremental `onprogress` for SSE; all bytes arrive at once on completion.
   * `readystatechange` (LOADING/DONE) + `onload` ensures we still parse `chunk` / `meta` events.
   */
  xhr.onprogress = pump;
  xhr.onreadystatechange = () => {
    if (xhr.readyState >= XMLHttpRequest.LOADING) {
      pump();
    }
  };

  xhr.onload = () => {
    pump();
    // Flush any trailing incomplete block once the connection closes.
    if (sseBuffer.trim()) processRaw("\n\n");
  };

  xhr.onerror = () => {
    callbacks.onError("Network error — could not reach the server.");
  };

  xhr.ontimeout = () => {
    callbacks.onError("Request timed out.");
  };

  xhr.send();

  // Return cleanup so callers can abort (e.g. component unmount).
  return () => {
    xhr.abort();
  };
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
  streamWorkoutMessage: (payload: ChatPayload, callbacks: StreamCallbacks) =>
    streamChat("workout", payload, callbacks),
  streamDietMessage: (payload: ChatPayload, callbacks: StreamCallbacks) =>
    streamChat("diet", payload, callbacks),
  getConversations,
  getMessages,
  deleteConversation,
};
