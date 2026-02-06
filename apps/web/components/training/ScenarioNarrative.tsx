"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type EventSeverity = "low" | "medium" | "high" | "critical";

interface NarrativeEvent {
  id: string;
  description: string;
  severity: EventSeverity;
  injectedAt: Date | string;
  resolved: boolean;
}

interface ScenarioNarrativeProps {
  professionName: string;
  baseDescription: string;
  events: NarrativeEvent[];
  synthesizedPrompt?: string;
  className?: string;
}

const severityLabel: Record<EventSeverity, string> = {
  low: "NOTICE",
  medium: "ALERT",
  high: "WARNING",
  critical: "CRITICAL",
};

const severityTextColor: Record<EventSeverity, string> = {
  low: "text-severity-low",
  medium: "text-severity-medium",
  high: "text-severity-high",
  critical: "text-severity-critical",
};

const severityBorderColor: Record<EventSeverity, string> = {
  low: "border-severity-low/30",
  medium: "border-severity-medium/30",
  high: "border-severity-high/30",
  critical: "border-severity-critical/30",
};

function formatTime(dateInput: Date | string): string {
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function ScenarioNarrative({
  professionName,
  baseDescription,
  events,
  synthesizedPrompt,
  className,
}: ScenarioNarrativeProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [events.length, synthesizedPrompt]);

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-black/95 text-gray-300",
        className
      )}
    >
      {/* Header */}
      <div className="shrink-0 border-b border-border px-5 py-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-accent">
            Scenario Active
          </span>
        </div>
        <h2 className="mt-1 text-lg font-bold text-white">{professionName}</h2>
      </div>

      {/* Scrollable narrative area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4 space-y-4"
      >
        {/* Initial briefing */}
        <div className="border border-accent/20 bg-accent/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-accent">
              Initial Briefing
            </span>
          </div>
          <p className="font-mono text-sm leading-relaxed text-gray-400">
            {baseDescription}
          </p>
        </div>

        {/* Waiting state when no events */}
        {events.length === 0 && !synthesizedPrompt && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="mx-auto mb-3 h-1 w-12 bg-accent/30 animate-pulse" />
              <p className="font-mono text-xs text-muted-foreground">
                Scenario initializing...
              </p>
            </div>
          </div>
        )}

        {/* Event entries */}
        {events.map((event) => (
          <div
            key={event.id}
            className={cn(
              "border-l-2 pl-4 py-1 narrative-entry",
              severityBorderColor[event.severity],
              event.severity === "critical" && "flash-critical",
              event.resolved && "opacity-50"
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                {formatTime(event.injectedAt)}
              </span>
              <span
                className={cn(
                  "font-mono text-[10px] font-bold uppercase",
                  severityTextColor[event.severity]
                )}
              >
                {severityLabel[event.severity]}
              </span>
              {event.resolved && (
                <span className="font-mono text-[10px] text-muted-foreground">
                  [RESOLVED]
                </span>
              )}
            </div>
            <p className="font-mono text-sm leading-relaxed">
              {event.description}
            </p>
          </div>
        ))}

        {/* Synthesized prompt / narrative update */}
        {synthesizedPrompt && (
          <div className="border-l-2 border-accent/40 pl-4 py-1 narrative-entry">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-accent">
                Situation Update
              </span>
            </div>
            <p className="font-mono text-sm leading-relaxed text-gray-400 italic">
              {synthesizedPrompt}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
