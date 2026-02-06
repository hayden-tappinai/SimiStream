// ─── Server-side Odyssey API helpers ────────────────────
// Interactive streaming (connect/startStream/interact/endStream) uses
// the @odysseyml/odyssey SDK client-side via WebRTC.
//
// This module provides server-safe wrappers for the Recordings API,
// which only needs an API key and standard HTTP requests.

import type {
  OdysseyConfig,
  Recording,
  ListStreamRecordingsOptions,
  StreamRecordingsListResponse,
} from "./types";
import { toOdysseyError } from "./errors";
import { withRetry } from "./retry";

const API_BASE = "https://api.odyssey.ml";

async function odysseyFetch<T>(
  config: OdysseyConfig,
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = await res.text().catch(() => "Unknown error");
    }
    throw toOdysseyError(res.status, body as string);
  }

  return res.json() as Promise<T>;
}

export async function getRecording(
  config: OdysseyConfig,
  streamId: string,
): Promise<Recording> {
  return withRetry(() =>
    odysseyFetch<Recording>(config, `/v1/recordings/${streamId}`, {
      method: "GET",
    }),
  );
}

export async function listStreamRecordings(
  config: OdysseyConfig,
  options: ListStreamRecordingsOptions = {},
): Promise<StreamRecordingsListResponse> {
  const params = new URLSearchParams();
  if (options.limit !== undefined) params.set("limit", String(options.limit));
  if (options.offset !== undefined) params.set("offset", String(options.offset));
  const qs = params.toString();
  const path = `/v1/recordings${qs ? `?${qs}` : ""}`;

  return withRetry(() =>
    odysseyFetch<StreamRecordingsListResponse>(config, path, {
      method: "GET",
    }),
  );
}
