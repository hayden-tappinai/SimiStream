"use client";

import { cn } from "@/lib/utils";
import { getScoreColor, getScoreGrade } from "./ScoreDisplay";

interface ResultsSummaryProps {
  overallScore: number;
  reactionTimeAvg: number;
  criticalErrorCount: number;
  optimalResponseRate: number;
  totalEvents: number;
  totalResponses: number;
  className?: string;
}

export function ResultsSummary({
  overallScore,
  reactionTimeAvg,
  criticalErrorCount,
  optimalResponseRate,
  totalEvents,
  totalResponses,
  className,
}: ResultsSummaryProps) {
  const scoreColor = getScoreColor(overallScore);
  const grade = getScoreGrade(overallScore);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Big score display */}
      <div className="flex flex-col items-center gap-2 py-6">
        <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
          Final Score
        </span>
        <div className="flex items-baseline gap-3">
          <span
            className={cn("font-mono text-7xl font-bold tabular-nums", scoreColor)}
          >
            {Math.round(overallScore)}
          </span>
          <span className={cn("font-mono text-3xl font-bold", scoreColor)}>
            {grade}
          </span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatBox
          label="Avg Reaction"
          value={`${reactionTimeAvg.toFixed(1)}s`}
          highlight={reactionTimeAvg < 10}
        />
        <StatBox
          label="Critical Errors"
          value={String(criticalErrorCount)}
          highlight={criticalErrorCount === 0}
          negative={criticalErrorCount > 0}
        />
        <StatBox
          label="Optimal Rate"
          value={`${Math.round(optimalResponseRate * 100)}%`}
          highlight={optimalResponseRate >= 0.7}
        />
        <StatBox
          label="Response Rate"
          value={`${totalResponses}/${totalEvents}`}
          highlight={totalResponses === totalEvents}
        />
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  highlight,
  negative,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="border border-border bg-surface p-4 text-center">
      <span className="block font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <span
        className={cn(
          "mt-1 block font-mono text-2xl font-bold tabular-nums",
          negative
            ? "text-outcome-critical"
            : highlight
            ? "text-outcome-optimal"
            : "text-foreground"
        )}
      >
        {value}
      </span>
    </div>
  );
}
