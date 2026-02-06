import { subscribe, unsubscribe } from "../services/redis-subscriber";
import { broadcastToSession } from "../services/client-manager";
import type { WsEvent } from "@simistream/types";

const handlers = new Map<string, (event: WsEvent) => void>();

export function subscribeSimulationPrompt(sessionId: string): void {
  if (handlers.has(sessionId)) return;

  const channel = `simulation:prompt:${sessionId}`;
  const handler = (event: WsEvent) => {
    if (event.type === "simulation:prompt") {
      broadcastToSession(sessionId, event);
    }
  };

  handlers.set(sessionId, handler);
  subscribe(channel, handler);
}

export function unsubscribeSimulationPrompt(sessionId: string): void {
  const handler = handlers.get(sessionId);
  if (!handler) return;

  unsubscribe(`simulation:prompt:${sessionId}`, handler);
  handlers.delete(sessionId);
}
