"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface SessionTimerProps {
  startedAt: string;
  className?: string;
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function SessionTimer({ startedAt, className }: SessionTimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = new Date(startedAt).getTime();
    const interval = setInterval(() => {
      setElapsed(Date.now() - start);
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt]);

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
        Elapsed
      </span>
      <span className="font-mono text-2xl font-bold tabular-nums text-foreground">
        {formatElapsed(elapsed)}
      </span>
    </div>
  );
}
