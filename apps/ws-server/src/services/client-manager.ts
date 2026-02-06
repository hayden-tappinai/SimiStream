import type { WebSocket } from "ws";
import type { WsEvent } from "@simistream/types";

interface TrackedClient {
  ws: WebSocket;
  sessionId: string;
  alive: boolean;
}

const sessionClients = new Map<string, Set<TrackedClient>>();

export function addClient(ws: WebSocket, sessionId: string): TrackedClient {
  const client: TrackedClient = { ws, sessionId, alive: true };
  let clients = sessionClients.get(sessionId);
  if (!clients) {
    clients = new Set();
    sessionClients.set(sessionId, clients);
  }
  clients.add(client);
  return client;
}

export function removeClient(client: TrackedClient): void {
  const clients = sessionClients.get(client.sessionId);
  if (clients) {
    clients.delete(client);
    if (clients.size === 0) {
      sessionClients.delete(client.sessionId);
    }
  }
}

export function getClientCount(sessionId: string): number {
  return sessionClients.get(sessionId)?.size ?? 0;
}

export function getSessionIds(): string[] {
  return Array.from(sessionClients.keys());
}

export function broadcastToSession(
  sessionId: string,
  event: WsEvent,
): void {
  const clients = sessionClients.get(sessionId);
  if (!clients) return;

  const message = JSON.stringify(event);
  for (const client of clients) {
    if (client.ws.readyState === client.ws.OPEN) {
      client.ws.send(message);
    }
  }
}

// Heartbeat: mark all clients alive=false, then ping
export function pingAll(): void {
  for (const clients of sessionClients.values()) {
    for (const client of clients) {
      if (!client.alive) {
        client.ws.terminate();
        continue;
      }
      client.alive = false;
      client.ws.ping();
    }
  }
}

export function markAlive(client: TrackedClient): void {
  client.alive = true;
}

export type { TrackedClient };
