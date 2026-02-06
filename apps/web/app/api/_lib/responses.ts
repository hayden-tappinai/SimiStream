import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function errorResponse(
  message: string,
  status = 500,
): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function validationErrorResponse(error: ZodError): NextResponse {
  return NextResponse.json(
    {
      error: "Validation error",
      details: error.flatten().fieldErrors,
    },
    { status: 400 },
  );
}
