import { NextRequest } from "next/server";
import { prisma } from "@simistream/db";
import { getSupabaseUser } from "../../../_lib/auth";
import { successResponse, errorResponse } from "../../../_lib/responses";

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
        orderBy: { sequenceNumber: "asc" },
      },
      responses: {
        orderBy: { respondedAt: "asc" },
      },
      score: true,
    },
  });

  if (!session) {
    return errorResponse("Session not found", 404);
  }
  if (session.userId !== user.id) {
    return errorResponse("Forbidden", 403);
  }

  return successResponse({
    session: {
      id: session.id,
      userId: session.userId,
      profession: session.profession,
      status: session.status,
      odysseyStreamId: session.odysseyStreamId,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      finalScore: session.finalScore,
    },
    events: session.events,
    responses: session.responses,
    score: session.score,
  });
}
