// ─── Server-side Simulations API ────────────────────────
// Simulations are asynchronous batch jobs that run scripted
// interactions. They can be managed from the server side.

import type {
  OdysseyConfig,
  SimulateOptions,
  SimulationJob,
  SimulationJobDetail,
  ListSimulationsOptions,
  SimulationJobsList,
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

export async function simulate(
  config: OdysseyConfig,
  options: SimulateOptions,
): Promise<SimulationJob> {
  return withRetry(() =>
    odysseyFetch<SimulationJob>(config, "/v1/simulate", {
      method: "POST",
      body: JSON.stringify(options),
    }),
  );
}

export async function getSimulateStatus(
  config: OdysseyConfig,
  simulationId: string,
): Promise<SimulationJobDetail> {
  return withRetry(() =>
    odysseyFetch<SimulationJobDetail>(config, `/v1/simulate/${simulationId}`, {
      method: "GET",
    }),
  );
}

export async function listSimulations(
  config: OdysseyConfig,
  options: ListSimulationsOptions = {},
): Promise<SimulationJobsList> {
  const params = new URLSearchParams();
  if (options.limit !== undefined) params.set("limit", String(options.limit));
  if (options.offset !== undefined) params.set("offset", String(options.offset));
  const qs = params.toString();
  const path = `/v1/simulate${qs ? `?${qs}` : ""}`;

  return withRetry(() =>
    odysseyFetch<SimulationJobsList>(config, path, {
      method: "GET",
    }),
  );
}

export async function cancelSimulation(
  config: OdysseyConfig,
  simulationId: string,
): Promise<void> {
  await withRetry(() =>
    odysseyFetch<void>(config, `/v1/simulate/${simulationId}/cancel`, {
      method: "POST",
    }),
  );
}
