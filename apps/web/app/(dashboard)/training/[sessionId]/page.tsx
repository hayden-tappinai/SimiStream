"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useCallback, useEffect, useRef } from "react";
import { useTrainingSession } from "@/hooks/use-training-session";
import { useScenarioEvents } from "@/hooks/use-scenario-events";
import { useScore } from "@/hooks/use-score";
import { useSimulationPrompt } from "@/hooks/use-simulation-prompt";
import { useOdyssey } from "@/hooks/use-odyssey";
import { getProfessionById } from "@simistream/types/industries";
import { OdysseyStream } from "@/components/shared/OdysseyStream";
import { ScenarioNarrative } from "@/components/training/ScenarioNarrative";
import { TrainingHUD } from "@/components/training/TrainingHUD";
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import type { ResponseOutcome } from "@simistream/types";

interface FeedbackState {
  eventId: string;
  outcome: ResponseOutcome;
  feedback: string;
  scoreImpact: number;
}

export default function ActiveTrainingPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const sessionId = params.sessionId;

  const { session, loading, error, endSession } = useTrainingSession({ sessionId });
  const { events } = useScenarioEvents({ sessionId });
  const { score, previousScore } = useScore({ sessionId });
  const { latestPrompt } = useSimulationPrompt({ sessionId });
  const [respondLoading, setRespondLoading] = useState(false);
  const [respondError, setRespondError] = useState<string | null>(null);
  const [recentFeedback, setRecentFeedback] = useState<FeedbackState | null>(null);

  const professionConfig = session
    ? getProfessionById(session.profession)
    : undefined;

  const {
    status: odysseyStatus,
    videoRef,
    startStream,
    interact,
  } = useOdyssey({
    apiKey: null,
    autoConnect: true,
  });

  // Track whether the stream is truly ready (startStream resolved)
  const [streamReady, setStreamReady] = useState(false);
  const startingStreamRef = useRef(false);

  // Start the Odyssey stream with the base scenario prompt once connected.
  // Only sets streamReady=true AFTER the startStream() Promise resolves.
  useEffect(() => {
    if (
      odysseyStatus === "connected" &&
      professionConfig &&
      !streamReady &&
      !startingStreamRef.current
    ) {
      startingStreamRef.current = true;
      console.log("[training] Starting stream with base prompt:", professionConfig.baseScenarioPrompt.slice(0, 80));

      startStream(professionConfig.baseScenarioPrompt)
        .then((streamId) => {
          console.log("[training] Stream is ready, streamId:", streamId);
          setStreamReady(true);
        })
        .catch((err) => {
          console.error("[training] Failed to start stream:", err);
          startingStreamRef.current = false; // Allow retry
        });
    }
  }, [odysseyStatus, professionConfig, streamReady, startStream]);

  // Update Odyssey visual when new simulation prompts arrive.
  // Only sends interact() when the stream is truly ready.
  useEffect(() => {
    if (latestPrompt && streamReady) {
      interact(latestPrompt)
        .then(() =>
          console.log("[training] Interaction acknowledged:", latestPrompt.slice(0, 50))
        )
        .catch((err) =>
          console.error("[training] Interaction failed:", err)
        );
    }
  }, [latestPrompt, streamReady, interact]);

  const handleRespond = useCallback(
    async (eventId: string, responseText: string): Promise<boolean> => {
      setRespondLoading(true);
      setRespondError(null);
      try {
        const res = await fetch(`/api/training/${sessionId}/respond`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId, responseText }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          const message = errData?.error ?? "Failed to submit response";
          setRespondError(message);
          return false;
        }

        const data = await res.json();
        setRecentFeedback({
          eventId,
          outcome: data.response.outcome,
          feedback: data.response.feedback,
          scoreImpact: data.response.scoreImpact,
        });

        // Clear feedback after 5 seconds
        setTimeout(() => {
          setRecentFeedback((prev) =>
            prev?.eventId === eventId ? null : prev
          );
        }, 5000);

        return true;
      } catch {
        setRespondError("Network error — could not reach server");
        return false;
      } finally {
        setRespondLoading(false);
      }
    },
    [sessionId]
  );

  const handleEndSession = useCallback(async () => {
    try {
      await endSession();
      router.push(`/training/${sessionId}/results`);
    } catch {
      // stay on page
    }
  }, [endSession, router, sessionId]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-sm text-muted-foreground">
            LOADING SESSION...
          </span>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <div className="border border-destructive/50 bg-destructive/10 p-8 max-w-md text-center">
          <h2 className="text-lg font-bold text-destructive">Session Error</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {error || "Session not found."}
          </p>
          <Button variant="outline" className="mt-4" onClick={() => router.push("/")}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (session.status === "completed") {
    router.push(`/training/${sessionId}/results`);
    return null;
  }

  return (
    <ErrorBoundary>
      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Left: Odyssey Video + Scenario Narrative */}
        <div className="relative flex flex-col flex-[65] border-r border-border">
          {/* Top: Odyssey Video Stream */}
          <div className="relative flex-[60] min-h-0 bg-black">
            <OdysseyStream
              videoRef={videoRef}
              status={odysseyStatus}
              className="h-full w-full rounded-none border-0"
            />
          </div>

          {/* Bottom: Scenario Narrative */}
          <div className="flex-[40] min-h-0 overflow-hidden">
            <ScenarioNarrative
              professionName={professionConfig?.name ?? session.profession}
              baseDescription={
                professionConfig?.baseScenarioPrompt ??
                "Scenario loading..."
              }
              events={events.map((e) => ({
                id: e.id,
                description: e.description,
                severity: e.severity as "low" | "medium" | "high" | "critical",
                injectedAt: e.injectedAt,
                resolved: e.resolved,
              }))}
              synthesizedPrompt={latestPrompt}
              className="h-full"
            />
          </div>

          {/* Overlay: end session button */}
          <div className="absolute bottom-4 right-4 z-10">
            <button
              onClick={handleEndSession}
              className="border border-destructive/50 bg-surface/80 backdrop-blur px-3 py-1.5 font-mono text-[10px] font-bold uppercase text-destructive transition-colors hover:bg-destructive/20"
            >
              End Session
            </button>
          </div>
        </div>

        {/* Right: Training HUD */}
        <div className="flex-[35]">
          <TrainingHUD
            sessionId={sessionId}
            startedAt={session.startedAt}
            events={events.map((e) => ({
              id: e.id,
              description: e.description,
              severity: e.severity as "low" | "medium" | "high" | "critical",
              injectedAt: e.injectedAt,
              responseDeadlineMs: e.responseDeadlineMs ?? undefined,
              resolved: e.resolved,
            }))}
            score={score}
            previousScore={previousScore}
            recentFeedback={recentFeedback}
            onRespond={handleRespond}
            respondLoading={respondLoading}
            respondError={respondError}
            className="h-full"
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}
