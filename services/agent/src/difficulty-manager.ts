import type { ResponseOutcome } from "@simistream/types";

const MIN_DIFFICULTY = 1;
const MAX_DIFFICULTY = 10;

// Event interval in ms: higher difficulty = shorter intervals
const INTERVAL_AT_MIN = 20_000; // 20s at difficulty 1
const INTERVAL_AT_MAX = 8_000;  // 8s at difficulty 10

// Max concurrent events: scales from 1 to 4
const CONCURRENT_AT_MIN = 1;
const CONCURRENT_AT_MAX = 4;

// How much each outcome type moves the difficulty
const DIFFICULTY_DELTAS: Record<ResponseOutcome, number> = {
  optimal: 0.4,
  acceptable: 0.1,
  suboptimal: -0.1,
  critical_error: -0.3,
};

export class DifficultyManager {
  private difficulty: number;
  private responseHistory: ResponseOutcome[] = [];

  constructor(initialDifficulty: number = 1) {
    this.difficulty = Math.max(
      MIN_DIFFICULTY,
      Math.min(MAX_DIFFICULTY, initialDifficulty),
    );
  }

  adjustAfterResponse(outcome: ResponseOutcome): void {
    this.responseHistory.push(outcome);
    const delta = DIFFICULTY_DELTAS[outcome] ?? 0;
    this.difficulty = Math.max(
      MIN_DIFFICULTY,
      Math.min(MAX_DIFFICULTY, this.difficulty + delta),
    );
  }

  getCurrentDifficulty(): number {
    return Math.round(this.difficulty * 10) / 10;
  }

  /** Returns a random interval in ms between events, scaled by difficulty. */
  getEventInterval(): number {
    const t = (this.difficulty - MIN_DIFFICULTY) / (MAX_DIFFICULTY - MIN_DIFFICULTY);
    const base = INTERVAL_AT_MIN + t * (INTERVAL_AT_MAX - INTERVAL_AT_MIN);
    // Add +/- 25% jitter so events feel unpredictable
    const jitter = base * (0.75 + Math.random() * 0.5);
    return Math.round(jitter);
  }

  /** Returns how many events can be active simultaneously at the current difficulty. */
  getMaxConcurrentEvents(): number {
    const t = (this.difficulty - MIN_DIFFICULTY) / (MAX_DIFFICULTY - MIN_DIFFICULTY);
    return Math.round(CONCURRENT_AT_MIN + t * (CONCURRENT_AT_MAX - CONCURRENT_AT_MIN));
  }

  /** Returns severity weights [low, medium, high, critical] for the current difficulty. */
  getSeverityWeights(): { low: number; medium: number; high: number; critical: number } {
    const d = this.difficulty;
    return {
      low: Math.max(0, 10 - d),
      medium: 6,
      high: Math.max(0, d - 2),
      critical: Math.max(0, d - 5),
    };
  }

  getResponseHistory(): ResponseOutcome[] {
    return [...this.responseHistory];
  }
}
