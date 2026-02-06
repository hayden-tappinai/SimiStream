// ─── Server-side Odyssey Client ─────────────────────────
// Wraps the server-safe Odyssey APIs: recordings and simulations.
//
// Interactive streaming (connect/startStream/interact/endStream)
// is handled client-side using the official @odysseyml/odyssey SDK
// which establishes WebRTC connections directly from the browser.

import { getEnv } from "@simistream/config";
import type {
  OdysseyConfig,
  Recording,
  ListStreamRecordingsOptions,
  StreamRecordingsListResponse,
  SimulateOptions,
  SimulationJob,
  SimulationJobDetail,
  ListSimulationsOptions,
  SimulationJobsList,
} from "./types";
import { getRecording, listStreamRecordings } from "./streams";
import {
  simulate,
  getSimulateStatus,
  listSimulations,
  cancelSimulation,
} from "./simulations";

export class OdysseyClient {
  private readonly config: OdysseyConfig;

  constructor(config?: OdysseyConfig) {
    if (config) {
      this.config = config;
    } else {
      const env = getEnv();
      this.config = {
        apiKey: env.ODYSSEY_API_KEY,
      };
    }
  }

  /** Get the API key for passing to client-side SDK initialization */
  getApiKey(): string {
    return this.config.apiKey;
  }

  // ─── Recordings ─────────────────────────────────────

  async getRecording(streamId: string): Promise<Recording> {
    return getRecording(this.config, streamId);
  }

  async listStreamRecordings(
    options?: ListStreamRecordingsOptions,
  ): Promise<StreamRecordingsListResponse> {
    return listStreamRecordings(this.config, options);
  }

  // ─── Simulations ────────────────────────────────────

  async simulate(options: SimulateOptions): Promise<SimulationJob> {
    return simulate(this.config, options);
  }

  async getSimulateStatus(simulationId: string): Promise<SimulationJobDetail> {
    return getSimulateStatus(this.config, simulationId);
  }

  async listSimulations(
    options?: ListSimulationsOptions,
  ): Promise<SimulationJobsList> {
    return listSimulations(this.config, options);
  }

  async cancelSimulation(simulationId: string): Promise<void> {
    return cancelSimulation(this.config, simulationId);
  }
}
