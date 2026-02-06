"use client";

import { useCallback, useState } from "react";
import { useWebSocket } from "./use-websocket";
import type { WsEvent, EventSeverity } from "@simistream/types";

interface ScenarioEventState {
  id: string;
  sequenceNumber: number;
  eventType: string;
  severity: EventSeverity;
  description: string;
  injectedAt: string;
  responseDeadlineMs: number | null;
  resolved: boolean;
}

interface UseScenarioEventsOptions {
  sessionId: string;
}

interface UseScenarioEventsReturn {
  events: ScenarioEventState[];
  wsConnected: boolean;
}

export function useScenarioEvents({
  sessionId,
}: UseScenarioEventsOptions): UseScenarioEventsReturn {
  const [events, setEvents] = useState<ScenarioEventState[]>([]);

  const handleWsEvent = useCallback((wsEvent: WsEvent) => {
    if (wsEvent.type === "scenario:event") {
      const e = wsEvent.data;
      setEvents((prev) => [
        ...prev,
        {
          id: e.id,
          sequenceNumber: e.sequenceNumber,
          eventType: e.eventType,
          severity: e.severity as EventSeverity,
          description: e.description,
          injectedAt:
            typeof e.injectedAt === "string"
              ? e.injectedAt
              : new Date(e.injectedAt).toISOString(),
          responseDeadlineMs: e.responseDeadlineMs,
          resolved: e.resolved,
        },
      ]);
    }

    if (wsEvent.type === "scenario:update") {
      const { eventId, resolved, responseDeadlineMs } = wsEvent.data;
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId
            ? {
                ...e,
                ...(resolved !== undefined && { resolved }),
                ...(responseDeadlineMs !== undefined && { responseDeadlineMs }),
              }
            : e
        )
      );
    }
  }, []);

  const { connected: wsConnected } = useWebSocket({
    sessionId,
    onEvent: handleWsEvent,
    eventTypes: ["scenario:event", "scenario:update"],
  });

  return { events, wsConnected };
}
