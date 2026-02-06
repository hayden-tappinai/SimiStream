import { NextRequest } from "next/server";
import { prisma } from "@simistream/db";
import { getProfessionById } from "@simistream/types/industries";
import { getSupabaseUser } from "../../_lib/auth";
import { publishEvent } from "../../_lib/redis";
import { successResponse, errorResponse, validationErrorResponse } from "../../_lib/responses";
import { StartTrainingSchema } from "../../_lib/validation";

export async function POST(request: NextRequest) {
  const user = await getSupabaseUser(request);
  if (!user) {
    return errorResponse("Unauthorized", 401);
  }

  const body = await request.json();
  const parsed = StartTrainingSchema.safeParse(body);
  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  const { profession } = parsed.data;

  // Validate profession exists in our industry data
  const professionConfig = getProfessionById(profession);
  if (!professionConfig) {
    return errorResponse("Unknown profession", 400);
  }

  // Ensure user exists in our DB
  const dbUser = await prisma.user.upsert({
    where: { id: user.id },
    update: {},
    create: {
      id: user.id,
      email: user.email ?? "",
      name: user.user_metadata?.name ?? user.email ?? "Trainee",
    },
  });

  const session = await prisma.trainingSession.create({
    data: {
      userId: dbUser.id,
      profession,
      status: "active",
    },
  });

  // Notify via Redis that session status changed
  await publishEvent(`session:status:${session.id}`, {
    type: "session:status",
    data: { sessionId: session.id, status: "active" },
  });

  return successResponse({ session }, 201);
}
