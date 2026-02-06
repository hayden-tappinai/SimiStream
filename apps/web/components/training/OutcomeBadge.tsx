import { cn } from "@/lib/utils";

type Outcome = "optimal" | "acceptable" | "suboptimal" | "critical_error";

const outcomeStyles: Record<Outcome, string> = {
  optimal: "border-outcome-optimal/40 bg-outcome-optimal/10 text-outcome-optimal",
  acceptable: "border-outcome-acceptable/40 bg-outcome-acceptable/10 text-outcome-acceptable",
  suboptimal: "border-outcome-suboptimal/40 bg-outcome-suboptimal/10 text-outcome-suboptimal",
  critical_error: "border-outcome-critical/40 bg-outcome-critical/10 text-outcome-critical",
};

const outcomeLabels: Record<Outcome, string> = {
  optimal: "OPTIMAL",
  acceptable: "ACCEPTABLE",
  suboptimal: "SUBOPTIMAL",
  critical_error: "CRITICAL ERROR",
};

interface OutcomeBadgeProps {
  outcome: Outcome;
  className?: string;
}

export function OutcomeBadge({ outcome, className }: OutcomeBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider",
        outcomeStyles[outcome],
        className
      )}
    >
      {outcomeLabels[outcome]}
    </span>
  );
}
