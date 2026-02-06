"use client";

import { cn } from "@/lib/utils";
import { OutcomeBadge } from "./OutcomeBadge";

type EventSeverity = "low" | "medium" | "high" | "critical";
type ResponseOutcome = "optimal" | "acceptable" | "suboptimal" | "critical_error";

interface TimelineEvent {
  id: string;
  sequenceNumber: number;
  eventType: string;
  severity: EventSeverity;
  description: string;
  injectedAt: string;
  response?: {
    responseText: string;
    outcome: ResponseOutcome;
    feedback: string;
    scoreImpact: number;
    respondedAt: string;
  };
}

const severityDotStyles: Record<EventSeverity, string> = {
  low: "bg-severity-low",
  medium: "bg-severity-medium",
  high: "bg-severity-high",
  critical: "bg-severity-critical",
};

interface EventTimelineProps {
  events: TimelineEvent[];
  sessionStartedAt: string;
  className?: string;
}

function formatTimestamp(isoString: string, referenceTime: string): string {
  const diff = new Date(isoString).getTime() - new Date(referenceTime).getTime();
  const totalSeconds = Math.floor(diff / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `+${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function EventTimeline({
  events,
  sessionStartedAt,
  className,
}: EventTimelineProps) {
  return (
    <div className={cn("space-y-0", className)}>
      {events.map((event, index) => (
        <div key={event.id} className="relative flex gap-4">
          {/* Timeline connector */}
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "h-3 w-3 shrink-0 rounded-full border-2 border-surface",
                severityDotStyles[event.severity]
              )}
            />
            {index < events.length - 1 && (
              <div className="w-px flex-1 bg-border" />
            )}
          </div>

          {/* Event content */}
          <div className="flex-1 pb-6">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                {formatTimestamp(event.injectedAt, sessionStartedAt)}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground uppercase">
                {event.eventType.replace(/_/g, " ")}
              </span>
              <span
                className={cn(
                  "font-mono text-[10px] font-bold uppercase",
                  event.severity === "critical"
                    ? "text-severity-critical"
                    : event.severity === "high"
                    ? "text-severity-high"
                    : "text-muted-foreground"
                )}
              >
                [{event.severity}]
              </span>
            </div>

            <p className="mt-1 text-sm">{event.description}</p>

            {/* Response */}
            {event.response && (
              <div className="mt-2 border-l-2 border-border pl-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                    {formatTimestamp(event.response.respondedAt, sessionStartedAt)}
                  </span>
                  <OutcomeBadge outcome={event.response.outcome} />
                  <span
                    className={cn(
                      "font-mono text-[10px] font-bold",
                      event.response.scoreImpact >= 0
                        ? "text-outcome-optimal"
                        : "text-outcome-critical"
                    )}
                  >
                    {event.response.scoreImpact >= 0 ? "+" : ""}
                    {event.response.scoreImpact.toFixed(1)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  <span className="text-foreground">You: </span>
                  {event.response.responseText}
                </p>
                <p className="mt-0.5 text-xs italic text-muted-foreground">
                  {event.response.feedback}
                </p>
              </div>
            )}

            {!event.response && (
              <div className="mt-2 border-l-2 border-border/30 pl-3">
                <span className="font-mono text-[10px] text-muted-foreground italic">
                  No response recorded
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
