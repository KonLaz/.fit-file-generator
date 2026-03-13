"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  cloneWorkout,
  formatDuration,
  type Intensity,
  type Target,
  totalDurationSec,
  type ValidationIssue,
  validateWorkout,
  type Workout,
  type WorkoutStep,
  thresholdBuilderTemplate,
} from "@/lib/workout-model";

type StepDraft = WorkoutStep & { uiId: string };

type WorkoutDraft = Omit<Workout, "steps"> & {
  steps: StepDraft[];
};

const intensityOptions: Intensity[] = ["warmup", "active", "recovery", "cooldown"];

const targetTypeOptions: Target["type"][] = ["none", "power_pct_ftp"];

type PowerRange = {
  low: number;
  high: number;
};

type WorkoutPreset = {
  id: string;
  label: string;
  description: string;
  workout: Workout;
};

type WorkoutFolder = {
  id: string;
  label: string;
  description: string;
  workouts: WorkoutPreset[];
};

type BlockPreset = {
  id: string;
  label: string;
  step: WorkoutStep;
};

type TourStepId = "ftp" | "workouts" | "blocks" | "custom";

type TourStep = {
  id: TourStepId;
  title: string;
  description: string;
};

type TourPopupPlacement = "right" | "left" | "top" | "bottom" | "floating";

type TourPopupLayout = {
  top: number;
  left: number;
  placement: TourPopupPlacement;
};

type ProfileBlock = {
  uiId: string;
  primaryName: string;
  startSec: number;
  endSec: number;
  durationSec: number;
  durationWeight: number;
  ifValue: number;
  heightPercent: number;
  intensity: Intensity;
  stepCount: number;
  targetSummaries: string[];
  includesShortBursts: boolean;
};

function powerStep(
  name: string,
  durationSec: number,
  low: number,
  high: number,
  intensity: Intensity,
): WorkoutStep {
  return {
    name,
    durationSec,
    target: { type: "power_pct_ftp", low, high },
    intensity,
  };
}

const intensityPowerDefaults: Record<Intensity, PowerRange> = {
  warmup: { low: 50, high: 55 },
  active: { low: 95, high: 100 },
  recovery: { low: 50, high: 60 },
  cooldown: { low: 45, high: 55 },
};

const blockPresets: BlockPreset[] = [
  {
    id: "warmup",
    label: "Warm up 10m",
    step: {
      name: "Warm up",
      durationSec: 600,
      target: { type: "power_pct_ftp", low: 50, high: 55 },
      intensity: "warmup",
    },
  },
  {
    id: "threshold",
    label: "Threshold 10m",
    step: {
      name: "Threshold",
      durationSec: 600,
      target: { type: "power_pct_ftp", low: 95, high: 100 },
      intensity: "active",
    },
  },
  {
    id: "tempo",
    label: "Tempo 12m",
    step: {
      name: "Tempo",
      durationSec: 720,
      target: { type: "power_pct_ftp", low: 76, high: 87 },
      intensity: "active",
    },
  },
  {
    id: "recovery",
    label: "Recovery 5m",
    step: {
      name: "Recovery",
      durationSec: 300,
      target: { type: "power_pct_ftp", low: 50, high: 60 },
      intensity: "recovery",
    },
  },
  {
    id: "cooldown",
    label: "Cool down 10m",
    step: {
      name: "Cool down",
      durationSec: 600,
      target: { type: "power_pct_ftp", low: 45, high: 55 },
      intensity: "cooldown",
    },
  },
];

const workoutFolders: WorkoutFolder[] = [
  {
    id: "threshold",
    label: "Threshold",
    description: "FTP and sweet-spot builders (about 88-105% FTP)",
    workouts: [
      {
        id: "thr-3x10",
        label: "3x10 FTP",
        description: "Threshold durability (91-95% FTP)",
        workout: {
          name: "3x10 FTP",
          sport: "cycling",
          steps: [
            powerStep("Warm up", 600, 50, 60, "warmup"),
            powerStep("Threshold 1", 600, 91, 95, "active"),
            powerStep("Recovery 1", 300, 50, 60, "recovery"),
            powerStep("Threshold 2", 600, 91, 95, "active"),
            powerStep("Recovery 2", 300, 50, 60, "recovery"),
            powerStep("Threshold 3", 600, 91, 95, "active"),
            powerStep("Cool down", 600, 45, 55, "cooldown"),
          ],
        },
      },
      {
        id: "thr-3x15",
        label: "3x15 FTP",
        description: "Sustained threshold (95-100% FTP)",
        workout: {
          name: "3x15 FTP",
          sport: "cycling",
          steps: [
            powerStep("Warm up", 900, 50, 60, "warmup"),
            powerStep("Threshold 1", 900, 95, 100, "active"),
            powerStep("Recovery 1", 480, 50, 60, "recovery"),
            powerStep("Threshold 2", 900, 95, 100, "active"),
            powerStep("Recovery 2", 480, 50, 60, "recovery"),
            powerStep("Threshold 3", 900, 95, 100, "active"),
            powerStep("Cool down", 600, 45, 55, "cooldown"),
          ],
        },
      },
      {
        id: "thr-2x20-tempo",
        label: "2x20 FTP + Tempo",
        description: "Race-like sustained work",
        workout: {
          name: "2x20 FTP + Tempo",
          sport: "cycling",
          steps: [
            powerStep("Warm up", 900, 50, 60, "warmup"),
            powerStep("FTP interval 1", 1200, 98, 102, "active"),
            powerStep("Tempo bridge", 900, 76, 87, "active"),
            powerStep("FTP interval 2", 1200, 98, 102, "active"),
            powerStep("Cool down", 900, 45, 55, "cooldown"),
          ],
        },
      },
      {
        id: "thr-over-under-4x10",
        label: "Over-Under 4x10",
        description: "4x10 minutes around threshold (95-105% FTP)",
        workout: {
          name: "Over-Under 4x10",
          sport: "cycling",
          steps: [
            powerStep("Warm up", 720, 50, 60, "warmup"),
            powerStep("Over-Under 1", 600, 95, 105, "active"),
            powerStep("Recovery 1", 300, 50, 60, "recovery"),
            powerStep("Over-Under 2", 600, 95, 105, "active"),
            powerStep("Recovery 2", 300, 50, 60, "recovery"),
            powerStep("Over-Under 3", 600, 95, 105, "active"),
            powerStep("Recovery 3", 300, 50, 60, "recovery"),
            powerStep("Over-Under 4", 600, 95, 105, "active"),
            powerStep("Cool down", 600, 45, 55, "cooldown"),
          ],
        },
      },
    ],
  },
  {
    id: "sprint",
    label: "Sprint",
    description: "Neuromuscular sprint sessions (hard spikes above FTP)",
    workouts: [
      {
        id: "spr-fuji-9x20",
        label: "9x20s Sprints",
        description: "Short maximal sprints with long recovery",
        workout: {
          name: "9x20s Sprints",
          sport: "cycling",
          steps: [
            powerStep("Warm up", 900, 50, 65, "warmup"),
            ...Array.from({ length: 9 }).flatMap((_, index) => [
              powerStep(`Sprint ${index + 1}`, 20, 180, 220, "active"),
              powerStep(`Recover ${index + 1}`, 240, 50, 60, "recovery"),
            ]),
            powerStep("Cool down", 600, 45, 55, "cooldown"),
          ],
        },
      },
      {
        id: "spr-dorr-hard-starts",
        label: "Hard Starts 4x",
        description: "30s sprint into supra-threshold effort",
        workout: {
          name: "Hard Starts 4x",
          sport: "cycling",
          steps: [
            powerStep("Warm up", 900, 50, 65, "warmup"),
            ...Array.from({ length: 4 }).flatMap((_, index) => [
              powerStep(`Start sprint ${index + 1}`, 30, 180, 220, "active"),
              powerStep(`Settle effort ${index + 1}`, 120, 105, 110, "active"),
              powerStep(`Recover ${index + 1}`, 540, 45, 60, "recovery"),
            ]),
            powerStep("Cool down", 600, 45, 55, "cooldown"),
          ],
        },
      },
      {
        id: "spr-mcduffie-lite",
        label: "McDuffie Lite",
        description: "Repeated short sprints plus 4-min over-threshold blocks",
        workout: {
          name: "McDuffie Lite",
          sport: "cycling",
          steps: [
            powerStep("Warm up", 900, 50, 65, "warmup"),
            ...Array.from({ length: 3 }).flatMap((_, setIndex) => [
              ...Array.from({ length: 3 }).flatMap((_, sprintIndex) => [
                powerStep(
                  `Sprint ${setIndex + 1}.${sprintIndex + 1}`,
                  12,
                  180,
                  220,
                  "active",
                ),
                powerStep(
                  `Recover ${setIndex + 1}.${sprintIndex + 1}`,
                  50,
                  45,
                  60,
                  "recovery",
                ),
              ]),
              powerStep(`Over FTP ${setIndex + 1}`, 240, 105, 110, "active"),
              powerStep(`Set recovery ${setIndex + 1}`, 180, 45, 60, "recovery"),
            ]),
            powerStep("Cool down", 600, 45, 55, "cooldown"),
          ],
        },
      },
    ],
  },
  {
    id: "endurance",
    label: "Endurance",
    description: "Aerobic base sessions (mostly Zone 2 with controlled surges)",
    workouts: [
      {
        id: "end-z2-60-surges",
        label: "Z2 + Surges 60",
        description: "Zone 2 blocks with short high-cadence surges",
        workout: {
          name: "Z2 + Surges 60",
          sport: "cycling",
          steps: [
            powerStep("Warm up", 360, 45, 75, "warmup"),
            ...Array.from({ length: 8 }).flatMap((_, index) => [
              powerStep(`Endurance ${index + 1}`, 240, 56, 75, "active"),
              powerStep(`Surge ${index + 1}`, 10, 130, 150, "active"),
            ]),
            powerStep("Cool down", 300, 45, 55, "cooldown"),
          ],
        },
      },
      {
        id: "end-z2-90",
        label: "Steady Z2 90",
        description: "Long steady aerobic intervals (60-70% FTP)",
        workout: {
          name: "Steady Z2 90",
          sport: "cycling",
          steps: [
            powerStep("Warm up", 600, 50, 65, "warmup"),
            powerStep("Endurance block 1", 1200, 60, 70, "active"),
            powerStep("Recovery 1", 300, 50, 60, "recovery"),
            powerStep("Endurance block 2", 1200, 60, 70, "active"),
            powerStep("Recovery 2", 300, 50, 60, "recovery"),
            powerStep("Endurance block 3", 1200, 60, 70, "active"),
            powerStep("Cool down", 600, 45, 55, "cooldown"),
          ],
        },
      },
      {
        id: "end-tempo-ladder",
        label: "Tempo Ladder",
        description: "Progressive aerobic tempo from 65% up to 85% FTP",
        workout: {
          name: "Tempo Ladder",
          sport: "cycling",
          steps: [
            powerStep("Warm up", 600, 50, 65, "warmup"),
            powerStep("Tempo 1", 720, 65, 75, "active"),
            powerStep("Easy 1", 180, 50, 60, "recovery"),
            powerStep("Tempo 2", 720, 70, 80, "active"),
            powerStep("Easy 2", 180, 50, 60, "recovery"),
            powerStep("Tempo 3", 720, 75, 85, "active"),
            powerStep("Cool down", 600, 45, 55, "cooldown"),
          ],
        },
      },
    ],
  },
  {
    id: "recovery",
    label: "Recovery",
    description: "Low-stress sessions to absorb fatigue (<55% FTP mostly)",
    workouts: [
      {
        id: "rec-spin-45",
        label: "Recovery Spin 45",
        description: "Easy flush ride with very low aerobic load",
        workout: {
          name: "Recovery Spin 45",
          sport: "cycling",
          steps: [
            powerStep("Warm up", 480, 45, 55, "warmup"),
            powerStep("Easy spin", 1800, 50, 55, "recovery"),
            powerStep("Cool down", 420, 45, 50, "cooldown"),
          ],
        },
      },
      {
        id: "rec-spin-60",
        label: "Recovery Spin 60",
        description: "Longer recovery ride with stable low intensity",
        workout: {
          name: "Recovery Spin 60",
          sport: "cycling",
          steps: [
            powerStep("Warm up", 600, 45, 55, "warmup"),
            powerStep("Easy spin", 2400, 50, 55, "recovery"),
            powerStep("Cool down", 600, 45, 50, "cooldown"),
          ],
        },
      },
      {
        id: "rec-opener-40",
        label: "Recovery + Openers",
        description: "Mostly easy with light activation efforts",
        workout: {
          name: "Recovery + Openers",
          sport: "cycling",
          steps: [
            powerStep("Warm up", 600, 45, 55, "warmup"),
            ...Array.from({ length: 4 }).flatMap((_, index) => [
              powerStep(`Light opener ${index + 1}`, 60, 65, 70, "active"),
              powerStep(`Easy ${index + 1}`, 240, 50, 55, "recovery"),
            ]),
            powerStep("Cool down", 600, 45, 50, "cooldown"),
          ],
        },
      },
    ],
  },
];

const quickWorkoutPresetIds = [
  "thr-3x15",
  "spr-dorr-hard-starts",
  "end-z2-60-surges",
  "rec-spin-45",
];

const allWorkoutPresets = workoutFolders.flatMap((folder) => folder.workouts);

const quickWorkoutPresets: WorkoutPreset[] = quickWorkoutPresetIds.flatMap((presetId) => {
  const preset = allWorkoutPresets.find((entry) => entry.id === presetId);
  return preset ? [preset] : [];
});

const getStartedTourSteps: TourStep[] = [
  {
    id: "ftp",
    title: "Set Your FTP First",
    description:
      "Start by entering your FTP in watts. This powers intensity targets and TSS estimates.",
  },
  {
    id: "workouts",
    title: "Pick A Prefilled Workout",
    description:
      "Choose one of the existing workout templates to get a full session structure instantly.",
  },
  {
    id: "blocks",
    title: "Add Ready-Made Blocks",
    description:
      "Use quick blocks to extend or adjust the session with warmup, threshold, recovery, or cooldown blocks.",
  },
  {
    id: "custom",
    title: "Add Custom Blocks",
    description:
      "Use Add Step to create your own custom interval, then edit duration, intensity, and targets.",
  },
];

function toDraft(workout: Workout): WorkoutDraft {
  return {
    ...workout,
    steps: workout.steps.map((step, index) => ({
      ...step,
      uiId: `step-${index + 1}`,
    })),
  };
}

function toWorkoutModel(draft: WorkoutDraft): Workout {
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

function formatWorkoutDatePrefix(date = new Date()): string {
  const day = `${date.getDate()}`.padStart(2, "0");
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${day}-${month}- `;
}

function cloneTarget(target: Target): Target {
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

function cloneStep(step: WorkoutStep): WorkoutStep {
  return {
    ...step,
    target: cloneTarget(step.target),
  };
}

function targetFromIntensity(intensity: Intensity): Extract<Target, { type: "power_pct_ftp" }> {
  const range = intensityPowerDefaults[intensity];

  return {
    type: "power_pct_ftp",
    low: range.low,
    high: range.high,
  };
}

function buildDraftFromWorkout(workout: Workout, nameSuffix = ""): WorkoutDraft {
  const draft = toDraft(cloneWorkout(workout));
  draft.name = `${formatWorkoutDatePrefix()}${nameSuffix}`.trimEnd();
  return draft;
}

function defaultStep(uiId: string): StepDraft {
  return {
    uiId,
    name: "New interval",
    durationSec: 300,
    target: targetFromIntensity("active"),
    intensity: "active",
  };
}

function labelForTargetType(targetType: Target["type"]): string {
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

function pctToWatts(percentOfFtp: number, ftpWatts: number): number {
  return Math.max(1, Math.round((percentOfFtp / 100) * ftpWatts));
}

function isValidFtp(ftpWatts: number): boolean {
  return Number.isFinite(ftpWatts) && ftpWatts > 0;
}

function numberInputValue(value: number): number | "" {
  return Number.isFinite(value) ? value : "";
}

function durationMinutesValue(durationSec: number): number | "" {
  if (!Number.isFinite(durationSec)) {
    return "";
  }

  return Math.floor(Math.max(0, durationSec) / 60);
}

function durationSecondsValue(durationSec: number): number | "" {
  if (!Number.isFinite(durationSec)) {
    return "";
  }

  return Math.floor(Math.max(0, durationSec)) % 60;
}

function mapWorkoutForExport(workout: Workout, ftpWatts: number): Workout {
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

function estimateStepIf(step: WorkoutStep, ftpWatts: number): number | null {
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

function estimateWorkoutTss(workout: Workout, ftpWatts: number): number {
  return workout.steps.reduce((sum, step) => {
    const ifValue = estimateStepIf(step, ftpWatts);

    if (ifValue === null || !Number.isFinite(ifValue) || ifValue <= 0) {
      return sum;
    }

    // TSS ~= duration(hours) * IF^2 * 100 for steady-state blocks.
    return sum + (step.durationSec / 3600) * ifValue * ifValue * 100;
  }, 0);
}

function buildProfileBlocks(workout: Workout, ftpWatts: number): ProfileBlock[] {
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

function intensityBarClass(intensity: Intensity): string {
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

function labelForIntensity(intensity: Intensity): string {
  if (intensity === "active") {
    return "threshold";
  }

  return intensity;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function TourPopupArrow({ placement }: { placement: TourPopupPlacement }) {
  if (placement === "floating") {
    return null;
  }

  if (placement === "right") {
    return (
      <>
        <span
          aria-hidden
          className="pointer-events-none absolute left-[-12px] top-1/2 -translate-y-1/2 border-y-[10px] border-r-[12px] border-y-transparent border-r-[var(--foreground)]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute left-[-10px] top-1/2 -translate-y-1/2 border-y-[9px] border-r-[11px] border-y-transparent border-r-white"
        />
      </>
    );
  }

  if (placement === "left") {
    return (
      <>
        <span
          aria-hidden
          className="pointer-events-none absolute right-[-12px] top-1/2 -translate-y-1/2 border-y-[10px] border-l-[12px] border-y-transparent border-l-[var(--foreground)]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute right-[-10px] top-1/2 -translate-y-1/2 border-y-[9px] border-l-[11px] border-y-transparent border-l-white"
        />
      </>
    );
  }

  if (placement === "top") {
    return (
      <>
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-[-12px] left-1/2 -translate-x-1/2 border-x-[10px] border-t-[12px] border-x-transparent border-t-[var(--foreground)]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-[-10px] left-1/2 -translate-x-1/2 border-x-[9px] border-t-[11px] border-x-transparent border-t-white"
        />
      </>
    );
  }

  return (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-12px] -translate-x-1/2 border-x-[10px] border-b-[12px] border-x-transparent border-b-[var(--foreground)]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-10px] -translate-x-1/2 border-x-[9px] border-b-[11px] border-x-transparent border-b-white"
      />
    </>
  );
}

function targetSummary(target: Target, ftpWatts: number): string {
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

const formLabelClass =
  "flex flex-col gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]";

const formControlClass =
  "h-10 border border-[var(--line)] bg-white px-3 text-sm font-medium text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]";

const stepControlButtonClass =
  "h-8 border border-[var(--line)] bg-white px-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--foreground)] transition hover:bg-[var(--surface)] disabled:cursor-not-allowed disabled:opacity-40";

function fileNameFromDisposition(disposition: string | null): string {
  if (!disposition) {
    return "workout.fit";
  }

  const match = disposition.match(/filename="([^"]+)"/i);
  if (!match) {
    return "workout.fit";
  }

  return match[1];
}

type ApiErrorResponse = {
  error?: string;
};

export default function Home() {
  const [workout, setWorkout] = useState<WorkoutDraft>(() =>
    buildDraftFromWorkout(thresholdBuilderTemplate),
  );
  const [nextStepId, setNextStepId] = useState(workout.steps.length + 1);
  const [ftpWatts, setFtpWatts] = useState(250);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [validationState, setValidationState] = useState<"idle" | "valid" | "invalid">(
    "idle",
  );
  const [draggedStepIndex, setDraggedStepIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [isWorkoutsModalOpen, setIsWorkoutsModalOpen] = useState(false);
  const [activeWorkoutFolderId, setActiveWorkoutFolderId] = useState(
    workoutFolders[0]?.id ?? "threshold",
  );
  const [isGetStartedOpen, setIsGetStartedOpen] = useState(true);
  const [getStartedStepIndex, setGetStartedStepIndex] = useState(0);
  const [tourPopupLayout, setTourPopupLayout] = useState<TourPopupLayout>({
    top: 24,
    left: 24,
    placement: "floating",
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const ftpTourRef = useRef<HTMLLabelElement | null>(null);
  const workoutsTourRef = useRef<HTMLDivElement | null>(null);
  const blocksTourRef = useRef<HTMLDivElement | null>(null);
  const customTourRef = useRef<HTMLButtonElement | null>(null);
  const popupTourRef = useRef<HTMLElement | null>(null);
  const workoutsModalRef = useRef<HTMLElement | null>(null);

  const workoutModel = useMemo(() => toWorkoutModel(workout), [workout]);
  const totalDuration = useMemo(() => totalDurationSec(workoutModel), [workoutModel]);
  const estimatedTss = useMemo(
    () => estimateWorkoutTss(workoutModel, ftpWatts),
    [workoutModel, ftpWatts],
  );

  const issueMap = useMemo(() => {
    const map = new Map<string, string>();
    issues.forEach((issue) => map.set(issue.path, issue.message));
    return map;
  }, [issues]);

  const profileBlocks = useMemo(
    () => buildProfileBlocks(workoutModel, ftpWatts),
    [workoutModel, ftpWatts],
  );

  const timelineTicks = useMemo(() => {
    const total = Number.isFinite(totalDuration) && totalDuration > 0 ? totalDuration : 0;

    return [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
      ratio,
      label: formatDuration(total * ratio),
    }));
  }, [totalDuration]);

  const activeWorkoutFolder =
    workoutFolders.find((folder) => folder.id === activeWorkoutFolderId) ??
    workoutFolders[0];

  const activeGetStartedStep = isGetStartedOpen
    ? getStartedTourSteps[getStartedStepIndex]
    : null;

  const isLastGetStartedStep =
    getStartedStepIndex >= getStartedTourSteps.length - 1;

  function isTourHighlightActive(stepId: TourStepId): boolean {
    return isGetStartedOpen && activeGetStartedStep?.id === stepId;
  }

  function nextGetStartedStep() {
    if (isLastGetStartedStep) {
      setIsGetStartedOpen(false);
      return;
    }

    setGetStartedStepIndex((previous) => previous + 1);
  }

  function getTourTargetElement(stepId: TourStepId): HTMLElement | null {
    if (stepId === "ftp") {
      return ftpTourRef.current;
    }

    if (stepId === "workouts") {
      return workoutsTourRef.current;
    }

    if (stepId === "blocks") {
      return blocksTourRef.current;
    }

    return customTourRef.current;
  }

  useEffect(() => {
    if (!isGetStartedOpen || !activeGetStartedStep) {
      return;
    }

    const activeStepId = activeGetStartedStep.id;

    function positionTourPopup() {
      const viewportWidth = window.innerWidth;

      if (viewportWidth < 900) {
        setTourPopupLayout((previous) => ({
          ...previous,
          placement: "floating",
        }));
        return;
      }

      const targetElement = getTourTargetElement(activeStepId);
      const popupElement = popupTourRef.current;

      if (!targetElement || !popupElement) {
        return;
      }

      const viewportPadding = 16;
      const gap = 16;
      const targetRect = targetElement.getBoundingClientRect();
      const popupRect = popupElement.getBoundingClientRect();
      const popupWidth = popupRect.width || 420;
      const popupHeight = popupRect.height || 250;
      const viewportHeight = window.innerHeight;
      const maxLeft = Math.max(viewportPadding, viewportWidth - viewportPadding - popupWidth);
      const maxTop = Math.max(viewportPadding, viewportHeight - viewportPadding - popupHeight);
      const centeredLeft = targetRect.left + targetRect.width / 2 - popupWidth / 2;
      const centeredTop = targetRect.top + targetRect.height / 2 - popupHeight / 2;
      const canPlaceRight = targetRect.right + gap + popupWidth <= viewportWidth - viewportPadding;
      const canPlaceLeft = targetRect.left - gap - popupWidth >= viewportPadding;
      const canPlaceBottom =
        targetRect.bottom + gap + popupHeight <= viewportHeight - viewportPadding;
      const canPlaceTop = targetRect.top - gap - popupHeight >= viewportPadding;

      let placement: TourPopupPlacement = "right";

      if (canPlaceRight) {
        placement = "right";
      } else if (canPlaceLeft) {
        placement = "left";
      } else if (canPlaceBottom) {
        placement = "bottom";
      } else if (canPlaceTop) {
        placement = "top";
      } else {
        placement = "floating";
      }

      if (placement === "floating") {
        setTourPopupLayout((previous) => ({
          ...previous,
          placement,
        }));
        return;
      }

      const layout =
        placement === "right"
          ? {
              top: clamp(centeredTop, viewportPadding, maxTop),
              left: clamp(targetRect.right + gap, viewportPadding, maxLeft),
            }
          : placement === "left"
            ? {
                top: clamp(centeredTop, viewportPadding, maxTop),
                left: clamp(targetRect.left - gap - popupWidth, viewportPadding, maxLeft),
              }
            : placement === "bottom"
              ? {
                  top: clamp(targetRect.bottom + gap, viewportPadding, maxTop),
                  left: clamp(centeredLeft, viewportPadding, maxLeft),
                }
              : {
                  top: clamp(targetRect.top - gap - popupHeight, viewportPadding, maxTop),
                  left: clamp(centeredLeft, viewportPadding, maxLeft),
                };

      setTourPopupLayout({
        top: layout.top,
        left: layout.left,
        placement,
      });
    }

    const rafId = window.requestAnimationFrame(positionTourPopup);
    window.addEventListener("resize", positionTourPopup);
    window.addEventListener("scroll", positionTourPopup, true);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", positionTourPopup);
      window.removeEventListener("scroll", positionTourPopup, true);
    };
  }, [activeGetStartedStep, getStartedStepIndex, isGetStartedOpen]);

  useEffect(() => {
    if (!isWorkoutsModalOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const modalElement = workoutsModalRef.current;
    const focusableElements = modalElement
      ? Array.from(
          modalElement.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          ),
        )
      : [];

    document.body.style.overflow = "hidden";
    focusableElements[0]?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeWorkoutsModal();
        return;
      }

      if (event.key === "Tab" && focusableElements.length > 0) {
        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (event.shiftKey) {
          if (active === first || !active) {
            event.preventDefault();
            last.focus();
          }
          return;
        }

        if (active === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isWorkoutsModalOpen]);

  function setField<K extends keyof WorkoutDraft>(field: K, value: WorkoutDraft[K]) {
    setWorkout((previous) => ({ ...previous, [field]: value }));
    setValidationState("idle");
  }

  function updateStep(index: number, update: (step: StepDraft) => StepDraft) {
    setWorkout((previous) => ({
      ...previous,
      steps: previous.steps.map((step, stepIndex) =>
        stepIndex === index ? update(step) : step,
      ),
    }));
    setValidationState("idle");
  }

  function addPresetBlock(preset: BlockPreset) {
    const step: StepDraft = {
      ...cloneStep(preset.step),
      uiId: `step-${nextStepId}`,
    };

    setWorkout((previous) => ({ ...previous, steps: [...previous.steps, step] }));
    setNextStepId((previous) => previous + 1);
    setValidationState("idle");
  }

  function duplicateStep(index: number) {
    const source = workout.steps[index];
    if (!source) {
      return;
    }

    const duplicated: StepDraft = {
      ...cloneStep(source),
      uiId: `step-${nextStepId}`,
      name: `${source.name} copy`,
    };

    setWorkout((previous) => {
      const nextSteps = [...previous.steps];
      nextSteps.splice(index + 1, 0, duplicated);

      return {
        ...previous,
        steps: nextSteps,
      };
    });
    setNextStepId((previous) => previous + 1);
    setValidationState("idle");
  }

  function addStep() {
    const step = defaultStep(`step-${nextStepId}`);
    setWorkout((previous) => ({ ...previous, steps: [...previous.steps, step] }));
    setNextStepId((previous) => previous + 1);
    setValidationState("idle");
  }

  function removeStep(index: number) {
    setWorkout((previous) => ({
      ...previous,
      steps: previous.steps.filter((_step, stepIndex) => stepIndex !== index),
    }));
    setValidationState("idle");
  }

  function moveStep(index: number, direction: "up" | "down") {
    moveStepToIndex(index, direction === "up" ? index - 1 : index + 1);
  }

  function moveStepToIndex(sourceIndex: number, destinationIndex: number) {
    setWorkout((previous) => {
      if (
        sourceIndex < 0 ||
        sourceIndex >= previous.steps.length ||
        destinationIndex < 0 ||
        destinationIndex >= previous.steps.length ||
        sourceIndex === destinationIndex
      ) {
        return previous;
      }

      const reordered = [...previous.steps];
      const [moved] = reordered.splice(sourceIndex, 1);
      reordered.splice(destinationIndex, 0, moved);

      return { ...previous, steps: reordered };
    });
    setValidationState("idle");
  }

  function setTargetType(index: number, targetType: Target["type"]) {
    updateStep(index, (step) => {
      let nextTarget: Target = { type: "none" };

      if (targetType === "power_pct_ftp") {
        nextTarget = targetFromIntensity(step.intensity);
      }

      return { ...step, target: nextTarget };
    });
  }

  function applyWorkoutPreset(preset: WorkoutPreset) {
    const nextWorkout = buildDraftFromWorkout(preset.workout, preset.label);
    setWorkout(nextWorkout);
    setNextStepId(nextWorkout.steps.length + 1);
    setIssues([]);
    setValidationState("idle");
    setDraggedStepIndex(null);
    setDropTargetIndex(null);
    setExportError(null);
    setExportMessage(null);
  }

  function openWorkoutsModal() {
    setIsWorkoutsModalOpen(true);
  }

  function closeWorkoutsModal() {
    setIsWorkoutsModalOpen(false);
  }

  function selectWorkoutFromModal(preset: WorkoutPreset) {
    applyWorkoutPreset(preset);
    closeWorkoutsModal();
  }

  async function exportWorkout() {
    if (!isValidFtp(ftpWatts)) {
      setValidationState("idle");
      setExportError("Enter a valid FTP in watts before exporting.");
      setExportMessage(null);
      return;
    }

    const nextIssues = validateWorkout(workoutModel);
    setIssues(nextIssues);

    if (nextIssues.length > 0) {
      setValidationState("invalid");
      setExportError("Cannot export yet. Fix the highlighted validation issues first.");
      setExportMessage(null);
      return;
    }

    setValidationState("valid");
    setIsExporting(true);
    setExportError(null);
    setExportMessage(null);

    try {
      const exportWorkoutModel = mapWorkoutForExport(workoutModel, ftpWatts);
      const response = await fetch("/api/export-fit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(exportWorkoutModel),
      });

      if (!response.ok) {
        let errorMessage = "Export failed.";

        try {
          const body = (await response.json()) as ApiErrorResponse;
          if (typeof body.error === "string" && body.error.length > 0) {
            errorMessage = body.error;
          }
        } catch {
          // keep fallback message when JSON parsing fails
        }

        throw new Error(errorMessage);
      }

      const fileBlob = await response.blob();
      const fileName = fileNameFromDisposition(
        response.headers.get("content-disposition"),
      );
      const objectUrl = URL.createObjectURL(fileBlob);
      const anchor = document.createElement("a");

      anchor.href = objectUrl;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(objectUrl);

      setExportMessage(`Downloaded ${fileName}`);
      setExportError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to export workout.";
      setExportError(message);
      setExportMessage(null);
    } finally {
      setIsExporting(false);
    }
  }

  function resetTemplate() {
    const nextWorkout = buildDraftFromWorkout(thresholdBuilderTemplate);
    setWorkout(nextWorkout);
    setNextStepId(nextWorkout.steps.length + 1);
    setIssues([]);
    setValidationState("idle");
    setDraggedStepIndex(null);
    setDropTargetIndex(null);
    setExportError(null);
    setExportMessage(null);
  }

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-8 text-[var(--foreground)] sm:px-6 lg:px-10">
      <main className="mx-auto w-full max-w-[1200px] space-y-6">
        <header className="swiss-reveal relative overflow-hidden border-2 border-[var(--foreground)] bg-[var(--surface)] p-6 sm:p-8">
          <div aria-hidden className="absolute right-0 top-0 h-full w-3 bg-[var(--accent)]" />
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--muted)]">
            FIT Workout Export
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold leading-tight tracking-[-0.02em] text-[var(--foreground)] sm:text-5xl">
            Create Structured Workouts for Wahoo ELEMNT
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--muted)] sm:text-base">
            Enter your FTP once, build time-based intervals, and export a `.fit` workout
            you can copy to your device&apos;s `plans` folder over USB.
          </p>
        </header>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.75fr)_minmax(280px,1fr)]">
          <section className="swiss-reveal border-2 border-[var(--foreground)] bg-[var(--surface)] p-5 [animation-delay:80ms] sm:p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="grid w-full gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
                <label className={`${formLabelClass} w-full`}>
                  Workout name
                  <input
                    value={workout.name}
                    onChange={(event) => setField("name", event.target.value)}
                    className={`${formControlClass} h-11`}
                    placeholder="DD-MM- Session title"
                  />
                  {issueMap.has("name") ? (
                    <span className="text-xs normal-case tracking-normal text-[var(--danger-fg)]">
                      {issueMap.get("name")}
                    </span>
                  ) : null}
                </label>
                <label
                  ref={ftpTourRef}
                  className={`${formLabelClass} ${
                    isTourHighlightActive("ftp")
                      ? "relative z-[60] border border-[var(--foreground)] bg-white p-2 ring-4 ring-[var(--accent-soft)]"
                      : ""
                  }`}
                >
                  FTP (watts)
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={numberInputValue(ftpWatts)}
                    onChange={(event) => {
                      setFtpWatts(event.target.valueAsNumber);
                      setExportError(null);
                      setExportMessage(null);
                    }}
                    className={`${formControlClass} h-11`}
                  />
                  {!isValidFtp(ftpWatts) ? (
                    <span className="text-xs normal-case tracking-normal text-[var(--danger-fg)]">
                      Enter a valid FTP.
                    </span>
                  ) : null}
                </label>
              </div>
              <div className="flex gap-2 self-start lg:self-auto">
                <button
                  type="button"
                  onClick={resetTemplate}
                  className="h-11 border-2 border-[var(--foreground)] bg-white px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--foreground)] transition hover:bg-[var(--surface)]"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={exportWorkout}
                  disabled={isExporting}
                  className="h-11 border-2 border-[var(--foreground)] bg-emerald-700 px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isExporting ? "Exporting..." : "Export .FIT"}
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              <div
                ref={workoutsTourRef}
                className={`border border-[var(--line)] bg-white p-3 ${
                  isTourHighlightActive("workouts")
                    ? "relative z-[60] ring-4 ring-[var(--accent-soft)]"
                    : ""
                }`}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                  Prefilled workouts
                </p>
                <button
                  type="button"
                  onClick={openWorkoutsModal}
                  className="mt-3 flex h-28 w-full items-center justify-between border-2 border-[var(--foreground)] bg-white px-4 text-left transition hover:bg-[var(--surface)]"
                >
                  <span>
                    <span className="block text-sm font-bold uppercase tracking-[0.18em] text-[var(--foreground)]">
                      Workouts
                    </span>
                    <span className="mt-1 block text-xs text-[var(--muted)]">
                      Open folder to browse threshold, sprint, endurance, and recovery sessions.
                    </span>
                  </span>
                  <span className="text-2xl font-bold text-[var(--foreground)]">▸</span>
                </button>
              </div>
              <div
                ref={blocksTourRef}
                className={`border border-[var(--line)] bg-white p-3 ${
                  isTourHighlightActive("blocks")
                    ? "relative z-[60] ring-4 ring-[var(--accent-soft)]"
                    : ""
                }`}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                  Quick blocks
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {blockPresets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => addPresetBlock(preset)}
                      className="h-9 border border-[var(--line)] bg-[var(--surface)] px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--foreground)] transition hover:bg-white"
                    >
                      + {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <p className="text-xs font-medium text-[var(--muted)]">
                Drag any block card to reorder quickly.
              </p>
              {workout.steps.map((step, index) => (
                <article
                  key={step.uiId}
                  draggable
                  onDragStart={() => {
                    setDraggedStepIndex(index);
                    setDropTargetIndex(index);
                  }}
                  onDragEnd={() => {
                    setDraggedStepIndex(null);
                    setDropTargetIndex(null);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDropTargetIndex(index);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (draggedStepIndex !== null) {
                      moveStepToIndex(draggedStepIndex, index);
                    }
                    setDraggedStepIndex(null);
                    setDropTargetIndex(null);
                  }}
                  className={`cursor-grab border border-[var(--line)] border-l-4 border-l-[var(--accent)] bg-white p-4 shadow-[6px_6px_0_0_rgb(0_0_0_/_0.06)] active:cursor-grabbing ${
                    dropTargetIndex === index && draggedStepIndex !== index
                      ? "ring-2 ring-[var(--accent-soft)]"
                      : ""
                  } ${draggedStepIndex === index ? "opacity-70" : ""}`}
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--foreground)]">
                      Step {index + 1}
                    </h2>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => duplicateStep(index)}
                        className={stepControlButtonClass}
                      >
                        Copy
                      </button>
                      <button
                        type="button"
                        onClick={() => moveStep(index, "up")}
                        disabled={index === 0}
                        className={stepControlButtonClass}
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        onClick={() => moveStep(index, "down")}
                        disabled={index === workout.steps.length - 1}
                        className={stepControlButtonClass}
                      >
                        Down
                      </button>
                      <button
                        type="button"
                        onClick={() => removeStep(index)}
                        className="h-8 border border-[var(--danger-fg)] bg-[var(--danger-bg)] px-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--danger-fg)] transition hover:brightness-95"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-4">
                    <label className={`${formLabelClass} md:col-span-2`}>
                      Step name
                      <input
                        value={step.name}
                        onChange={(event) =>
                          updateStep(index, (current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                        className={`${formControlClass} normal-case tracking-normal`}
                      />
                      {issueMap.has(`steps.${index}.name`) ? (
                        <span className="text-xs normal-case tracking-normal text-[var(--danger-fg)]">
                          {issueMap.get(`steps.${index}.name`)}
                        </span>
                      ) : null}
                    </label>

                    <label className={formLabelClass}>
                      Duration (min:sec)
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={durationMinutesValue(step.durationSec)}
                          onChange={(event) =>
                            updateStep(index, (current) => {
                              const nextMinutes = event.target.valueAsNumber;
                              const safeSeconds = Number.isFinite(current.durationSec)
                                ? Math.floor(Math.max(0, current.durationSec)) % 60
                                : 0;

                              return {
                                ...current,
                                durationSec: Number.isFinite(nextMinutes)
                                  ? Math.max(0, Math.trunc(nextMinutes)) * 60 + safeSeconds
                                  : Number.NaN,
                              };
                            })
                          }
                          placeholder="min"
                          className={`${formControlClass} w-full normal-case tracking-normal`}
                        />
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={durationSecondsValue(step.durationSec)}
                          onChange={(event) =>
                            updateStep(index, (current) => {
                              const nextSeconds = event.target.valueAsNumber;
                              const safeMinutes = Number.isFinite(current.durationSec)
                                ? Math.floor(Math.max(0, current.durationSec) / 60)
                                : 0;

                              if (!Number.isFinite(nextSeconds)) {
                                return {
                                  ...current,
                                  durationSec: Number.NaN,
                                };
                              }

                              const normalizedSeconds = Math.max(0, Math.trunc(nextSeconds));
                              const extraMinutes = Math.floor(normalizedSeconds / 60);
                              const secondsRemainder = normalizedSeconds % 60;

                              return {
                                ...current,
                                durationSec:
                                  (safeMinutes + extraMinutes) * 60 + secondsRemainder,
                              };
                            })
                          }
                          placeholder="sec"
                          className={`${formControlClass} w-full normal-case tracking-normal`}
                        />
                      </div>
                      {issueMap.has(`steps.${index}.durationSec`) ? (
                        <span className="text-xs normal-case tracking-normal text-[var(--danger-fg)]">
                          {issueMap.get(`steps.${index}.durationSec`)}
                        </span>
                      ) : null}
                    </label>

                    <label className={formLabelClass}>
                      Intensity
                      <select
                        value={step.intensity}
                        onChange={(event) =>
                          updateStep(index, (current) => {
                            const nextIntensity = event.target.value as Intensity;
                            let nextTarget = current.target;

                            if (
                              current.target.type === "none" ||
                              current.target.type === "power_pct_ftp"
                            ) {
                              nextTarget = targetFromIntensity(nextIntensity);
                            }

                            return {
                              ...current,
                              intensity: nextIntensity,
                              target: nextTarget,
                            };
                          })
                        }
                        className={`${formControlClass} normal-case tracking-normal`}
                      >
                        {intensityOptions.map((option) => (
                          <option key={option} value={option}>
                            {labelForIntensity(option)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-4">
                    <label className={`${formLabelClass} md:col-span-2`}>
                      Target type
                      <select
                        value={step.target.type}
                        onChange={(event) =>
                          setTargetType(index, event.target.value as Target["type"])
                        }
                        className={`${formControlClass} normal-case tracking-normal`}
                      >
                        {targetTypeOptions.map((option) => (
                          <option key={option} value={option}>
                            {labelForTargetType(option)}
                          </option>
                        ))}
                      </select>
                    </label>

                    {step.target.type === "power_pct_ftp" || step.target.type === "power_watts" ? (
                      <>
                        <label className={formLabelClass}>
                          {step.target.type === "power_pct_ftp" ? "Low (% FTP)" : "Low (W)"}
                          <input
                            type="number"
                            min={1}
                            value={numberInputValue(step.target.low)}
                            onChange={(event) =>
                              updateStep(index, (current) => {
                                if (
                                  current.target.type !== "power_pct_ftp" &&
                                  current.target.type !== "power_watts"
                                ) {
                                  return current;
                                }

                                return {
                                  ...current,
                                  target: {
                                    ...current.target,
                                    low: event.target.valueAsNumber,
                                  },
                                };
                              })
                            }
                            className={`${formControlClass} normal-case tracking-normal`}
                          />
                          {issueMap.has(`steps.${index}.target.low`) ? (
                            <span className="text-xs normal-case tracking-normal text-[var(--danger-fg)]">
                              {issueMap.get(`steps.${index}.target.low`)}
                            </span>
                          ) : null}
                        </label>
                        <label className={formLabelClass}>
                          {step.target.type === "power_pct_ftp" ? "High (% FTP)" : "High (W)"}
                          <input
                            type="number"
                            min={1}
                            value={numberInputValue(step.target.high)}
                            onChange={(event) =>
                              updateStep(index, (current) => {
                                if (
                                  current.target.type !== "power_pct_ftp" &&
                                  current.target.type !== "power_watts"
                                ) {
                                  return current;
                                }

                                return {
                                  ...current,
                                  target: {
                                    ...current.target,
                                    high: event.target.valueAsNumber,
                                  },
                                };
                              })
                            }
                            className={`${formControlClass} normal-case tracking-normal`}
                          />
                          {issueMap.has(`steps.${index}.target.high`) ? (
                            <span className="text-xs normal-case tracking-normal text-[var(--danger-fg)]">
                              {issueMap.get(`steps.${index}.target.high`)}
                            </span>
                          ) : null}
                        </label>
                        {step.target.type === "power_pct_ftp" ? (
                          <p className="md:col-span-2 text-xs normal-case tracking-normal text-[var(--muted)]">
                            {isValidFtp(ftpWatts)
                              ? `Estimated target: ${pctToWatts(step.target.low, ftpWatts)}-${pctToWatts(
                                  step.target.high,
                                  ftpWatts,
                                )} W`
                              : "Enter FTP above to calculate watts."}
                          </p>
                        ) : null}
                      </>
                    ) : null}

                  </div>
                </article>
              ))}
            </div>

            <button
              ref={customTourRef}
              type="button"
              onClick={addStep}
              className={`mt-5 h-11 border-2 border-dashed border-[var(--foreground)] bg-white px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--foreground)] transition hover:bg-[var(--surface)] ${
                isTourHighlightActive("custom")
                  ? "relative z-[60] ring-4 ring-[var(--accent-soft)]"
                  : ""
              }`}
            >
              + Add Step
            </button>
          </section>

          <aside className="space-y-4">
            <section className="swiss-reveal border-2 border-[var(--foreground)] bg-[var(--surface)] p-5 [animation-delay:120ms]">
              <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--foreground)]">
                Workout profile
              </h2>
              <div className="mt-4 border border-[var(--line)] bg-white p-3">
                <div className="h-36 border border-[var(--line)] bg-[linear-gradient(to_top,_transparent_49%,_rgb(15_23_42_/_0.05)_50%)] p-2">
                  {workout.steps.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-xs text-[var(--muted)]">
                      Add blocks to preview intensity and duration.
                    </div>
                  ) : (
                    <div className="grid h-full grid-cols-[30px_minmax(0,1fr)] gap-2">
                      <div className="flex h-full flex-col justify-between text-[10px] font-semibold text-[var(--muted)]">
                        <span>100%</span>
                        <span>50%</span>
                        <span>0%</span>
                      </div>
                      <div className="flex h-full items-end gap-1 border-l border-[var(--line)] pl-2">
                        {profileBlocks.map((block, index) => {
                          const ifPercent = Math.round(block.ifValue * 100);
                          const targetList = Array.from(new Set(block.targetSummaries));
                          const blockLabel =
                            block.stepCount === 1
                              ? block.primaryName
                              : `${block.primaryName} +${block.stepCount - 1} blocks`;

                          return (
                            <div
                              key={block.uiId}
                              className="group relative flex h-full min-w-0 items-end"
                              style={{ flexGrow: block.durationWeight }}
                              tabIndex={0}
                              aria-label={`${blockLabel}, ${ifPercent}% FTP, ${formatDuration(block.durationSec)}`}
                            >
                              <div
                                className={`w-full border border-white/70 ${intensityBarClass(block.intensity)}`}
                                style={{ height: `${block.heightPercent}%` }}
                              />
                              <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-64 -translate-x-1/2 border border-[var(--foreground)] bg-white p-2 text-[10px] text-[var(--foreground)] shadow-[4px_4px_0_0_rgb(0_0_0_/_0.1)] group-hover:block group-focus:block">
                                <p className="font-bold uppercase tracking-[0.1em]">{blockLabel}</p>
                                <p className="mt-1 text-[var(--muted)]">
                                  Time {formatDuration(block.startSec)} - {formatDuration(block.endSec)}
                                </p>
                                <p className="text-[var(--muted)]">
                                  Duration {formatDuration(block.durationSec)} · {ifPercent}% FTP
                                </p>
                                <p className="text-[var(--muted)]">
                                  {labelForIntensity(block.intensity)}
                                  {block.includesShortBursts ? " · includes short bursts" : ""}
                                </p>
                                <p className="mt-1 line-clamp-2 text-[var(--foreground)]">
                                  {targetList.slice(0, 2).join(" · ")}
                                  {targetList.length > 2 ? " …" : ""}
                                </p>
                                <p className="text-[var(--muted)]">Block {index + 1}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                <div className="ml-[38px] mt-2 flex items-center justify-between border-t border-[var(--line)] pt-2 text-[10px] font-semibold text-[var(--muted)]">
                  {timelineTicks.map((tick) => (
                    <span key={`tick-${tick.ratio}`}>{tick.label}</span>
                  ))}
                </div>
              </div>
            </section>

            <section className="swiss-reveal border-2 border-[var(--foreground)] bg-[var(--surface)] p-5 [animation-delay:140ms]">
              <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--foreground)]">
                Summary
              </h2>
              <dl className="mt-4 space-y-3 text-sm text-[var(--foreground)]">
                <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
                  <dt>Sport</dt>
                  <dd className="font-semibold uppercase">{workout.sport}</dd>
                </div>
                <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
                  <dt>Total steps</dt>
                  <dd className="font-semibold">{workout.steps.length}</dd>
                </div>
                <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
                  <dt>FTP</dt>
                  <dd className="font-semibold">{isValidFtp(ftpWatts) ? `${ftpWatts} W` : "-"}</dd>
                </div>
                <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
                  <dt className="flex items-center gap-1">
                    <span>Est. TSS</span>
                    <span className="group relative inline-flex">
                      <span
                        className="inline-flex h-4 w-4 items-center justify-center border border-[var(--line)] text-[10px] font-bold text-[var(--muted)]"
                        tabIndex={0}
                        aria-label="TSS estimation info"
                      >
                        i
                      </span>
                      <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-64 -translate-x-1/2 border border-[var(--foreground)] bg-white px-2 py-1 text-[10px] leading-relaxed text-[var(--foreground)] opacity-0 shadow-[4px_4px_0_0_rgb(0_0_0_/_0.1)] transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                        Estimated with IF-based TSS approximation from power targets.
                      </span>
                    </span>
                  </dt>
                  <dd className="font-semibold">{Number.isFinite(estimatedTss) ? estimatedTss.toFixed(1) : "-"}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Total duration</dt>
                  <dd className="font-semibold">{formatDuration(totalDuration)}</dd>
                </div>
              </dl>
              {issueMap.has("steps") ? (
                <p className="mt-3 text-xs text-[var(--danger-fg)]">{issueMap.get("steps")}</p>
              ) : null}
              {exportMessage ? (
                <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
                  {exportMessage}
                </p>
              ) : null}
              {exportError ? (
                <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
                  {exportError}
                </p>
              ) : null}
            </section>
          </aside>
        </div>
      </main>
      {isWorkoutsModalOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/45"
            onClick={closeWorkoutsModal}
            aria-hidden
          />
          <section
            ref={workoutsModalRef}
            role="dialog"
            aria-modal="true"
            aria-label="Workouts folder"
            className="relative z-[90] w-full max-w-[880px] border-2 border-[var(--foreground)] bg-white p-5 shadow-[12px_12px_0_0_rgb(0_0_0_/_0.16)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                  Workouts
                </p>
                <h3 className="mt-1 text-lg font-bold uppercase tracking-[0.1em] text-[var(--foreground)]">
                  Select a cycling workout
                </h3>
              </div>
              <button
                type="button"
                onClick={closeWorkoutsModal}
                className="h-9 border border-[var(--line)] bg-white px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--foreground)] transition hover:bg-[var(--surface)]"
              >
                Close
              </button>
            </div>

            <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              Quick picks
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {quickWorkoutPresets.map((preset) => (
                <button
                  key={`modal-quick-${preset.id}`}
                  type="button"
                  onClick={() => selectWorkoutFromModal(preset)}
                  className="h-9 border border-[var(--foreground)] bg-[var(--surface)] px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--foreground)] transition hover:bg-white"
                  title={preset.description}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
              <aside className="space-y-2">
                {workoutFolders.map((folder) => (
                  <button
                    key={`folder-tab-${folder.id}`}
                    type="button"
                    onClick={() => setActiveWorkoutFolderId(folder.id)}
                    className={`w-full border px-3 py-2 text-left text-[10px] font-bold uppercase tracking-[0.12em] transition ${
                      folder.id === activeWorkoutFolder?.id
                        ? "border-[var(--foreground)] bg-[var(--accent)] text-white"
                        : "border-[var(--line)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-white"
                    }`}
                  >
                    {folder.label}
                  </button>
                ))}
              </aside>
              <div className="border border-[var(--line)] bg-[var(--surface)] p-3">
                {activeWorkoutFolder ? (
                  <>
                    <p className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">
                      {activeWorkoutFolder.label}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {activeWorkoutFolder.description}
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {activeWorkoutFolder.workouts.map((preset) => (
                        <button
                          key={`modal-preset-${preset.id}`}
                          type="button"
                          onClick={() => selectWorkoutFromModal(preset)}
                          className="border border-[var(--line)] bg-white px-3 py-2 text-left transition hover:bg-[var(--surface)]"
                          title={preset.description}
                        >
                          <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">
                            {preset.label}
                          </span>
                          <span className="mt-1 block text-xs text-[var(--muted)]">
                            {preset.description}
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      ) : null}
      {!isWorkoutsModalOpen && isGetStartedOpen && activeGetStartedStep ? (
        <>
          <div className="fixed inset-0 z-40 bg-black/35" aria-hidden />
          <section
            ref={popupTourRef}
            role="dialog"
            aria-modal="true"
            aria-label="Get started guide"
            className={`fixed z-[70] border-2 border-[var(--foreground)] bg-white p-4 shadow-[10px_10px_0_0_rgb(0_0_0_/_0.14)] ${
              tourPopupLayout.placement === "floating"
                ? "bottom-4 left-4 right-4 sm:bottom-6 sm:left-auto sm:right-6 sm:w-[420px]"
                : "w-[420px]"
            }`}
            style={
              tourPopupLayout.placement === "floating"
                ? undefined
                : { top: `${tourPopupLayout.top}px`, left: `${tourPopupLayout.left}px` }
            }
          >
            <TourPopupArrow placement={tourPopupLayout.placement} />
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
              Get Started
            </p>
            <h3 className="mt-2 text-base font-bold uppercase tracking-[0.08em] text-[var(--foreground)]">
              {activeGetStartedStep.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--foreground)]">
              {activeGetStartedStep.description}
            </p>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              Step {getStartedStepIndex + 1} of {getStartedTourSteps.length}
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsGetStartedOpen(false)}
                className="h-9 border border-[var(--line)] bg-white px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--foreground)] transition hover:bg-[var(--surface)]"
              >
                Stop
              </button>
              <button
                type="button"
                onClick={nextGetStartedStep}
                className="h-9 border border-[var(--foreground)] bg-[var(--accent)] px-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-white transition hover:brightness-95"
              >
                {isLastGetStartedStep ? "Finish" : "Next"}
              </button>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
