import { subscribe, unsubscribe } from "../services/redis-subscriber";
import { broadcastToSession } from "../services/client-manager";
import type { WsEvent } from "@simistream/types";

const handlers = new Map<string, (event: WsEvent) => void>();

export function subscribeScore(sessionId: string): void {
  if (handlers.has(sessionId)) return;

  const channel = `score:update:${sessionId}`;
  const handler = (event: WsEvent) => {
    if (event.type === "score:update") {
      broadcastToSession(sessionId, event);
    }
  };

  handlers.set(sessionId, handler);
  subscribe(channel, handler);
}

export function unsubscribeScore(sessionId: string): void {
  const handler = handlers.get(sessionId);
  if (!handler) return;

  const channel = `score:update:${sessionId}`;
  unsubscribe(channel, handler);
  handlers.delete(sessionId);
}
