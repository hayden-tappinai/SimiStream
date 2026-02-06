import { subscribe, unsubscribe } from "../services/redis-subscriber";
import { publish } from "../services/redis-publisher";
import type { WsEvent, ScenarioEvent } from "@simistream/types";
import { getProfessionById } from "@simistream/types/industries";

type StopFunction = () => void;

const endedHandlers = new Map<string, (event: WsEvent) => void>();
const activeInjections = new Map<string, StopFunction>();
const startingInjections = new Set<string>();

/**
 * Start the scenario injection engine for a session.
 * Converts the profession string to a ProfessionConfig, passes an onEvent
 * callback that publishes scenario events and simulation prompts to Redis,
 * and stores the stop handle.
 */
async function tryStartInjection(
  sessionId: string,
  profession: string,
): Promise<void> {
  try {
    const professionConfig = getProfessionById(profession);
    if (!professionConfig) {
      console.warn(
        `[training-handler] Unknown profession "${profession}", skipping injection`,
      );
      return;
    }

    const engine = await import("@simistream/agent");
    if (typeof engine.startScenarioInjection !== "function") {
      console.warn(
        "[training-handler] @simistream/agent does not export startScenarioInjection",
      );
      return;
    }

    const handle = await engine.startScenarioInjection(
      sessionId,
      professionConfig,
      (event: ScenarioEvent, synthesizedPrompt: string) => {
        // Publish the new scenario event to Redis
        publish(`scenario:event:${sessionId}`, {
          type: "scenario:event",
          data: event,
        });

        // Publish the synthesized simulation prompt to Redis
        publish(`simulation:prompt:${sessionId}`, {
          type: "simulation:prompt",
          data: { sessionId, prompt: synthesizedPrompt },
        });
      },
    );

    activeInjections.set(sessionId, handle.stop);
    console.log(
      `[training-handler] Started scenario injection for session ${sessionId}`,
    );
  } catch (err) {
    console.warn(
      "[training-handler] Could not load simulation engine, skipping injection:",
      err,
    );
  }
}

function stopInjection(sessionId: string): void {
  const stop = activeInjections.get(sessionId);
  if (stop) {
    stop();
    activeInjections.delete(sessionId);
    console.log(
      `[training-handler] Stopped scenario injection for session ${sessionId}`,
    );
  }
}

/**
 * Called when a WebSocket client connects to a session.
 * If the session is active and injection isn't already running, starts it.
 * This avoids the race condition of relying on Redis pub/sub from the API route.
 */
export async function checkAndStartInjection(
  sessionId: string,
): Promise<void> {
  // Already running or starting — nothing to do
  if (activeInjections.has(sessionId) || startingInjections.has(sessionId)) return;
  startingInjections.add(sessionId);

  try {
    const { prisma } = await import("@simistream/db");
    const session = await prisma.trainingSession.findUnique({
      where: { id: sessionId },
      select: { profession: true, status: true },
    });

    if (session && session.status === "active") {
      await tryStartInjection(sessionId, session.profession);
    }
  } catch (err) {
    console.error(
      `[training-handler] Failed to check/start injection for session ${sessionId}:`,
      err,
    );
  } finally {
    startingInjections.delete(sessionId);
  }
}

export function subscribeTraining(sessionId: string): void {
  // Listen for training:ended to stop injection
  if (!endedHandlers.has(sessionId)) {
    const endedChannel = `training:ended:${sessionId}`;
    const handler = (event: WsEvent) => {
      if (
        event.type === "session:status" &&
        event.data.status === "completed"
      ) {
        stopInjection(sessionId);
      }
    };
    endedHandlers.set(sessionId, handler);
    subscribe(endedChannel, handler);
  }
}

export function unsubscribeTraining(sessionId: string): void {
  const endedHandler = endedHandlers.get(sessionId);
  if (endedHandler) {
    unsubscribe(`training:ended:${sessionId}`, endedHandler);
    endedHandlers.delete(sessionId);
  }

  stopInjection(sessionId);
}
