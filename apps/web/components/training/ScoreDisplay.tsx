"use client";

import { cn } from "@/lib/utils";

interface ScoreDisplayProps {
  score: number;
  previousScore?: number;
  className?: string;
}

function getScoreColor(score: number): string {
  if (score >= 85) return "text-outcome-optimal";
  if (score >= 70) return "text-outcome-acceptable";
  if (score >= 50) return "text-outcome-suboptimal";
  return "text-outcome-critical";
}

function getScoreGrade(score: number): string {
  if (score >= 95) return "A+";
  if (score >= 90) return "A";
  if (score >= 85) return "A-";
  if (score >= 80) return "B+";
  if (score >= 75) return "B";
  if (score >= 70) return "B-";
  if (score >= 65) return "C+";
  if (score >= 60) return "C";
  if (score >= 55) return "C-";
  if (score >= 50) return "D";
  return "F";
}

export function ScoreDisplay({ score, previousScore, className }: ScoreDisplayProps) {
  const trend = previousScore !== undefined ? score - previousScore : 0;
  const colorClass = getScoreColor(score);

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex flex-col items-center">
        <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
          Score
        </span>
        <span className={cn("font-mono text-3xl font-bold tabular-nums", colorClass)}>
          {Math.round(score)}
        </span>
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <span
          className={cn(
            "font-mono text-lg font-bold",
            colorClass
          )}
        >
          {getScoreGrade(score)}
        </span>
        {trend !== 0 && (
          <span
            className={cn(
              "font-mono text-xs font-bold",
              trend > 0 ? "text-outcome-optimal" : "text-outcome-critical"
            )}
          >
            {trend > 0 ? "+" : ""}{trend.toFixed(1)}
          </span>
        )}
      </div>
    </div>
  );
}

export { getScoreColor, getScoreGrade };
