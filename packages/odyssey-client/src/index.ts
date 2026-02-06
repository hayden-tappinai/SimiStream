export { OdysseyClient } from "./client";

export type {
  OdysseyConfig,
  ConnectionStatus,
  StartStreamOptions,
  InteractOptions,
  Recording,
  StreamRecordingSummary,
  ListStreamRecordingsOptions,
  StreamRecordingsListResponse,
  SimulationJobStatus,
  ScriptEntry,
  SimulateOptions,
  SimulationStream,
  SimulationJob,
  SimulationJobDetail,
  SimulationJobInfo,
  ListSimulationsOptions,
  SimulationJobsList,
  OdysseyEventHandlers,
  OdysseyApiErrorBody,
} from "./types";

export {
  OdysseyError,
  OdysseyRateLimitError,
  OdysseyStreamNotFoundError,
  OdysseyStreamEndedError,
  toOdysseyError,
} from "./errors";
