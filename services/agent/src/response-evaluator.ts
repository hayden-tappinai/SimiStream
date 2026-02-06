import Anthropic from "@anthropic-ai/sdk";
import { getEnv } from "@simistream/config";
import type {
  ProfessionConfig,
  ScenarioEvent,
  TraineeResponse,
  ResponseOutcome,
} from "@simistream/types";

interface EvaluationResult {
  outcome: ResponseOutcome;
  scoreImpact: number;
  feedback: string;
}

interface SessionContext {
  activeEvents: ScenarioEvent[];
  score: number;
  history: TraineeResponse[];
}

export async function evaluateResponse(
  profession: ProfessionConfig,
  event: ScenarioEvent,
  responseText: string,
  context: SessionContext,
): Promise<EvaluationResult> {
  const env = getEnv();
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  const recentHistory =
    context.history.length > 0
      ? context.history
          .slice(-5)
          .map((r) => `- Response: "${r.responseText}" -> ${r.outcome} (${r.scoreImpact > 0 ? "+" : ""}${r.scoreImpact})`)
          .join("\n")
      : "No prior responses.";

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 512,
    system: `You are an expert ${profession.name} evaluator for a training simulation.
Given a scenario event and the trainee's response, evaluate whether the response was appropriate, timely, and followed proper protocol.
Always respond with valid JSON and nothing else.`,
    messages: [
      {
        role: "user",
        content: `Evaluate this trainee response:

Event: ${event.description}
Event type: ${event.eventType}
Severity: ${event.severity}
Trainee's response: "${responseText}"

Context:
- Profession: ${profession.name}
- Current score: ${context.score}
- Other active events: ${context.activeEvents.filter((e) => e.id !== event.id).map((e) => e.description).join("; ") || "None"}
- Recent performance:
${recentHistory}

Respond with JSON:
{
  "outcome": "optimal" | "acceptable" | "suboptimal" | "critical_error",
  "scoreImpact": <number between -20 and +15>,
  "feedback": "brief constructive feedback for the trainee"
}

Scoring guide:
- optimal: +10 to +15 (excellent, textbook response)
- acceptable: +2 to +8 (correct but could be improved)
- suboptimal: -5 to -2 (wrong approach or delayed)
- critical_error: -20 to -10 (dangerous or grossly incorrect)`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    return { outcome: "acceptable", scoreImpact: 3, feedback: "Response received." };
  }

  try {
    const parsed = JSON.parse(content.text) as EvaluationResult;
    // Validate outcome is a known value
    const validOutcomes: ResponseOutcome[] = ["optimal", "acceptable", "suboptimal", "critical_error"];
    if (!validOutcomes.includes(parsed.outcome)) {
      parsed.outcome = "acceptable";
    }
    // Clamp score impact
    parsed.scoreImpact = Math.max(-20, Math.min(15, parsed.scoreImpact));
    return parsed;
  } catch {
    return { outcome: "acceptable", scoreImpact: 3, feedback: "Response received." };
  }
}
