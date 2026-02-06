import { INDUSTRIES } from "@simistream/types/industries";
import { IndustryCard } from "@/components/training/IndustryCard";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="space-y-2 mb-10">
        <h1 className="text-3xl font-bold tracking-tight">
          Select Your Training Environment
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Choose an industry to begin a professional training simulation.
          Each scenario uses AI-powered visual environments with real-time
          events that test your decision-making under pressure.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {INDUSTRIES.map((industry) => (
          <IndustryCard
            key={industry.id}
            id={industry.id}
            name={industry.name}
            slug={industry.slug}
            description={industry.description}
            professionCount={industry.professions.length}
          />
        ))}
      </div>
    </div>
  );
}
