import Anthropic from "@anthropic-ai/sdk";
import { getEnv } from "@simistream/config";
import type {
  ProfessionConfig,
  ScenarioEvent,
  EventType,
  EventSeverity,
  EventTemplate,
} from "@simistream/types";

interface GeneratedEvent {
  description: string;
  eventType: EventType;
  severity: EventSeverity;
  odysseyPrompt: string;
  responseDeadlineMs: number;
}

function pickTemplate(
  templates: EventTemplate[],
  recentTypes: EventType[],
): EventTemplate {
  // Weight templates inversely by how recently their type was used
  const recentCounts = new Map<EventType, number>();
  for (const t of recentTypes.slice(-6)) {
    recentCounts.set(t, (recentCounts.get(t) ?? 0) + 1);
  }

  const weighted = templates.map((tmpl) => ({
    template: tmpl,
    weight: 1 / (1 + (recentCounts.get(tmpl.eventType) ?? 0)),
  }));

  const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const w of weighted) {
    roll -= w.weight;
    if (roll <= 0) return w.template;
  }
  return templates[Math.floor(Math.random() * templates.length)];
}

const SEVERITY_ORDER: EventSeverity[] = ["low", "medium", "high", "critical"];

function pickSeverity(
  min: EventSeverity,
  max: EventSeverity,
  weights: { low: number; medium: number; high: number; critical: number },
): EventSeverity {
  const minIdx = SEVERITY_ORDER.indexOf(min);
  const maxIdx = SEVERITY_ORDER.indexOf(max);
  const candidates = SEVERITY_ORDER.slice(minIdx, maxIdx + 1);

  const weighted = candidates.map((s) => ({ severity: s, weight: weights[s] }));
  const total = weighted.reduce((sum, w) => sum + w.weight, 0);
  if (total === 0) return candidates[0];

  let roll = Math.random() * total;
  for (const w of weighted) {
    roll -= w.weight;
    if (roll <= 0) return w.severity;
  }
  return candidates[0];
}

function deadlineForSeverity(severity: EventSeverity): number {
  switch (severity) {
    case "critical":
      return 30_000;
    case "high":
      return 60_000;
    case "medium":
      return 120_000;
    case "low":
      return 180_000;
  }
}

export async function generateEvent(
  profession: ProfessionConfig,
  activeEvents: ScenarioEvent[],
  difficulty: number,
  sessionHistory: ScenarioEvent[],
  severityWeights: { low: number; medium: number; high: number; critical: number },
): Promise<GeneratedEvent> {
  const recentTypes = sessionHistory.slice(-10).map((e) => e.eventType);
  const template = pickTemplate(profession.eventTemplates, recentTypes);
  const severity = pickSeverity(template.severityMin, template.severityMax, severityWeights);

  const env = getEnv();
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  const activeDesc =
    activeEvents.length > 0
      ? activeEvents.map((e) => `- [${e.severity}] ${e.description}`).join("\n")
      : "None currently active.";

  const recentDesc =
    sessionHistory.length > 0
      ? sessionHistory
          .slice(-5)
          .map((e) => `- ${e.description} (${e.resolved ? "resolved" : "active"})`)
          .join("\n")
      : "No prior events.";

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1024,
    system: `You are a training scenario designer for ${profession.name} professionals.
Generate realistic, challenging events that test the trainee's skills.
The training difficulty is ${difficulty}/10 and the event severity is ${severity}.
CRITICAL: The "description" MUST be 3-5 words maximum. It is a short alert shown on a HUD. Examples: "Patient oxygen dropping", "Ventilator error code", "New ER admission", "Cardiac arrest bed 3".
The odysseyPrompt MUST be exactly 2-3 words. It is a tiny visual nudge for a world model. Examples: 'red vital signs', 'fire on stove', 'smoke filling room', 'flatline monitor'. NOT a sentence or description.
Always respond with valid JSON and nothing else.`,
    messages: [
      {
        role: "user",
        content: `Generate a specific scenario event based on this template:
Template: "${template.descriptionTemplate}"
Event type: ${template.eventType}
Severity: ${severity}
Odyssey visual template: "${template.odysseyPromptTemplate}"

Context:
- Profession: ${profession.name}
- Base environment: ${profession.baseScenarioPrompt}
- Active events:
${activeDesc}
- Recent history:
${recentDesc}

Respond with JSON:
{
  "description": "3-5 word alert (e.g. 'Patient oxygen dropping', 'Grease fire station 2')",
  "odysseyPrompt": "2-3 word visual nudge (e.g. 'red vital signs', 'smoke filling room')"
}`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    return {
      description: template.descriptionTemplate,
      eventType: template.eventType,
      severity,
      odysseyPrompt: template.odysseyPromptTemplate,
      responseDeadlineMs: deadlineForSeverity(severity),
    };
  }

  try {
    const parsed = JSON.parse(content.text) as {
      description: string;
      odysseyPrompt: string;
    };
    return {
      description: parsed.description,
      eventType: template.eventType,
      severity,
      odysseyPrompt: parsed.odysseyPrompt,
      responseDeadlineMs: deadlineForSeverity(severity),
    };
  } catch {
    return {
      description: template.descriptionTemplate,
      eventType: template.eventType,
      severity,
      odysseyPrompt: template.odysseyPromptTemplate,
      responseDeadlineMs: deadlineForSeverity(severity),
    };
  }
}
