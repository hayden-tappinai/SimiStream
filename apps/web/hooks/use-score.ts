"use client";

import { useCallback, useRef, useState } from "react";
import { useWebSocket } from "./use-websocket";
import type { WsEvent } from "@simistream/types";

interface UseScoreOptions {
  sessionId: string;
  initialScore?: number;
}

interface UseScoreReturn {
  score: number;
  previousScore: number | undefined;
}

export function useScore({
  sessionId,
  initialScore = 100,
}: UseScoreOptions): UseScoreReturn {
  const [score, setScore] = useState(initialScore);
  const previousScoreRef = useRef<number | undefined>(undefined);

  const handleWsEvent = useCallback((event: WsEvent) => {
    if (event.type === "score:update") {
      setScore((prev) => {
        previousScoreRef.current = prev;
        return event.data.currentScore;
      });
    }
  }, []);

  useWebSocket({
    sessionId,
    onEvent: handleWsEvent,
    eventTypes: ["score:update"],
  });

  return { score, previousScore: previousScoreRef.current };
}
