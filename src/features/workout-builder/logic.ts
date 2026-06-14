import { cloneWorkout, type Intensity, type Target, type Workout, type WorkoutStep } from "@/lib/workout-model";

import { intensityPowerDefaults } from "@/features/workout-builder/constants";
import type {
  ProfileBlock,
  RepeatSetDraft,
  StepDraft,
  WorkoutDraft,
} from "@/features/workout-builder/types";

export function toDraft(workout: Workout): WorkoutDraft {
  return {
    ...workout,
    steps: workout.steps.map((step, index) => ({
      ...step,
      uiId: `step-${index + 1}`,
    })),
  };
}

export function toWorkoutModel(draft: WorkoutDraft): Workout {
  return {
    name: draft.name,
    sport: draft.sport,
    steps: draft.steps.map((step) => ({
      name: step.name,
      durationSec: step.durationSec,
      target: step.target,
      intensity: step.intensity,
    })),
  };
}

export function formatWorkoutDatePrefix(date = new Date()): string {
  const day = `${date.getDate()}`.padStart(2, "0");
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${day}-${month}- `;
}

export function cloneTarget(target: Target): Target {
  if (target.type === "none") {
    return { type: "none" };
  }

  if (target.type === "hr_zone") {
    return { type: "hr_zone", zone: target.zone };
  }

  return {
    type: target.type,
    low: target.low,
    high: target.high,
  };
}

export function cloneStep(step: WorkoutStep): WorkoutStep {
  return {
    ...step,
    target: cloneTarget(step.target),
  };
}

export function targetFromIntensity(
  intensity: Intensity,
): Extract<Target, { type: "power_pct_ftp" }> {
  const range = intensityPowerDefaults[intensity];

  return {
    type: "power_pct_ftp",
    low: range.low,
    high: range.high,
  };
}

export function buildDraftFromWorkout(workout: Workout, nameSuffix = ""): WorkoutDraft {
  const draft = toDraft(cloneWorkout(workout));
  draft.name = `${formatWorkoutDatePrefix()}${nameSuffix}`.trimEnd();
  return draft;
}

export function defaultStep(uiId: string): StepDraft {
  return {
    uiId,
    name: "New interval",
    durationSec: 300,
    target: targetFromIntensity("active"),
    intensity: "active",
  };
}

export function labelForTargetType(targetType: Target["type"]): string {
  if (targetType === "power_pct_ftp") {
    return "Power (% FTP)";
  }

  if (targetType === "power_watts") {
    return "Power (Watts)";
  }

  if (targetType === "hr_zone") {
    return "Heart Rate Zone";
  }

  return "No target";
}

export function pctToWatts(percentOfFtp: number, ftpWatts: number): number {
  return Math.max(1, Math.round((percentOfFtp / 100) * ftpWatts));
}

export function isValidFtp(ftpWatts: number): boolean {
  return Number.isFinite(ftpWatts) && ftpWatts > 0;
}

export function numberInputValue(value: number): number | "" {
  return Number.isFinite(value) ? value : "";
}

export function durationMinutesValue(durationSec: number): number | "" {
  if (!Number.isFinite(durationSec)) {
    return "";
  }

  return Math.floor(Math.max(0, durationSec) / 60);
}

export function durationSecondsValue(durationSec: number): number | "" {
  if (!Number.isFinite(durationSec)) {
    return "";
  }

  return Math.floor(Math.max(0, durationSec)) % 60;
}

export function mapWorkoutForExport(workout: Workout, ftpWatts: number): Workout {
  return {
    ...workout,
    steps: workout.steps.map((step) => {
      if (step.target.type !== "power_pct_ftp") {
        return step;
      }

      return {
        ...step,
        target: {
          type: "power_watts",
          low: pctToWatts(step.target.low, ftpWatts),
          high: pctToWatts(step.target.high, ftpWatts),
        },
      };
    }),
  };
}

export function estimateStepIf(step: WorkoutStep, ftpWatts: number): number | null {
  if (!Number.isFinite(step.durationSec) || step.durationSec <= 0) {
    return null;
  }

  if (step.target.type === "power_pct_ftp") {
    const midpoint = (step.target.low + step.target.high) / 2;
    if (!Number.isFinite(midpoint) || midpoint <= 0) {
      return null;
    }

    return midpoint / 100;
  }

  if (step.target.type === "power_watts" && isValidFtp(ftpWatts)) {
    const midpoint = (step.target.low + step.target.high) / 2;
    if (!Number.isFinite(midpoint) || midpoint <= 0) {
      return null;
    }

    return midpoint / ftpWatts;
  }

  const fallback = intensityPowerDefaults[step.intensity];
  return (fallback.low + fallback.high) / 200;
}

export function estimateWorkoutTss(workout: Workout, ftpWatts: number): number {
  return workout.steps.reduce((sum, step) => {
    const ifValue = estimateStepIf(step, ftpWatts);

    if (ifValue === null || !Number.isFinite(ifValue) || ifValue <= 0) {
      return sum;
    }

    return sum + (step.durationSec / 3600) * ifValue * ifValue * 100;
  }, 0);
}

export function buildProfileBlocks(workout: Workout, ftpWatts: number): ProfileBlock[] {
  let elapsedSec = 0;

  return workout.steps.map((step, index) => {
    const durationSec = Number.isFinite(step.durationSec) && step.durationSec > 0 ? step.durationSec : 1;
    const fallbackRange = intensityPowerDefaults[step.intensity];
    const ifValue = estimateStepIf(step, ftpWatts) ?? (fallbackRange.low + fallbackRange.high) / 200;
    const stepName = step.name.trim() || `Step ${index + 1}`;
    const startSec = elapsedSec;
    const endSec = elapsedSec + durationSec;

    elapsedSec = endSec;

    return {
      uiId: `profile-${index + 1}`,
      primaryName: stepName,
      startSec,
      endSec,
      durationSec,
      intensity: step.intensity,
      durationWeight: Math.max(1, durationSec),
      ifValue,
      heightPercent: Math.max(8, Math.round(ifValue * 100)),
      stepCount: 1,
      targetSummaries: [targetSummary(step.target, ftpWatts)],
      includesShortBursts: durationSec <= 45,
    };
  });
}

export function intensityBarClass(intensity: Intensity): string {
  if (intensity === "warmup") {
    return "bg-sky-500";
  }

  if (intensity === "recovery") {
    return "bg-emerald-500";
  }

  if (intensity === "cooldown") {
    return "bg-slate-500";
  }

  return "bg-[var(--accent)]";
}

export function labelForIntensity(intensity: Intensity): string {
  if (intensity === "active") {
    return "threshold";
  }

  return intensity;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function targetSummary(target: Target, ftpWatts: number): string {
  if (target.type === "none") {
    return "Free ride";
  }

  if (target.type === "hr_zone") {
    return `HR Z${target.zone}`;
  }

  if (target.type === "power_pct_ftp" && isValidFtp(ftpWatts)) {
    const lowWatts = pctToWatts(target.low, ftpWatts);
    const highWatts = pctToWatts(target.high, ftpWatts);
    return `${target.low}-${target.high}% FTP (${lowWatts}-${highWatts} W)`;
  }

  const unit = target.type === "power_pct_ftp" ? "% FTP" : "W";
  return `${target.low}-${target.high} ${unit}`;
}

export function fileNameFromDisposition(disposition: string | null): string {
  if (!disposition) {
    return "workout.fit";
  }

  const match = disposition.match(/filename="([^"]+)"/i);
  if (!match) {
    return "workout.fit";
  }

  return match[1];
}

function repeatStepName(baseName: string, repeatIndex: number, totalRepeats: number): string {
  const trimmedName = baseName.trim();
  const safeName = trimmedName.length > 0 ? trimmedName : "Interval";

  return totalRepeats > 1 ? `${safeName} ${repeatIndex + 1}` : safeName;
}

export function createRepeatSteps(repeatSet: RepeatSetDraft, startingStepId: number): StepDraft[] {
  const safeRepeats = Number.isFinite(repeatSet.repeats)
    ? Math.max(1, Math.trunc(repeatSet.repeats))
    : 1;

  return Array.from({ length: safeRepeats }).flatMap((_entry, repeatIndex) => {
    const offset = repeatIndex * 2;

    return [
      {
        uiId: `step-${startingStepId + offset}`,
        name: repeatStepName(repeatSet.work.name, repeatIndex, safeRepeats),
        durationSec: repeatSet.work.durationSec,
        target: cloneTarget(repeatSet.work.target),
        intensity: repeatSet.work.intensity,
      },
      {
        uiId: `step-${startingStepId + offset + 1}`,
        name: repeatStepName(repeatSet.recovery.name, repeatIndex, safeRepeats),
        durationSec: repeatSet.recovery.durationSec,
        target: cloneTarget(repeatSet.recovery.target),
        intensity: repeatSet.recovery.intensity,
      },
    ];
  });
}
