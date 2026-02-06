import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@simistream/db";
import { getEnv } from "@simistream/config";
import type { ResponseOutcome } from "@simistream/types";
import { getProfessionById } from "@simistream/types/industries";
import { getSupabaseUser } from "../../../_lib/auth";
import { publishEvent } from "../../../_lib/redis";
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
} from "../../../_lib/responses";
import { SubmitResponseSchema } from "../../../_lib/validation";

const EVALUATION_SYSTEM_PROMPT = `You are an expert evaluator for professional training simulations. You evaluate a trainee's response to a scenario event during a live training session.

You will be given:
- The trainee's profession
- A scenario event (type, severity, description)
- The trainee's response

Rate the response and return ONLY a JSON object with these fields:
- "outcome": one of "optimal", "acceptable", "suboptimal", "critical_error"
- "scoreImpact": integer from -20 to +20
- "feedback": brief text (1-3 sentences) explaining the rating
- "responseAction": brief summary of what action the trainee took (1 sentence)

Scoring guidelines:
- optimal: +10 to +20 points. Textbook response, demonstrates excellent judgment.
- acceptable: +1 to +9 points. Reasonable response, minor improvements possible.
- suboptimal: -1 to -10 points. Response has notable gaps or delays.
- critical_error: -11 to -20 points. Response could lead to serious harm or failure.

Be fair but rigorous. Consider the severity of the event when scoring.`;

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } },
) {
  const user = await getSupabaseUser(request);
  if (!user) {
    return errorResponse("Unauthorized", 401);
  }

  const { sessionId } = params;
  const body = await request.json();
  const parsed = SubmitResponseSchema.safeParse(body);
  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  const { eventId, responseText } = parsed.data;

  // Verify session ownership
  const session = await prisma.trainingSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    return errorResponse("Session not found", 404);
  }
  if (session.userId !== user.id) {
    return errorResponse("Forbidden", 403);
  }
  if (session.status !== "active") {
    return errorResponse("Session is not active", 400);
  }

  // Verify event belongs to session and is unresolved
  const event = await prisma.scenarioEvent.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    return errorResponse("Event not found", 404);
  }
  if (event.sessionId !== sessionId) {
    return errorResponse("Event does not belong to this session", 400);
  }
  if (event.resolved) {
    return errorResponse("Event is already resolved", 400);
  }

  // Call Claude to evaluate the response
  const env = getEnv();
  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  const professionConfig = getProfessionById(session.profession);
  const professionContext = professionConfig
    ? `${professionConfig.name} — ${professionConfig.description}`
    : session.profession;

  const evaluationPrompt = `Profession: ${professionContext}

Scenario Event:
- Type: ${event.eventType}
- Severity: ${event.severity}
- Description: ${event.description}

Trainee's Response:
${responseText}`;

  const completion = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 500,
    system: EVALUATION_SYSTEM_PROMPT,
    messages: [{ role: "user", content: evaluationPrompt }],
  });

  // Parse Claude's evaluation
  const responseContent = completion.content[0];
  if (responseContent.type !== "text") {
    return errorResponse("Failed to evaluate response", 500);
  }

  let evaluation: {
    outcome: ResponseOutcome;
    scoreImpact: number;
    feedback: string;
    responseAction: string;
  };

  try {
    // Strip markdown code fences if Claude wraps the JSON in ```json ... ```
    let jsonText = responseContent.text.trim();
    const fenceMatch = jsonText.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/);
    if (fenceMatch) {
      jsonText = fenceMatch[1].trim();
    }
    evaluation = JSON.parse(jsonText);
  } catch {
    return errorResponse("Failed to parse evaluation", 500);
  }

  // Validate that outcome is a recognized value
  const validOutcomes: string[] = ["optimal", "acceptable", "suboptimal", "critical_error"];
  if (!validOutcomes.includes(evaluation.outcome)) {
    evaluation.outcome = "suboptimal" as ResponseOutcome;
  }

  // Clamp score impact to valid range
  const scoreImpact = Math.max(-20, Math.min(20, evaluation.scoreImpact));

  // Create the trainee response record and mark event as resolved in a transaction
  const [traineeResponse] = await prisma.$transaction([
    prisma.traineeResponse.create({
      data: {
        eventId,
        sessionId,
        responseText,
        responseAction: evaluation.responseAction,
        outcome: evaluation.outcome,
        scoreImpact,
        feedback: evaluation.feedback,
      },
    }),
    prisma.scenarioEvent.update({
      where: { id: eventId },
      data: { resolved: true },
    }),
  ]);

  // Calculate updated score
  const scoreAgg = await prisma.traineeResponse.aggregate({
    where: { sessionId },
    _sum: { scoreImpact: true },
  });
  const currentScore = scoreAgg._sum.scoreImpact ?? 0;

  // Publish score update via Redis (non-blocking — don't fail the response if Redis is down)
  try {
    await publishEvent(`score:update:${sessionId}`, {
      type: "score:update",
      data: { sessionId, currentScore },
    });

    await publishEvent(`scenario:update:${sessionId}`, {
      type: "scenario:update",
      data: { eventId, resolved: true },
    });
  } catch {
    // Redis publish failure is non-critical; the DB write succeeded
    console.error("Failed to publish Redis events for session", sessionId);
  }

  return successResponse({
    response: traineeResponse,
    currentScore,
  });
}
