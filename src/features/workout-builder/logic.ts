import { cloneWorkout, type Intensity, type Target, type Workout, type WorkoutStep } from "@/lib/workout-model";

import { intensityPowerDefaults } from "@/features/workout-builder/constants";
import type { ProfileBlock, StepDraft, WorkoutDraft } from "@/features/workout-builder/types";

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
  const shortStepThresholdSec = 45;

  type InternalBlock = {
    uiId: string;
    primaryName: string;
    durationSec: number;
    intensity: Intensity;
    ifSecondsSum: number;
    peakIfValue: number;
    stepCount: number;
    targetSummaries: string[];
    includesShortBursts: boolean;
  };

  function fallbackIf(intensity: Intensity): number {
    const range = intensityPowerDefaults[intensity];
    return (range.low + range.high) / 200;
  }

  function mergeBlocks(
    previous: InternalBlock,
    current: InternalBlock,
    includesShortBursts: boolean,
  ) {
    previous.durationSec += current.durationSec;
    previous.ifSecondsSum += current.ifSecondsSum;
    if (current.peakIfValue > previous.peakIfValue) {
      previous.peakIfValue = current.peakIfValue;
      previous.intensity = current.intensity;
    }
    previous.stepCount += current.stepCount;
    previous.targetSummaries = [...previous.targetSummaries, ...current.targetSummaries];
    previous.includesShortBursts = previous.includesShortBursts || includesShortBursts;
  }

  const internalBlocks = workout.steps.reduce<InternalBlock[]>((blocks, step, index) => {
    const durationSec = Number.isFinite(step.durationSec) && step.durationSec > 0 ? step.durationSec : 1;
    const ifValue = estimateStepIf(step, ftpWatts) ?? fallbackIf(step.intensity);
    const stepName = step.name.trim() || `Step ${index + 1}`;
    const target = targetSummary(step.target, ftpWatts);
    const currentBlock: InternalBlock = {
      uiId: `profile-${index + 1}`,
      primaryName: stepName,
      durationSec,
      intensity: step.intensity,
      ifSecondsSum: ifValue * durationSec,
      peakIfValue: ifValue,
      stepCount: 1,
      targetSummaries: [target],
      includesShortBursts: false,
    };

    const previousBlock = blocks[blocks.length - 1];
    const isShortStep = durationSec <= shortStepThresholdSec;

    if (previousBlock && isShortStep) {
      mergeBlocks(previousBlock, currentBlock, true);
      return blocks;
    }

    blocks.push(currentBlock);
    return blocks;
  }, []);

  const compressedBlocks = internalBlocks.reduce<InternalBlock[]>((blocks, block) => {
    const previousBlock = blocks[blocks.length - 1];

    if (!previousBlock) {
      blocks.push(block);
      return blocks;
    }

    const previousIf = previousBlock.ifSecondsSum / previousBlock.durationSec;
    const currentIf = block.ifSecondsSum / block.durationSec;

    if (previousBlock.intensity === block.intensity && Math.abs(previousIf - currentIf) <= 0.08) {
      mergeBlocks(previousBlock, block, block.includesShortBursts);
      return blocks;
    }

    blocks.push(block);
    return blocks;
  }, []);

  let elapsedSec = 0;

  return compressedBlocks.map((block, index) => {
    const ifValue = block.ifSecondsSum / block.durationSec;
    const startSec = elapsedSec;
    const endSec = elapsedSec + block.durationSec;
    elapsedSec = endSec;

    return {
      uiId: `${block.uiId}-${index + 1}`,
      primaryName: block.primaryName,
      startSec,
      endSec,
      durationSec: block.durationSec,
      durationWeight: Math.max(1, block.durationSec),
      ifValue,
      heightPercent: Math.max(8, Math.min(100, Math.round(ifValue * 100))),
      intensity: block.intensity,
      stepCount: block.stepCount,
      targetSummaries: block.targetSummaries,
      includesShortBursts: block.includesShortBursts,
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
