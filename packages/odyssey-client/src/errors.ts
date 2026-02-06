import type { OdysseyApiErrorBody } from "./types";

export class OdysseyError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = "OdysseyError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class OdysseyRateLimitError extends OdysseyError {
  constructor(message = "Rate limit exceeded") {
    super(message, 429, "RATE_LIMIT_EXCEEDED");
    this.name = "OdysseyRateLimitError";
  }
}

export class OdysseyStreamNotFoundError extends OdysseyError {
  constructor(streamId: string) {
    super(`Stream not found: ${streamId}`, 404, "STREAM_NOT_FOUND");
    this.name = "OdysseyStreamNotFoundError";
  }
}

export class OdysseyStreamEndedError extends OdysseyError {
  constructor(streamId: string) {
    super(`Stream has ended: ${streamId}`, 410, "STREAM_ENDED");
    this.name = "OdysseyStreamEndedError";
  }
}

export function toOdysseyError(
  statusCode: number,
  body: OdysseyApiErrorBody | string,
): OdysseyError {
  const message =
    typeof body === "string" ? body : body.message || body.error || "Unknown Odyssey error";
  const code = typeof body === "string" ? "UNKNOWN" : body.code || "UNKNOWN";

  if (statusCode === 429) {
    return new OdysseyRateLimitError(message);
  }
  if (statusCode === 404) {
    return new OdysseyStreamNotFoundError(message);
  }
  if (statusCode === 410) {
    return new OdysseyStreamEndedError(message);
  }

  return new OdysseyError(message, statusCode, code);
}
