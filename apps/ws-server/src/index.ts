import { config } from "dotenv";
import path from "node:path";
config({ path: path.resolve(__dirname, "../../../.env.local") });

import http from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { getEnv } from "@simistream/config";
import {
  addClient,
  removeClient,
  getClientCount,
  pingAll,
  markAlive,
  type TrackedClient,
} from "./services/client-manager";
import { cleanup as cleanupRedis } from "./services/redis-subscriber";
import { cleanupPublisher } from "./services/redis-publisher";
import { subscribeSession, unsubscribeSession } from "./handlers/session-handler";
import { subscribeScenario, unsubscribeScenario } from "./handlers/scenario-handler";
import { subscribeScore, unsubscribeScore } from "./handlers/score-handler";
import { subscribeTraining, unsubscribeTraining, checkAndStartInjection } from "./handlers/training-handler";
import { subscribeSimulationPrompt, unsubscribeSimulationPrompt } from "./handlers/simulation-prompt-handler";

const env = getEnv();
const PORT = env.WS_SERVER_PORT;

// ─── HTTP Server (health check) ─────────────────────────

const server = http.createServer((req, res) => {
  if (req.url === "/health" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", uptime: process.uptime() }));
    return;
  }
  res.writeHead(404);
  res.end();
});

// ─── WebSocket Server ───────────────────────────────────

const wss = new WebSocketServer({ server });

function parseSessionId(url: string | undefined): string | null {
  if (!url) return null;
  // Expected URL format: /sessions/:sessionId
  const match = url.match(/^\/sessions\/([a-zA-Z0-9-]+)\/?$/);
  return match?.[1] ?? null;
}

function subscribeAll(sessionId: string): void {
  subscribeSession(sessionId);
  subscribeScenario(sessionId);
  subscribeScore(sessionId);
  subscribeTraining(sessionId);
  subscribeSimulationPrompt(sessionId);
}

function unsubscribeAll(sessionId: string): void {
  unsubscribeSession(sessionId);
  unsubscribeScenario(sessionId);
  unsubscribeScore(sessionId);
  unsubscribeTraining(sessionId);
  unsubscribeSimulationPrompt(sessionId);
}

wss.on("connection", (ws: WebSocket, req) => {
  const sessionId = parseSessionId(req.url);

  if (!sessionId) {
    ws.close(4000, "Missing or invalid session ID in URL path");
    return;
  }

  const client: TrackedClient = addClient(ws, sessionId);
  console.log(
    `[ws] Client connected to session ${sessionId} (${getClientCount(sessionId)} clients)`,
  );

  // Subscribe to Redis channels for this session (idempotent)
  subscribeAll(sessionId);

  // Start scenario injection if this session is active and not already running.
  // This triggers on WS connect instead of via Redis pub/sub to avoid the race
  // condition where the API route publishes before a client is connected.
  checkAndStartInjection(sessionId);

  // Heartbeat pong handler
  ws.on("pong", () => {
    markAlive(client);
  });

  ws.on("close", () => {
    removeClient(client);
    const remaining = getClientCount(sessionId);
    console.log(
      `[ws] Client disconnected from session ${sessionId} (${remaining} clients)`,
    );

    // Unsubscribe from Redis if no more clients for this session
    if (remaining === 0) {
      unsubscribeAll(sessionId);
    }
  });

  ws.on("error", (err) => {
    console.error(`[ws] Client error on session ${sessionId}:`, err);
  });
});

// ─── Heartbeat interval ─────────────────────────────────

const HEARTBEAT_INTERVAL = 30_000;
const heartbeat = setInterval(() => {
  pingAll();
}, HEARTBEAT_INTERVAL);

wss.on("close", () => {
  clearInterval(heartbeat);
});

// ─── Start ──────────────────────────────────────────────

server.listen(PORT, () => {
  console.log(`[ws-server] Listening on port ${PORT}`);
});

// ─── Graceful shutdown ──────────────────────────────────

async function shutdown() {
  console.log("[ws-server] Shutting down...");
  clearInterval(heartbeat);
  wss.close();
  server.close();
  await cleanupRedis();
  await cleanupPublisher();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
