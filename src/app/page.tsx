"use client";

import { useMemo, useState } from "react";

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

const targetTypeOptions: Target["type"][] = [
  "none",
  "power_pct_ftp",
  "power_watts",
  "hr_zone",
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

function defaultStep(uiId: string): StepDraft {
  return {
    uiId,
    name: "New interval",
    durationSec: 300,
    target: { type: "none" },
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

function targetSummary(target: Target): string {
  if (target.type === "none") {
    return "Free ride";
  }

  if (target.type === "hr_zone") {
    return `HR Z${target.zone}`;
  }

  const unit = target.type === "power_pct_ftp" ? "% FTP" : "W";
  return `${target.low}-${target.high} ${unit}`;
}

export default function Home() {
  const [workout, setWorkout] = useState<WorkoutDraft>(() =>
    toDraft(cloneWorkout(thresholdBuilderTemplate)),
  );
  const [nextStepId, setNextStepId] = useState(workout.steps.length + 1);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [validationState, setValidationState] = useState<"idle" | "valid" | "invalid">(
    "idle",
  );

  const workoutModel = useMemo(() => toWorkoutModel(workout), [workout]);
  const totalDuration = useMemo(() => totalDurationSec(workoutModel), [workoutModel]);

  const issueMap = useMemo(() => {
    const map = new Map<string, string>();
    issues.forEach((issue) => map.set(issue.path, issue.message));
    return map;
  }, [issues]);

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
    setWorkout((previous) => {
      const destination = direction === "up" ? index - 1 : index + 1;

      if (destination < 0 || destination >= previous.steps.length) {
        return previous;
      }

      const reordered = [...previous.steps];
      const [moved] = reordered.splice(index, 1);
      reordered.splice(destination, 0, moved);

      return { ...previous, steps: reordered };
    });
    setValidationState("idle");
  }

  function setTargetType(index: number, targetType: Target["type"]) {
    updateStep(index, (step) => {
      let nextTarget: Target = { type: "none" };

      if (targetType === "power_pct_ftp") {
        nextTarget = { type: "power_pct_ftp", low: 90, high: 100 };
      } else if (targetType === "power_watts") {
        nextTarget = { type: "power_watts", low: 220, high: 250 };
      } else if (targetType === "hr_zone") {
        nextTarget = { type: "hr_zone", zone: 3 };
      }

      return { ...step, target: nextTarget };
    });
  }

  function validateCurrentWorkout() {
    const nextIssues = validateWorkout(workoutModel);
    setIssues(nextIssues);
    setValidationState(nextIssues.length === 0 ? "valid" : "invalid");
  }

  function resetTemplate() {
    const nextWorkout = toDraft(cloneWorkout(thresholdBuilderTemplate));
    setWorkout(nextWorkout);
    setNextStepId(nextWorkout.steps.length + 1);
    setIssues([]);
    setValidationState("idle");
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f8fafc_0%,#fef3c7_45%,#dcfce7_100%)] px-4 py-8 text-slate-900 sm:px-6 lg:px-10">
      <main className="mx-auto w-full max-w-6xl">
        <header className="mb-6 rounded-2xl border border-amber-100 bg-white/80 p-6 shadow-sm backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">
            Phase 1
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Wahoo Workout Builder
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Build time-based interval workouts in the browser. This client model is
            intentionally stable so Phase 2 can add server-side FIT export without changing
            the UI contract.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <label className="flex w-full flex-col gap-1 text-sm font-medium text-slate-700">
                Workout name
                <input
                  value={workout.name}
                  onChange={(event) => setField("name", event.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  placeholder="Example: Threshold Builder"
                />
                {issueMap.has("name") ? (
                  <span className="text-xs text-red-700">{issueMap.get("name")}</span>
                ) : null}
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={resetTemplate}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={validateCurrentWorkout}
                  className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-teal-800"
                >
                  Validate
                </button>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {workout.steps.map((step, index) => (
                <article
                  key={step.uiId}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h2 className="text-sm font-semibold text-slate-800">Step {index + 1}</h2>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => moveStep(index, "up")}
                        disabled={index === 0}
                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        onClick={() => moveStep(index, "down")}
                        disabled={index === workout.steps.length - 1}
                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Down
                      </button>
                      <button
                        type="button"
                        onClick={() => removeStep(index)}
                        className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-4">
                    <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-slate-600 md:col-span-2">
                      Step name
                      <input
                        value={step.name}
                        onChange={(event) =>
                          updateStep(index, (current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal normal-case text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                      />
                      {issueMap.has(`steps.${index}.name`) ? (
                        <span className="text-xs normal-case tracking-normal text-red-700">
                          {issueMap.get(`steps.${index}.name`)}
                        </span>
                      ) : null}
                    </label>

                    <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-slate-600">
                      Duration (sec)
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={step.durationSec}
                        onChange={(event) =>
                          updateStep(index, (current) => ({
                            ...current,
                            durationSec: Number(event.target.value),
                          }))
                        }
                        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal normal-case text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                      />
                      {issueMap.has(`steps.${index}.durationSec`) ? (
                        <span className="text-xs normal-case tracking-normal text-red-700">
                          {issueMap.get(`steps.${index}.durationSec`)}
                        </span>
                      ) : null}
                    </label>

                    <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-slate-600">
                      Intensity
                      <select
                        value={step.intensity}
                        onChange={(event) =>
                          updateStep(index, (current) => ({
                            ...current,
                            intensity: event.target.value as Intensity,
                          }))
                        }
                        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal normal-case text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                      >
                        {intensityOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-4">
                    <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-slate-600 md:col-span-2">
                      Target type
                      <select
                        value={step.target.type}
                        onChange={(event) =>
                          setTargetType(index, event.target.value as Target["type"])
                        }
                        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal normal-case text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
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
                        <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-slate-600">
                          Low
                          <input
                            type="number"
                            min={1}
                            value={step.target.low}
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
                                    low: Number(event.target.value),
                                  },
                                };
                              })
                            }
                            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal normal-case text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                          />
                          {issueMap.has(`steps.${index}.target.low`) ? (
                            <span className="text-xs normal-case tracking-normal text-red-700">
                              {issueMap.get(`steps.${index}.target.low`)}
                            </span>
                          ) : null}
                        </label>
                        <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-slate-600">
                          High
                          <input
                            type="number"
                            min={1}
                            value={step.target.high}
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
                                    high: Number(event.target.value),
                                  },
                                };
                              })
                            }
                            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal normal-case text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                          />
                          {issueMap.has(`steps.${index}.target.high`) ? (
                            <span className="text-xs normal-case tracking-normal text-red-700">
                              {issueMap.get(`steps.${index}.target.high`)}
                            </span>
                          ) : null}
                        </label>
                      </>
                    ) : null}

                    {step.target.type === "hr_zone" ? (
                      <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-slate-600">
                        Zone
                        <input
                          type="number"
                          min={1}
                          max={5}
                          value={step.target.zone}
                          onChange={(event) =>
                            updateStep(index, (current) => {
                              if (current.target.type !== "hr_zone") {
                                return current;
                              }

                              return {
                                ...current,
                                target: {
                                  ...current.target,
                                  zone: Number(event.target.value) as 1 | 2 | 3 | 4 | 5,
                                },
                              };
                            })
                          }
                          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal normal-case text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                        />
                        {issueMap.has(`steps.${index}.target.zone`) ? (
                          <span className="text-xs normal-case tracking-normal text-red-700">
                            {issueMap.get(`steps.${index}.target.zone`)}
                          </span>
                        ) : null}
                      </label>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>

            <button
              type="button"
              onClick={addStep}
              className="mt-4 rounded-lg border border-dashed border-teal-300 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800 transition hover:bg-teal-100"
            >
              + Add Step
            </button>
          </section>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                Summary
              </h2>
              <dl className="mt-3 space-y-3 text-sm text-slate-700">
                <div className="flex items-center justify-between">
                  <dt>Sport</dt>
                  <dd className="font-semibold">Cycling</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Total steps</dt>
                  <dd className="font-semibold">{workout.steps.length}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Total duration</dt>
                  <dd className="font-semibold">{formatDuration(totalDuration)}</dd>
                </div>
              </dl>
              {issueMap.has("steps") ? (
                <p className="mt-3 text-xs text-red-700">{issueMap.get("steps")}</p>
              ) : null}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                Step targets
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {workout.steps.map((step, index) => (
                  <li key={`summary-${step.uiId}`} className="rounded-lg bg-slate-50 px-3 py-2">
                    <span className="font-medium">{index + 1}. </span>
                    <span>{step.name || "Untitled step"}</span>
                    <p className="text-xs text-slate-500">
                      {formatDuration(step.durationSec)} | {targetSummary(step.target)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                Validation status
              </h2>
              {validationState === "idle" ? (
                <p className="mt-2 text-sm text-slate-600">
                  Run validation after edits to confirm the workout is ready for Phase 2 export.
                </p>
              ) : null}
              {validationState === "valid" ? (
                <p className="mt-2 rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
                  Workout is valid and ready for server-side FIT export integration.
                </p>
              ) : null}
              {validationState === "invalid" ? (
                <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
                  Validation failed. Fix the highlighted fields.
                </p>
              ) : null}
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
