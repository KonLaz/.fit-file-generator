export type Sport = "cycling";

export type Intensity = "warmup" | "active" | "recovery" | "cooldown";

export type Target =
  | { type: "none" }
  | { type: "power_pct_ftp"; low: number; high: number }
  | { type: "power_watts"; low: number; high: number }
  | { type: "hr_zone"; zone: 1 | 2 | 3 | 4 | 5 };

export type WorkoutStep = {
  name: string;
  durationSec: number;
  target: Target;
  intensity: Intensity;
};

export type Workout = {
  name: string;
  sport: Sport;
  steps: WorkoutStep[];
};

export type ValidationIssue = {
  path: string;
  message: string;
};

const MAX_STEP_DURATION_SEC = 6 * 60 * 60;

export const thresholdBuilderTemplate: Workout = {
  name: "Threshold Builder",
  sport: "cycling",
  steps: [
    {
      name: "Warm up",
      durationSec: 600,
      target: { type: "power_pct_ftp", low: 50, high: 70 },
      intensity: "warmup",
    },
    {
      name: "Threshold effort 1",
      durationSec: 600,
      target: { type: "power_pct_ftp", low: 95, high: 100 },
      intensity: "active",
    },
    {
      name: "Recovery 1",
      durationSec: 300,
      target: { type: "power_pct_ftp", low: 50, high: 60 },
      intensity: "recovery",
    },
    {
      name: "Threshold effort 2",
      durationSec: 600,
      target: { type: "power_pct_ftp", low: 95, high: 100 },
      intensity: "active",
    },
    {
      name: "Cool down",
      durationSec: 600,
      target: { type: "power_pct_ftp", low: 45, high: 60 },
      intensity: "cooldown",
    },
  ],
};

export function cloneWorkout(workout: Workout): Workout {
  return {
    ...workout,
    steps: workout.steps.map((step) => ({
      ...step,
      target: cloneTarget(step.target),
    })),
  };
}

function cloneTarget(target: Target): Target {
  if (target.type === "none") {
    return { type: "none" };
  }

  if (target.type === "hr_zone") {
    return { type: "hr_zone", zone: target.zone };
  }

  return { type: target.type, low: target.low, high: target.high };
}

function isFiniteNumber(value: number): boolean {
  return Number.isFinite(value);
}

function isInteger(value: number): boolean {
  return Number.isInteger(value);
}

export function validateWorkout(workout: Workout): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!workout.name.trim()) {
    issues.push({ path: "name", message: "Workout name is required." });
  }

  if (workout.steps.length === 0) {
    issues.push({
      path: "steps",
      message: "Add at least one workout step.",
    });
  }

  workout.steps.forEach((step, index) => {
    if (!step.name.trim()) {
      issues.push({
        path: `steps.${index}.name`,
        message: "Step name is required.",
      });
    }

    if (!isFiniteNumber(step.durationSec) || !isInteger(step.durationSec)) {
      issues.push({
        path: `steps.${index}.durationSec`,
        message: "Duration must be a whole number of seconds.",
      });
    } else if (step.durationSec <= 0 || step.durationSec > MAX_STEP_DURATION_SEC) {
      issues.push({
        path: `steps.${index}.durationSec`,
        message: "Duration must be between 1 and 21600 seconds.",
      });
    }

    if (step.target.type === "power_pct_ftp" || step.target.type === "power_watts") {
      const lowPath = `steps.${index}.target.low`;
      const highPath = `steps.${index}.target.high`;

      if (!isFiniteNumber(step.target.low) || step.target.low <= 0) {
        issues.push({
          path: lowPath,
          message: "Lower target must be a positive number.",
        });
      }

      if (!isFiniteNumber(step.target.high) || step.target.high <= 0) {
        issues.push({
          path: highPath,
          message: "Upper target must be a positive number.",
        });
      }

      if (
        isFiniteNumber(step.target.low) &&
        isFiniteNumber(step.target.high) &&
        step.target.low > step.target.high
      ) {
        issues.push({
          path: highPath,
          message: "Upper target must be greater than or equal to lower target.",
        });
      }
    }

    if (step.target.type === "hr_zone") {
      if (!isInteger(step.target.zone) || step.target.zone < 1 || step.target.zone > 5) {
        issues.push({
          path: `steps.${index}.target.zone`,
          message: "Heart rate zone must be between 1 and 5.",
        });
      }
    }
  });

  return issues;
}

export function totalDurationSec(workout: Workout): number {
  return workout.steps.reduce((sum, step) => sum + step.durationSec, 0);
}

export function formatDuration(totalSec: number): string {
  if (!Number.isFinite(totalSec) || totalSec < 0) {
    return "00:00";
  }

  const totalWholeSeconds = Math.floor(totalSec);
  const hours = Math.floor(totalWholeSeconds / 3600);
  const minutes = Math.floor((totalWholeSeconds % 3600) / 60);
  const seconds = totalWholeSeconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}
