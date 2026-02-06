"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface ProfessionCardProps {
  name: string;
  slug: string;
  description: string;
  industryId: string;
  onSelect: (slug: string) => void;
  loading?: boolean;
}

const industryAccentMap: Record<string, string> = {
  healthcare: "border-industry-healthcare/40 hover:border-industry-healthcare",
  emergency_services: "border-industry-emergency/40 hover:border-industry-emergency",
  food_hospitality: "border-industry-food/40 hover:border-industry-food",
  finance: "border-industry-finance/40 hover:border-industry-finance",
  entertainment: "border-industry-entertainment/40 hover:border-industry-entertainment",
  veterinary: "border-industry-veterinary/40 hover:border-industry-veterinary",
};

const industryBadgeMap: Record<string, string> = {
  healthcare: "border-industry-healthcare/30 text-industry-healthcare bg-industry-healthcare/10",
  emergency_services: "border-industry-emergency/30 text-industry-emergency bg-industry-emergency/10",
  food_hospitality: "border-industry-food/30 text-industry-food bg-industry-food/10",
  finance: "border-industry-finance/30 text-industry-finance bg-industry-finance/10",
  entertainment: "border-industry-entertainment/30 text-industry-entertainment bg-industry-entertainment/10",
  veterinary: "border-industry-veterinary/30 text-industry-veterinary bg-industry-veterinary/10",
};

export function ProfessionCard({
  name,
  slug,
  description,
  industryId,
  onSelect,
  loading,
}: ProfessionCardProps) {
  const accentClass = industryAccentMap[industryId] ?? "border-border hover:border-accent";
  const badgeClass = industryBadgeMap[industryId] ?? "";

  return (
    <button
      onClick={() => onSelect(slug)}
      disabled={loading}
      className={cn(
        "group relative flex flex-col gap-3 border-2 bg-surface-raised p-5 text-left transition-all duration-200",
        "hover:translate-x-[-1px] hover:translate-y-[-1px] hover:bg-surface-overlay",
        "disabled:pointer-events-none disabled:opacity-50",
        accentClass
      )}
    >
      <div className="flex items-start justify-between">
        <h3 className="text-base font-bold tracking-tight">{name}</h3>
        <Badge
          className={cn(
            "border text-[10px] uppercase tracking-wider",
            badgeClass
          )}
        >
          ~15 min
        </Badge>
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>

      <div className="mt-auto flex items-center gap-2 pt-1 font-mono text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
        {loading ? (
          <span>INITIALIZING...</span>
        ) : (
          <>
            <span>BEGIN TRAINING</span>
            <span className="text-foreground">&rarr;</span>
          </>
        )}
      </div>
    </button>
  );
}
