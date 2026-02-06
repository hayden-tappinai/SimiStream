import type { ScenarioEvent } from "@simistream/types";

/**
 * Returns the prompt to send to Odyssey's interact() call.
 *
 * The base scene is already set via startStream(), so interact() only needs
 * the latest event's visual change — a 2-3 word nudge, not the full scene.
 * When no events are active, returns the base prompt (used for startStream).
 */
export function synthesizePrompt(
  baseScenarioPrompt: string,
  activeEvents: ScenarioEvent[],
): string {
  if (activeEvents.length === 0) {
    return baseScenarioPrompt;
  }
  // DEMO MODE: short prompt for Odyssey reactivity
  return "red lights flashing";
}
