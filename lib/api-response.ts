// Typed response envelope helpers.
// Every route returns { success, data? } or { success, error, code, details? }.

import { NextResponse } from "next/server";

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiError = {
  success: false;
  error: string;
  code: string;
  details?: unknown;
};

export function ok<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

export function err(
  message: string,
  code: string,
  status: number,
  details?: unknown
): NextResponse<ApiError> {
  const body: ApiError = { success: false, error: message, code };
  if (details !== undefined) body.details = details;
  return NextResponse.json(body, { status });
}
