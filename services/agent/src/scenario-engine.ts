import { prisma } from "@simistream/db";
import type { ProfessionConfig, ScenarioEvent } from "@simistream/types";
import { generateEvent } from "./event-generator";
import { synthesizePrompt } from "./prompt-synthesizer";
import { DifficultyManager } from "./difficulty-manager";

export interface ScenarioEngineHandle {
  stop: () => void;
}

/**
 * Starts the scenario injection loop for a training session.
 *
 * The engine:
 * 1. Loads the profession's base scenario prompt and event templates
 * 2. Runs an async loop injecting events at random intervals (15-90s)
 * 3. Each event is persisted to the DB and published via the onEvent callback
 * 4. Difficulty adapts based on trainee performance (via DifficultyManager)
 *
 * Returns a handle with a stop() function to end the loop.
 */
export async function startScenarioInjection(
  sessionId: string,
  profession: ProfessionConfig,
  onEvent: (event: ScenarioEvent, synthesizedPrompt: string) => void,
): Promise<ScenarioEngineHandle> {
  let running = true;
  const difficultyManager = new DifficultyManager(1);
  const sessionHistory: ScenarioEvent[] = [];

  async function getActiveEvents(): Promise<ScenarioEvent[]> {
    const rows = await prisma.scenarioEvent.findMany({
      where: { sessionId, resolved: false },
      orderBy: { sequenceNumber: "asc" },
    });
    return rows.map(mapDbEventToType);
  }

  async function getNextSequenceNumber(): Promise<number> {
    const last = await prisma.scenarioEvent.findFirst({
      where: { sessionId },
      orderBy: { sequenceNumber: "desc" },
      select: { sequenceNumber: true },
    });
    return (last?.sequenceNumber ?? 0) + 1;
  }

  async function loop(): Promise<void> {
    let isFirstEvent = true;
    while (running) {
      // First event comes quickly (3s), subsequent events use difficulty-based intervals
      const interval = isFirstEvent ? 3_000 : difficultyManager.getEventInterval();
      await sleep(interval);
      if (!running) break;
      isFirstEvent = false;

      try {
        const activeEvents = await getActiveEvents();
        const maxConcurrent = difficultyManager.getMaxConcurrentEvents();

        // Skip if we already have too many active events
        if (activeEvents.length >= maxConcurrent) continue;

        const difficulty = difficultyManager.getCurrentDifficulty();
        const severityWeights = difficultyManager.getSeverityWeights();

        const generated = await generateEvent(
          profession,
          activeEvents,
          difficulty,
          sessionHistory,
          severityWeights,
        );

        if (!running) break;

        const seqNum = await getNextSequenceNumber();

        // Persist to DB
        const dbEvent = await prisma.scenarioEvent.create({
          data: {
            sessionId,
            sequenceNumber: seqNum,
            eventType: generated.eventType,
            severity: generated.severity,
            description: generated.description,
            odysseyPrompt: generated.odysseyPrompt,
            responseDeadlineMs: generated.responseDeadlineMs,
          },
        });

        const event = mapDbEventToType(dbEvent);
        sessionHistory.push(event);

        // Synthesize updated Odyssey prompt (base + latest event)
        const synthesized = synthesizePrompt(
          profession.baseScenarioPrompt,
          [event],
        );

        onEvent(event, synthesized);
      } catch (err) {
        console.error(`[scenario-engine] Error in injection loop:`, err);
        // Continue the loop — one failed event shouldn't kill the session
      }
    }
  }

  // Fire and forget the loop
  loop().catch((err) => {
    console.error(`[scenario-engine] Fatal loop error:`, err);
  });

  return {
    stop() {
      running = false;
    },
  };
}

// ─── Helpers ────────────────────────────────────────────

function mapDbEventToType(row: {
  id: string;
  sessionId: string;
  sequenceNumber: number;
  eventType: string;
  severity: string;
  description: string;
  odysseyPrompt: string;
  injectedAt: Date;
  responseDeadlineMs: number | null;
  resolved: boolean;
}): ScenarioEvent {
  return {
    id: row.id,
    sessionId: row.sessionId,
    sequenceNumber: row.sequenceNumber,
    eventType: row.eventType as ScenarioEvent["eventType"],
    severity: row.severity as ScenarioEvent["severity"],
    description: row.description,
    odysseyPrompt: row.odysseyPrompt,
    injectedAt: row.injectedAt,
    responseDeadlineMs: row.responseDeadlineMs,
    resolved: row.resolved,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
