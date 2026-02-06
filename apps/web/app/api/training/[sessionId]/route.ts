import { NextRequest } from "next/server";
import { prisma } from "@simistream/db";
import { getSupabaseUser } from "../../_lib/auth";
import { successResponse, errorResponse } from "../../_lib/responses";

export async function GET(
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
    include: {
      events: {
        where: { resolved: false },
        orderBy: { sequenceNumber: "asc" },
      },
      responses: {
        orderBy: { respondedAt: "desc" },
        take: 10,
      },
    },
  });

  if (!session) {
    return errorResponse("Session not found", 404);
  }

  if (session.userId !== user.id) {
    return errorResponse("Forbidden", 403);
  }

  // Calculate current score from all responses
  const scoreAgg = await prisma.traineeResponse.aggregate({
    where: { sessionId },
    _sum: { scoreImpact: true },
  });

  const currentScore = scoreAgg._sum.scoreImpact ?? 0;

  return successResponse({
    session,
    activeEvents: session.events,
    recentResponses: session.responses,
    currentScore,
  });
}
