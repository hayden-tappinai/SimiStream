"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getProfessionById } from "@simistream/types/industries";
import { ResultsSummary } from "@/components/training/ResultsSummary";
import { EventTimeline } from "@/components/training/EventTimeline";
import { Button } from "@/components/ui/button";
import type {
  TrainingSession,
  ScenarioEvent,
  TraineeResponse,
  SessionScore,
} from "@simistream/types";

interface ResultsData {
  session: TrainingSession;
  events: ScenarioEvent[];
  responses: TraineeResponse[];
  score: SessionScore;
}

export default function SessionResultsPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [data, setData] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchResults() {
      try {
        const res = await fetch(`/api/training/${params.sessionId}/results`);
        if (!res.ok) throw new Error("Failed to load results");
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchResults();
    return () => {
      cancelled = true;
    };
  }, [params.sessionId]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-sm text-muted-foreground">
            LOADING RESULTS...
          </span>
        </div>
      </div>
    );
  }

  if (error || !data || !data.score) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <div className="border border-destructive/50 bg-destructive/10 p-8 max-w-md text-center">
          <h2 className="text-lg font-bold text-destructive">
            Unable to Load Results
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {error || "Results not found."}
          </p>
          <Button variant="outline" className="mt-4" onClick={() => router.push("/")}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const profession = getProfessionById(data.session.profession);
  const responseMap = new Map(data.responses.map((r) => [r.eventId, r]));

  const timelineEvents = data.events.map((event) => {
    const response = responseMap.get(event.id);
    return {
      id: event.id,
      sequenceNumber: event.sequenceNumber,
      eventType: event.eventType,
      severity: event.severity as "low" | "medium" | "high" | "critical",
      description: event.description,
      injectedAt:
        typeof event.injectedAt === "string"
          ? event.injectedAt
          : new Date(event.injectedAt).toISOString(),
      response: response
        ? {
            responseText: response.responseText,
            outcome: response.outcome as
              | "optimal"
              | "acceptable"
              | "suboptimal"
              | "critical_error",
            feedback: response.feedback,
            scoreImpact: response.scoreImpact,
            respondedAt:
              typeof response.respondedAt === "string"
                ? response.respondedAt
                : new Date(response.respondedAt).toISOString(),
          }
        : undefined,
    };
  });

  const sessionStartedAt =
    typeof data.session.startedAt === "string"
      ? data.session.startedAt
      : new Date(data.session.startedAt).toISOString();

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      {/* Header */}
      <div className="mb-8 text-center">
        <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
          Training Debrief
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          {profession?.name ?? data.session.profession} Session Complete
        </h1>
      </div>

      {/* Score summary */}
      <div className="border-2 border-border bg-surface-raised p-6 mb-8">
        <ResultsSummary
          overallScore={data.score.overallScore}
          reactionTimeAvg={data.score.reactionTimeAvg}
          criticalErrorCount={data.score.criticalErrorCount}
          optimalResponseRate={data.score.optimalResponseRate}
          totalEvents={data.events.length}
          totalResponses={data.responses.length}
        />
      </div>

      {/* Event timeline */}
      <div className="mb-8">
        <h2 className="mb-4 font-mono text-xs text-muted-foreground uppercase tracking-widest">
          Event Timeline
        </h2>
        <div className="border-2 border-border bg-surface-raised p-6">
          <EventTimeline
            events={timelineEvents}
            sessionStartedAt={sessionStartedAt}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-4">
        {profession && (
          <Button
            variant="default"
            onClick={() => {
              const industrySlug = profession.industry.replace(/_/g, "-");
              router.push(`/${industrySlug}`);
            }}
          >
            Train Again
          </Button>
        )}
        <Button variant="outline" onClick={() => router.push("/")}>
          Choose Different Industry
        </Button>
      </div>
    </div>
  );
}
