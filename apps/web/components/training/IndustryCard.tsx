"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const industryColorMap: Record<string, string> = {
  healthcare: "border-industry-healthcare/50 hover:border-industry-healthcare",
  emergency_services: "border-industry-emergency/50 hover:border-industry-emergency",
  food_hospitality: "border-industry-food/50 hover:border-industry-food",
  finance: "border-industry-finance/50 hover:border-industry-finance",
  entertainment: "border-industry-entertainment/50 hover:border-industry-entertainment",
  veterinary: "border-industry-veterinary/50 hover:border-industry-veterinary",
};

const industryGlowMap: Record<string, string> = {
  healthcare: "hover:shadow-[0_0_30px_hsl(175_70%_45%/0.15)]",
  emergency_services: "hover:shadow-[0_0_30px_hsl(15_85%_55%/0.15)]",
  food_hospitality: "hover:shadow-[0_0_30px_hsl(38_90%_55%/0.15)]",
  finance: "hover:shadow-[0_0_30px_hsl(145_60%_45%/0.15)]",
  entertainment: "hover:shadow-[0_0_30px_hsl(270_60%_55%/0.15)]",
  veterinary: "hover:shadow-[0_0_30px_hsl(200_65%_50%/0.15)]",
};

const industryIconBgMap: Record<string, string> = {
  healthcare: "bg-industry-healthcare/10 text-industry-healthcare",
  emergency_services: "bg-industry-emergency/10 text-industry-emergency",
  food_hospitality: "bg-industry-food/10 text-industry-food",
  finance: "bg-industry-finance/10 text-industry-finance",
  entertainment: "bg-industry-entertainment/10 text-industry-entertainment",
  veterinary: "bg-industry-veterinary/10 text-industry-veterinary",
};

const industryIcons: Record<string, string> = {
  healthcare: "H+",
  emergency_services: "911",
  food_hospitality: "F&B",
  finance: "$$$",
  entertainment: "ENT",
  veterinary: "VET",
};

interface IndustryCardProps {
  id: string;
  name: string;
  slug: string;
  description: string;
  professionCount: number;
}

export function IndustryCard({
  id,
  name,
  slug,
  description,
  professionCount,
}: IndustryCardProps) {
  const colorClass = industryColorMap[id] ?? "border-border hover:border-accent";
  const glowClass = industryGlowMap[id] ?? "";
  const iconBg = industryIconBgMap[id] ?? "bg-accent/10 text-accent";
  const icon = industryIcons[id] ?? "SIM";

  return (
    <Link href={`/${slug}`}>
      <div
        className={cn(
          "group relative flex flex-col gap-4 border-2 bg-surface-raised p-6 transition-all duration-200",
          "hover:translate-x-[-2px] hover:translate-y-[-2px] hover:bg-surface-overlay",
          colorClass,
          glowClass
        )}
      >
        <div className="flex items-start justify-between">
          <div
            className={cn(
              "flex h-14 w-14 items-center justify-center border border-current/20 font-mono text-sm font-bold",
              iconBg
            )}
          >
            {icon}
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            {professionCount} {professionCount === 1 ? "role" : "roles"}
          </span>
        </div>

        <div className="space-y-1.5">
          <h3 className="text-lg font-bold tracking-tight">{name}</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="mt-auto flex items-center gap-2 pt-2 font-mono text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
          <span>SELECT INDUSTRY</span>
          <span className="text-foreground">&rarr;</span>
        </div>
      </div>
    </Link>
  );
}
