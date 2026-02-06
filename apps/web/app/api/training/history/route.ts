import { NextRequest } from "next/server";
import { prisma } from "@simistream/db";
import { getSupabaseUser } from "../../_lib/auth";
import { successResponse, errorResponse } from "../../_lib/responses";

export async function GET(request: NextRequest) {
  const user = await getSupabaseUser(request);
  if (!user) {
    return errorResponse("Unauthorized", 401);
  }

  const sessions = await prisma.trainingSession.findMany({
    where: { userId: user.id },
    orderBy: { startedAt: "desc" },
    include: {
      score: true,
      _count: {
        select: {
          events: true,
          responses: true,
        },
      },
    },
  });

  return successResponse({ sessions });
}
