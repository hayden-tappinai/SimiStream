"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type EventSeverity = "low" | "medium" | "high" | "critical";

const severityStyles: Record<EventSeverity, string> = {
  low: "border-severity-low/30 bg-severity-low/5",
  medium: "border-severity-medium/30 bg-severity-medium/5",
  high: "border-severity-high/30 bg-severity-high/5",
  critical: "border-severity-critical/30 bg-severity-critical/5",
};

const severityBadgeStyles: Record<EventSeverity, string> = {
  low: "bg-severity-low/20 text-severity-low",
  medium: "bg-severity-medium/20 text-severity-medium",
  high: "bg-severity-high/20 text-severity-high",
  critical: "bg-severity-critical/20 text-severity-critical",
};

interface ActiveEventCardProps {
  id: string;
  description: string;
  severity: EventSeverity;
  injectedAt: string;
  responseDeadlineMs?: number;
  resolved: boolean;
  onRespond: (eventId: string) => void;
}

export function ActiveEventCard({
  id,
  description,
  severity,
  injectedAt,
  responseDeadlineMs,
  resolved,
  onRespond,
}: ActiveEventCardProps) {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const isCritical = severity === "critical";

  useEffect(() => {
    if (!responseDeadlineMs) return;

    const injectedTime = new Date(injectedAt).getTime();
    const deadline = injectedTime + responseDeadlineMs;

    const interval = setInterval(() => {
      const remaining = deadline - Date.now();
      setTimeRemaining(Math.max(0, remaining));
    }, 100);

    return () => clearInterval(interval);
  }, [injectedAt, responseDeadlineMs]);

  const deadlinePassed = timeRemaining !== null && timeRemaining <= 0;
  const urgencyClass =
    timeRemaining !== null && timeRemaining < 5000 && timeRemaining > 0
      ? "animate-pulse"
      : "";

  return (
    <div
      className={cn(
        "relative border-l-4 p-3 transition-all",
        severityStyles[severity],
        isCritical && !resolved && "flash-critical",
        resolved && "opacity-50"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase",
                severityBadgeStyles[severity]
              )}
            >
              {severity}
            </span>
            {timeRemaining !== null && !resolved && (
              <span
                className={cn(
                  "font-mono text-[10px] tabular-nums",
                  deadlinePassed
                    ? "text-outcome-critical font-bold"
                    : "text-muted-foreground",
                  urgencyClass
                )}
              >
                {deadlinePassed
                  ? "OVERDUE"
                  : `${Math.ceil(timeRemaining / 1000)}s`}
              </span>
            )}
            {resolved && (
              <span className="font-mono text-[10px] text-muted-foreground">
                RESOLVED
              </span>
            )}
          </div>
          <p className="text-sm leading-snug">{description}</p>
        </div>

        {!resolved && (
          <button
            onClick={() => onRespond(id)}
            className="shrink-0 border border-accent/50 bg-accent/10 px-2 py-1 font-mono text-[10px] font-bold uppercase text-accent transition-colors hover:bg-accent/20"
          >
            Respond
          </button>
        )}
      </div>
    </div>
  );
}
