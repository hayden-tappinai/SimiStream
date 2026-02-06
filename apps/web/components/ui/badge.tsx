import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "live" | "outline" | "destructive";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center border-2 border-border px-2.5 py-0.5 text-xs font-bold transition-colors",
        variant === "default" && "bg-accent text-accent-foreground",
        variant === "live" && "border-live bg-live/10 text-live",
        variant === "outline" && "bg-transparent text-foreground",
        variant === "destructive" && "bg-destructive text-destructive-foreground",
        className
      )}
      {...props}
    />
  );
}

export { Badge };
