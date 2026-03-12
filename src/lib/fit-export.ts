import { Decoder, Encoder, Profile, Stream } from "@garmin/fitsdk";

import type { Intensity, Target, Workout, WorkoutStep } from "@/lib/workout-model";

const WORKOUT_POWER_WATTS_OFFSET = 1000;
const SOFTWARE_VERSION = 1;
const PRODUCT_ID = 0;

function mapIntensity(intensity: Intensity): string {
  switch (intensity) {
    case "warmup":
      return "warmup";
    case "recovery":
      return "recovery";
    case "cooldown":
      return "cooldown";
    case "active":
    default:
      return "active";
  }
}

function mapTarget(target: Target): Record<string, number | string> {
  if (target.type === "none") {
    return {
      targetType: "open",
      targetValue: 0,
    };
  }

  if (target.type === "hr_zone") {
    return {
      targetType: "heartRate",
      targetValue: target.zone,
    };
  }

  if (target.type === "power_watts") {
    return {
      targetType: "power",
      targetValue: 0,
      customTargetValueLow: target.low + WORKOUT_POWER_WATTS_OFFSET,
      customTargetValueHigh: target.high + WORKOUT_POWER_WATTS_OFFSET,
    };
  }

  return {
    targetType: "power",
    targetValue: 0,
    customTargetValueLow: target.low,
    customTargetValueHigh: target.high,
  };
}

function mapStep(step: WorkoutStep, messageIndex: number): Record<string, number | string> {
  return {
    messageIndex,
    wktStepName: step.name,
    durationType: "time",
    durationValue: step.durationSec * 1000,
    intensity: mapIntensity(step.intensity),
    ...mapTarget(step.target),
  };
}

export function encodeWorkoutToFit(workout: Workout): Uint8Array {
  const encoder = new Encoder();
  const now = new Date();

  encoder.onMesg(Profile.MesgNum.FILE_ID, {
    manufacturer: "development",
    product: PRODUCT_ID,
    type: "workout",
    timeCreated: now,
  });

  encoder.onMesg(Profile.MesgNum.FILE_CREATOR, {
    softwareVersion: SOFTWARE_VERSION,
  });

  encoder.onMesg(Profile.MesgNum.WORKOUT, {
    sport: workout.sport,
    wktName: workout.name,
    numValidSteps: workout.steps.length,
  });

  workout.steps.forEach((step, index) => {
    encoder.onMesg(Profile.MesgNum.WORKOUT_STEP, mapStep(step, index));
  });

  return encoder.close();
}

export function toFitFileName(workoutName: string): string {
  const cleaned = workoutName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

  if (!cleaned) {
    return "workout.fit";
  }

  return `${cleaned}.fit`;
}

export type FitDecodeSummary = {
  errorCount: number;
  fileIdCount: number;
  workoutCount: number;
  workoutStepCount: number;
  workoutStepWithDurationValueCount: number;
  workoutStepWithTargetCount: number;
};

export function decodeFitSummary(bytes: Uint8Array): FitDecodeSummary {
  const decoder = new Decoder(Stream.fromByteArray(Array.from(bytes)));
  const { messages, errors } = decoder.read();
  const workoutSteps = messages.workoutStepMesgs ?? [];

  const workoutStepWithDurationValueCount = workoutSteps.filter(
    (step) => typeof step.durationValue === "number" && step.durationValue > 0,
  ).length;

  const workoutStepWithTargetCount = workoutSteps.filter((step) => {
    if (step.targetType === "heartRate") {
      return typeof step.targetValue === "number";
    }

    if (step.targetType === "power") {
      return (
        typeof step.customTargetValueLow === "number" &&
        typeof step.customTargetValueHigh === "number"
      );
    }

    return true;
  }).length;

  return {
    errorCount: errors.length,
    fileIdCount: messages.fileIdMesgs?.length ?? 0,
    workoutCount: messages.workoutMesgs?.length ?? 0,
    workoutStepCount: workoutSteps.length,
    workoutStepWithDurationValueCount,
    workoutStepWithTargetCount,
  };
}
