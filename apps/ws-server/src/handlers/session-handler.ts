import { subscribe, unsubscribe } from "../services/redis-subscriber";
import { broadcastToSession } from "../services/client-manager";
import type { WsEvent } from "@simistream/types";

const handlers = new Map<string, (event: WsEvent) => void>();

export function subscribeSession(sessionId: string): void {
  if (handlers.has(sessionId)) return;

  const channel = `session:status:${sessionId}`;
  const handler = (event: WsEvent) => {
    if (event.type === "session:status") {
      broadcastToSession(sessionId, event);
    }
  };

  handlers.set(sessionId, handler);
  subscribe(channel, handler);
}

export function unsubscribeSession(sessionId: string): void {
  const handler = handlers.get(sessionId);
  if (!handler) return;

  const channel = `session:status:${sessionId}`;
  unsubscribe(channel, handler);
  handlers.delete(sessionId);
}
