import { NextRequest } from "next/server";
import { prisma } from "@simistream/db";
import { getSupabaseUser } from "../../../_lib/auth";
import { publishEvent } from "../../../_lib/redis";
import { successResponse, errorResponse } from "../../../_lib/responses";

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } },
) {
  const user = await getSupabaseUser(request);
  if (!user) {
    return errorResponse("Unauthorized", 401);
  }

  const { sessionId } = params;

  const session = await prisma.trainingSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    return errorResponse("Session not found", 404);
  }
  if (session.userId !== user.id) {
    return errorResponse("Forbidden", 403);
  }
  if (session.status === "completed") {
    return errorResponse("Session is already completed", 400);
  }

  // Gather all responses for scoring
  const responses = await prisma.traineeResponse.findMany({
    where: { sessionId },
  });

  const totalEvents = await prisma.scenarioEvent.count({
    where: { sessionId },
  });

  // Calculate aggregate stats
  const totalScore = responses.reduce((sum, r) => sum + r.scoreImpact, 0);
  const criticalErrors = responses.filter(
    (r) => r.outcome === "critical_error",
  ).length;
  const optimalCount = responses.filter(
    (r) => r.outcome === "optimal",
  ).length;
  const optimalRate =
    responses.length > 0 ? optimalCount / responses.length : 0;

  // Calculate average reaction time (time between event injection and response)
  // For now, use a placeholder since we'd need to join with events
  const eventsWithResponses = await prisma.scenarioEvent.findMany({
    where: { sessionId, resolved: true },
    include: { responses: { take: 1, orderBy: { respondedAt: "asc" } } },
  });

  let reactionTimeAvg = 0;
  if (eventsWithResponses.length > 0) {
    const reactionTimes = eventsWithResponses
      .filter((e) => e.responses.length > 0)
      .map((e) => {
        const responseTime = e.responses[0].respondedAt.getTime();
        const eventTime = e.injectedAt.getTime();
        return (responseTime - eventTime) / 1000; // seconds
      });
    reactionTimeAvg =
      reactionTimes.length > 0
        ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length
        : 0;
  }

  // Build score breakdown by event type
  const breakdown: Record<string, number> = {};
  for (const event of eventsWithResponses) {
    if (event.responses.length > 0) {
      const resp = event.responses[0];
      breakdown[event.eventType] =
        (breakdown[event.eventType] ?? 0) + resp.scoreImpact;
    }
  }

  // Normalize overall score to 0-100 scale
  const maxPossible = totalEvents * 20;
  const overallScore =
    maxPossible > 0
      ? Math.max(0, Math.min(100, ((totalScore + maxPossible) / (2 * maxPossible)) * 100))
      : 50;

  // Create session score and complete session in a transaction
  const [updatedSession, sessionScore] = await prisma.$transaction([
    prisma.trainingSession.update({
      where: { id: sessionId },
      data: {
        status: "completed",
        endedAt: new Date(),
        finalScore: overallScore,
      },
    }),
    prisma.sessionScore.create({
      data: {
        sessionId,
        overallScore,
        reactionTimeAvg,
        criticalErrorCount: criticalErrors,
        optimalResponseRate: optimalRate,
        breakdown,
      },
    }),
  ]);

  // Notify via Redis
  await publishEvent(`session:status:${sessionId}`, {
    type: "session:status",
    data: { sessionId, status: "completed" },
  });

  await publishEvent(`training:ended:${sessionId}`, {
    type: "session:status",
    data: { sessionId, status: "completed" },
  });

  return successResponse({
    session: updatedSession,
    score: sessionScore,
  });
}
