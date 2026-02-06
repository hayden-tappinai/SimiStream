"use client";

import { useEffect, useState, useCallback } from "react";
import { useWebSocket } from "./use-websocket";
import type { SessionStatus, WsEvent } from "@simistream/types";

interface TrainingSessionState {
  sessionId: string;
  status: SessionStatus;
  profession: string;
  startedAt: string;
  endedAt: string | null;
}

interface UseTrainingSessionOptions {
  sessionId: string;
}

interface UseTrainingSessionReturn {
  session: TrainingSessionState | null;
  loading: boolean;
  error: string | null;
  wsConnected: boolean;
  endSession: () => Promise<void>;
}

export function useTrainingSession({
  sessionId,
}: UseTrainingSessionOptions): UseTrainingSessionReturn {
  const [session, setSession] = useState<TrainingSessionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleWsEvent = useCallback((event: WsEvent) => {
    if (event.type === "session:status") {
      setSession((prev) =>
        prev
          ? { ...prev, status: event.data.status }
          : prev
      );
    }
  }, []);

  const { connected: wsConnected } = useWebSocket({
    sessionId,
    onEvent: handleWsEvent,
    eventTypes: ["session:status"],
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchSession() {
      try {
        const res = await fetch(`/api/training/${sessionId}`);
        if (!res.ok) throw new Error("Failed to load session");
        const data = await res.json();
        if (!cancelled) {
          setSession({
            sessionId: data.session.id,
            status: data.session.status,
            profession: data.session.profession,
            startedAt: data.session.startedAt,
            endedAt: data.session.endedAt,
          });
        }
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchSession();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const endSession = useCallback(async () => {
    const res = await fetch(`/api/training/${sessionId}/end`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to end session");
    setSession((prev) =>
      prev ? { ...prev, status: "completed" as SessionStatus } : prev
    );
  }, [sessionId]);

  return { session, loading, error, wsConnected, endSession };
}
