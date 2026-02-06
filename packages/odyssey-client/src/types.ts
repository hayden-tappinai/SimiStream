// ─── Odyssey SDK Types ──────────────────────────────────
// Based on the official @odysseyml/odyssey SDK
// https://documentation.api.odyssey.ml/sdk/javascript/types

export interface OdysseyConfig {
  apiKey: string;
}

// ─── Connection ────────────────────────────────────────

export type ConnectionStatus =
  | "authenticating"
  | "connecting"
  | "reconnecting"
  | "connected"
  | "disconnected"
  | "failed";

// ─── Interactive Streams ────────────────────────────────

export interface StartStreamOptions {
  prompt?: string;
  portrait?: boolean;
  image?: unknown;
}

export interface InteractOptions {
  prompt: string;
}

// ─── Recordings ─────────────────────────────────────────

export interface Recording {
  stream_id: string;
  video_url: string | null;
  events_url: string | null;
  thumbnail_url: string | null;
  preview_url: string | null;
  frame_count: number | null;
  duration_seconds: number | null;
}

export interface StreamRecordingSummary {
  stream_id: string;
  width: number;
  height: number;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
}

export interface ListStreamRecordingsOptions {
  limit?: number;
  offset?: number;
}

export interface StreamRecordingsListResponse {
  recordings: StreamRecordingSummary[];
  total: number;
  limit: number;
  offset: number;
}

// ─── Simulations ────────────────────────────────────────

export type SimulationJobStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export interface ScriptEntry {
  timestamp_ms: number;
  start?: { prompt: string; image?: unknown };
  interact?: { prompt: string };
  end?: Record<string, never>;
}

export interface SimulateOptions {
  script: ScriptEntry[];
  portrait?: boolean;
}

export interface SimulationStream {
  stream_id: string;
  status: "pending" | "running" | "completed" | "failed";
  error_message: string | null;
}

export interface SimulationJob {
  job_id: string;
  status: SimulationJobStatus;
  priority: string;
  created_at: string;
  estimated_wait_minutes: number | null;
}

export interface SimulationJobDetail {
  job_id: string;
  status: SimulationJobStatus;
  priority: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  streams: SimulationStream[];
}

export interface SimulationJobInfo {
  job_id: string;
  status: SimulationJobStatus;
  priority: string;
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
}

export interface ListSimulationsOptions {
  limit?: number;
  offset?: number;
}

export interface SimulationJobsList {
  jobs: SimulationJobInfo[];
  total: number;
  limit: number;
  offset: number;
}

// ─── Event Handlers ─────────────────────────────────────
// Note: Client-side event handlers (using MediaStream etc.) are
// provided by the @odysseyml/odyssey SDK directly. This server-side
// package only re-exports types that don't require DOM globals.

export interface OdysseyEventHandlers {
  onConnected?: (mediaStream: unknown) => void;
  onDisconnected?: () => void;
  onStreamStarted?: (streamId: string) => void;
  onStreamEnded?: () => void;
  onInteractAcknowledged?: (prompt: string) => void;
  onStreamError?: (reason: string, message: string) => void;
  onError?: (error: Error, fatal: boolean) => void;
  onStatusChange?: (status: ConnectionStatus, message?: string) => void;
}

// ─── Errors ─────────────────────────────────────────────

export interface OdysseyApiErrorBody {
  error: string;
  code: string;
  message: string;
  statusCode: number;
}
