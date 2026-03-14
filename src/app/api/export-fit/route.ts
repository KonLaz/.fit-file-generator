import { NextResponse } from "next/server";

import { decodeFitSummary, encodeWorkoutToFit, toFitFileName } from "@/lib/fit-export";
import { isWorkoutPayload, type Workout, validateWorkout } from "@/lib/workout-model";

export const runtime = "nodejs";

const MAX_REQUEST_BYTES = 64 * 1024;
const JSON_CONTENT_TYPE = "application/json";

type ApiError = {
  error: string;
  details?: unknown;
};

function jsonError(status: number, error: string, details?: unknown) {
  const body: ApiError = { error, ...(details ? { details } : {}) };
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function requestByteLength(request: Request, body: string): number {
  const headerValue = request.headers.get("content-length");
  if (headerValue) {
    const parsed = Number.parseInt(headerValue, 10);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
  }

  return new TextEncoder().encode(body).byteLength;
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes(JSON_CONTENT_TYPE)) {
    return jsonError(400, "Expected application/json request body.");
  }

  let rawBody = "";
  try {
    rawBody = await request.text();
  } catch {
    return jsonError(400, "Invalid request body.");
  }

  const bodyBytes = requestByteLength(request, rawBody);
  if (bodyBytes > MAX_REQUEST_BYTES) {
    return jsonError(413, `Payload too large. Maximum size is ${MAX_REQUEST_BYTES} bytes.`);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return jsonError(400, "Invalid JSON body.");
  }

  if (!isWorkoutPayload(payload)) {
    return jsonError(400, "Payload does not match Workout shape.");
  }

  const issues = validateWorkout(payload);
  if (issues.length > 0) {
    return jsonError(400, "Workout validation failed.", issues);
  }

  try {
    const fitBytes = encodeWorkoutToFit(payload);
    const fileName = toFitFileName(payload.name);
    const fitBuffer = Buffer.from(fitBytes);

    return new Response(fitBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return jsonError(500, "Failed to generate FIT file.");
  }
}

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return jsonError(404, "Not found.");
  }

  const smokeWorkout: Workout = {
    name: "Smoke Export",
    sport: "cycling",
    steps: [
      {
        name: "Warmup",
        durationSec: 300,
        target: { type: "power_pct_ftp", low: 55, high: 70 },
        intensity: "warmup",
      },
    ],
  };

  const fitBytes = encodeWorkoutToFit(smokeWorkout);
  const summary = decodeFitSummary(fitBytes);
  const ok =
    summary.errorCount === 0 &&
    summary.fileIdCount === 1 &&
    summary.workoutCount === 1 &&
    summary.workoutStepCount === 1 &&
    summary.workoutStepWithDurationValueCount === 1 &&
    summary.workoutStepWithTargetCount === 1;

  return NextResponse.json(
    {
      ok,
      summary,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
