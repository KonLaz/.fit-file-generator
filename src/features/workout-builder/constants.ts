import type { Intensity, Target, WorkoutStep } from "@/lib/workout-model";

import type {
  BlockPreset,
  PowerRange,
  TourStep,
  WorkoutFolder,
  WorkoutPreset,
} from "@/features/workout-builder/types";

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

export const intensityOptions: Intensity[] = ["warmup", "active", "recovery", "cooldown"];

export const targetTypeOptions: Target["type"][] = ["none", "power_pct_ftp"];

export const intensityPowerDefaults: Record<Intensity, PowerRange> = {
  warmup: { low: 50, high: 55 },
  active: { low: 95, high: 100 },
  recovery: { low: 50, high: 60 },
  cooldown: { low: 45, high: 55 },
};

export const blockPresets: BlockPreset[] = [
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

export const workoutFolders: WorkoutFolder[] = [
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

export const quickWorkoutPresets: WorkoutPreset[] = quickWorkoutPresetIds.flatMap((presetId) => {
  const preset = allWorkoutPresets.find((entry) => entry.id === presetId);
  return preset ? [preset] : [];
});

export const getStartedTourSteps: TourStep[] = [
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

export const formLabelClass =
  "flex flex-col gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]";

export const formControlClass =
  "h-10 border border-[var(--line)] bg-white px-3 text-sm font-medium text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]";

export const stepControlButtonClass =
  "h-8 border border-[var(--line)] bg-white px-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--foreground)] transition hover:bg-[var(--surface)] disabled:cursor-not-allowed disabled:opacity-40";
