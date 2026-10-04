import "server-only";
import { NextResponse } from "next/server";
import { AiError } from "./client";

export function aiErrorResponse(e: unknown) {
  if (e instanceof AiError) {
    const status = e.kind === "unavailable" ? 503 : e.kind === "rate_limited" ? 429 : 502;
    return NextResponse.json({ error: e.message, kind: e.kind }, { status });
  }
  return NextResponse.json({ error: e instanceof Error ? e.message : "Unexpected error" }, { status: 500 });
}
