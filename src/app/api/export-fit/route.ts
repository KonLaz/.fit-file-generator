import { NextResponse } from "next/server";

import {
  decodeFitSummary,
  encodeWorkoutToFit,
  toFitFileName,
} from "@/lib/fit-export";
import type { Target, Workout } from "@/lib/workout-model";
import { validateWorkout } from "@/lib/workout-model";

export const runtime = "nodejs";

type ApiError = {
  error: string;
  details?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isTargetPayload(target: unknown): target is Target {
  if (!isRecord(target) || typeof target.type !== "string") {
    return false;
  }

  if (target.type === "none") {
    return true;
  }

  if (target.type === "hr_zone") {
    return typeof target.zone === "number";
  }

  if (target.type === "power_pct_ftp" || target.type === "power_watts") {
    return typeof target.low === "number" && typeof target.high === "number";
  }

  return false;
}

function isWorkoutPayload(payload: unknown): payload is Workout {
  if (!isRecord(payload)) {
    return false;
  }

  if (
    typeof payload.name !== "string" ||
    payload.sport !== "cycling" ||
    !Array.isArray(payload.steps)
  ) {
    return false;
  }

  return payload.steps.every(
    (step) =>
      isRecord(step) &&
      typeof step.name === "string" &&
      typeof step.durationSec === "number" &&
      typeof step.intensity === "string" &&
      isTargetPayload(step.target),
  );
}

function badRequest(error: string, details?: unknown) {
  const body: ApiError = { error, ...(details ? { details } : {}) };
  return NextResponse.json(body, { status: 400 });
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return badRequest("Invalid JSON body.");
  }

  if (!isWorkoutPayload(payload)) {
    return badRequest("Payload does not match Workout shape.");
  }

  const issues = validateWorkout(payload);

  if (issues.length > 0) {
    return badRequest("Workout validation failed.", issues);
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
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown FIT export error.";
    return NextResponse.json(
      { error: "Failed to generate FIT file.", details: message },
      { status: 500 },
    );
  }
}

export async function GET() {
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
    summary.workoutStepCount === 1;

  return NextResponse.json({
    ok,
    summary,
  });
}
