"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ActiveEventCard } from "./ActiveEventCard";
import { ResponseInput } from "./ResponseInput";
import { ScoreDisplay } from "./ScoreDisplay";
import { SessionTimer } from "./SessionTimer";
import { OutcomeBadge } from "./OutcomeBadge";

type EventSeverity = "low" | "medium" | "high" | "critical";
type ResponseOutcome = "optimal" | "acceptable" | "suboptimal" | "critical_error";

interface ScenarioEvent {
  id: string;
  description: string;
  severity: EventSeverity;
  injectedAt: string;
  responseDeadlineMs?: number;
  resolved: boolean;
}

interface TraineeResponseFeedback {
  eventId: string;
  outcome: ResponseOutcome;
  feedback: string;
  scoreImpact: number;
}

interface TrainingHUDProps {
  sessionId: string;
  startedAt: string;
  events: ScenarioEvent[];
  score: number;
  previousScore?: number;
  recentFeedback: TraineeResponseFeedback | null;
  onRespond: (eventId: string, responseText: string) => Promise<boolean>;
  respondLoading?: boolean;
  respondError?: string | null;
  className?: string;
}

export function TrainingHUD({
  sessionId,
  startedAt,
  events,
  score,
  previousScore,
  recentFeedback,
  onRespond,
  respondLoading,
  respondError,
  className,
}: TrainingHUDProps) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const activeEvents = events.filter((e) => !e.resolved);
  const resolvedEvents = events.filter((e) => e.resolved);

  const handleRespond = useCallback(
    (eventId: string) => {
      setSelectedEventId(eventId);
    },
    []
  );

  const handleSubmitResponse = useCallback(
    async (eventId: string, responseText: string) => {
      const success = await onRespond(eventId, responseText);
      if (success) {
        setSelectedEventId(null);
      }
    },
    [onRespond]
  );

  return (
    <div
      className={cn(
        "flex h-full flex-col border-l-2 border-border bg-surface-raised",
        className
      )}
    >
      {/* Header stats bar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <SessionTimer startedAt={startedAt} />
        <ScoreDisplay score={score} previousScore={previousScore} />
      </div>

      {/* Feedback toast */}
      {recentFeedback && (
        <div className="border-b border-border px-4 py-2 bg-surface-overlay">
          <div className="flex items-center gap-2">
            <OutcomeBadge outcome={recentFeedback.outcome} />
            <span
              className={cn(
                "font-mono text-xs font-bold",
                recentFeedback.scoreImpact >= 0
                  ? "text-outcome-optimal"
                  : "text-outcome-critical"
              )}
            >
              {recentFeedback.scoreImpact >= 0 ? "+" : ""}
              {recentFeedback.scoreImpact.toFixed(1)}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {recentFeedback.feedback}
          </p>
        </div>
      )}

      {/* Active events list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="px-3 py-2">
          <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
            Active Events ({activeEvents.length})
          </span>
        </div>

        {activeEvents.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="font-mono text-xs text-muted-foreground">
              Awaiting scenario events...
            </p>
          </div>
        ) : (
          <div className="space-y-1 px-2 pb-2">
            {activeEvents.map((event) => (
              <ActiveEventCard
                key={event.id}
                id={event.id}
                description={event.description}
                severity={event.severity}
                injectedAt={event.injectedAt}
                responseDeadlineMs={event.responseDeadlineMs}
                resolved={event.resolved}
                onRespond={handleRespond}
              />
            ))}
          </div>
        )}

        {resolvedEvents.length > 0 && (
          <>
            <div className="px-3 py-2">
              <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                Resolved ({resolvedEvents.length})
              </span>
            </div>
            <div className="space-y-1 px-2 pb-2">
              {resolvedEvents.slice(-5).map((event) => (
                <ActiveEventCard
                  key={event.id}
                  id={event.id}
                  description={event.description}
                  severity={event.severity}
                  injectedAt={event.injectedAt}
                  responseDeadlineMs={event.responseDeadlineMs}
                  resolved={event.resolved}
                  onRespond={handleRespond}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Response input */}
      <div className="border-t border-border p-3">
        <ResponseInput
          activeEventId={selectedEventId}
          onSubmit={handleSubmitResponse}
          loading={respondLoading}
          error={respondError}
        />
      </div>
    </div>
  );
}
