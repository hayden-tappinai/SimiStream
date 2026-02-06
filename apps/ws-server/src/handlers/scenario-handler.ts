import { subscribe, unsubscribe } from "../services/redis-subscriber";
import { broadcastToSession } from "../services/client-manager";
import type { WsEvent } from "@simistream/types";

const eventHandlers = new Map<string, (event: WsEvent) => void>();
const updateHandlers = new Map<string, (event: WsEvent) => void>();

export function subscribeScenario(sessionId: string): void {
  if (!eventHandlers.has(sessionId)) {
    const eventChannel = `scenario:event:${sessionId}`;
    const handler = (event: WsEvent) => {
      if (event.type === "scenario:event") {
        broadcastToSession(sessionId, event);
      }
    };
    eventHandlers.set(sessionId, handler);
    subscribe(eventChannel, handler);
  }

  if (!updateHandlers.has(sessionId)) {
    const updateChannel = `scenario:update:${sessionId}`;
    const handler = (event: WsEvent) => {
      if (event.type === "scenario:update") {
        broadcastToSession(sessionId, event);
      }
    };
    updateHandlers.set(sessionId, handler);
    subscribe(updateChannel, handler);
  }
}

export function unsubscribeScenario(sessionId: string): void {
  const eventHandler = eventHandlers.get(sessionId);
  if (eventHandler) {
    unsubscribe(`scenario:event:${sessionId}`, eventHandler);
    eventHandlers.delete(sessionId);
  }

  const updateHandler = updateHandlers.get(sessionId);
  if (updateHandler) {
    unsubscribe(`scenario:update:${sessionId}`, updateHandler);
    updateHandlers.delete(sessionId);
  }
}
