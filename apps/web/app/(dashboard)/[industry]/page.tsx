"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { getIndustryBySlug } from "@simistream/types/industries";
import type { Profession } from "@simistream/types";
import { ProfessionCard } from "@/components/training/ProfessionCard";
import { Button } from "@/components/ui/button";

export default function ProfessionSelectionPage() {
  const params = useParams<{ industry: string }>();
  const router = useRouter();
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const industry = getIndustryBySlug(params.industry);

  if (!industry) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-bold">Industry not found</h1>
        <p className="mt-2 text-muted-foreground">
          The industry &quot;{params.industry}&quot; does not exist.
        </p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/")}>
          Back to Industries
        </Button>
      </div>
    );
  }

  async function handleSelectProfession(professionSlug: string) {
    setLoadingSlug(professionSlug);
    setError(null);

    try {
      const profession = industry!.professions.find(
        (p) => p.slug === professionSlug
      );
      if (!profession) throw new Error("Profession not found");

      const res = await fetch("/api/training/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profession: profession.id as Profession }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to start training session");
      }

      const { session } = await res.json();
      router.push(`/training/${session.id}`);
    } catch (err) {
      setError((err as Error).message);
      setLoadingSlug(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8">
        <button
          onClick={() => router.push("/")}
          className="mb-4 flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; <span>All Industries</span>
        </button>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{industry.name}</h1>
          <p className="text-muted-foreground max-w-2xl">
            {industry.description}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {industry.professions.map((profession) => (
          <ProfessionCard
            key={profession.id}
            name={profession.name}
            slug={profession.slug}
            description={profession.description}
            industryId={industry.id}
            onSelect={handleSelectProfession}
            loading={loadingSlug === profession.slug}
          />
        ))}
      </div>
    </div>
  );
}
