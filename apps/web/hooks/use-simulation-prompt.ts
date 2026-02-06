"use client";

import { useCallback, useState } from "react";
import { useWebSocket } from "./use-websocket";
import type { WsEvent } from "@simistream/types";

interface UseSimulationPromptOptions {
  sessionId: string;
}

interface UseSimulationPromptReturn {
  latestPrompt: string | undefined;
}

export function useSimulationPrompt({
  sessionId,
}: UseSimulationPromptOptions): UseSimulationPromptReturn {
  const [latestPrompt, setLatestPrompt] = useState<string | undefined>();

  const handleWsEvent = useCallback((wsEvent: WsEvent) => {
    if (wsEvent.type === "simulation:prompt") {
      setLatestPrompt(wsEvent.data.prompt);
    }
  }, []);

  useWebSocket({
    sessionId,
    onEvent: handleWsEvent,
    eventTypes: ["simulation:prompt"],
  });

  return { latestPrompt };
}
