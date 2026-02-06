"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface ResponseInputProps {
  activeEventId: string | null;
  onSubmit: (eventId: string, responseText: string) => void | Promise<void>;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

export function ResponseInput({
  activeEventId,
  onSubmit,
  loading,
  error,
  className,
}: ResponseInputProps) {
  const [text, setText] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeEventId || !text.trim() || loading) return;
    onSubmit(activeEventId, text.trim());
    setText("");
  }

  const disabled = !activeEventId;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
          Response
        </span>
        {activeEventId && (
          <span className="font-mono text-[10px] text-accent">
            EVENT SELECTED
          </span>
        )}
      </div>

      {error && (
        <p className="font-mono text-xs text-destructive">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled}
          placeholder={
            disabled
              ? "Select an event to respond..."
              : "Describe your action or response..."
          }
          className={cn(
            "flex-1 border border-border bg-surface px-3 py-2 font-mono text-sm outline-none transition-colors",
            "placeholder:text-muted-foreground/50",
            "focus:border-accent/50",
            disabled && "opacity-40"
          )}
        />
        <button
          type="submit"
          disabled={disabled || loading || !text.trim()}
          className={cn(
            "border border-accent bg-accent/10 px-4 py-2 font-mono text-xs font-bold uppercase text-accent transition-colors",
            "hover:bg-accent/20",
            "disabled:opacity-30 disabled:pointer-events-none"
          )}
        >
          {loading ? "..." : "Submit"}
        </button>
      </form>
    </div>
  );
}
