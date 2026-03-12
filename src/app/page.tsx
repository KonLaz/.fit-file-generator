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
    toDraft(cloneWorkout(thresholdBuilderTemplate)),
  );
  const [nextStepId, setNextStepId] = useState(workout.steps.length + 1);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [validationState, setValidationState] = useState<"idle" | "valid" | "invalid">(
    "idle",
  );
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

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

  async function exportWorkout() {
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
      const response = await fetch("/api/export-fit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(workoutModel),
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
    const nextWorkout = toDraft(cloneWorkout(thresholdBuilderTemplate));
    setWorkout(nextWorkout);
    setNextStepId(nextWorkout.steps.length + 1);
    setIssues([]);
    setValidationState("idle");
    setExportError(null);
    setExportMessage(null);
  }

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-8 text-[var(--foreground)] sm:px-6 lg:px-10">
      <main className="mx-auto w-full max-w-[1200px] space-y-6">
        <header className="swiss-reveal relative overflow-hidden border-2 border-[var(--foreground)] bg-[var(--surface)] p-6 sm:p-8">
          <div aria-hidden className="absolute right-0 top-0 h-full w-3 bg-[var(--accent)]" />
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--muted)]">
            Phase 1
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold leading-tight tracking-[-0.02em] text-[var(--foreground)] sm:text-5xl">
            Wahoo Workout Builder
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--muted)] sm:text-base">
            Build time-based interval workouts in the browser. This client model is
            intentionally stable so Phase 2 can add server-side FIT export without changing
            the UI contract.
          </p>
        </header>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.75fr)_minmax(280px,1fr)]">
          <section className="swiss-reveal border-2 border-[var(--foreground)] bg-[var(--surface)] p-5 [animation-delay:80ms] sm:p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <label className={`${formLabelClass} w-full`}>
                Workout name
                <input
                  value={workout.name}
                  onChange={(event) => setField("name", event.target.value)}
                  className={`${formControlClass} h-11`}
                  placeholder="Example: Threshold Builder"
                />
                {issueMap.has("name") ? (
                  <span className="text-xs normal-case tracking-normal text-[var(--danger-fg)]">
                    {issueMap.get("name")}
                  </span>
                ) : null}
              </label>
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
                  onClick={validateCurrentWorkout}
                  className="h-11 border-2 border-[var(--foreground)] bg-[var(--accent)] px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:brightness-95"
                >
                  Validate
                </button>
                <button
                  type="button"
                  onClick={exportWorkout}
                  disabled={isExporting}
                  className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isExporting ? "Exporting..." : "Export .FIT"}
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {workout.steps.map((step, index) => (
                <article
                  key={step.uiId}
                  className="border border-[var(--line)] border-l-4 border-l-[var(--accent)] bg-white p-4 shadow-[6px_6px_0_0_rgb(0_0_0_/_0.06)]"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--foreground)]">
                      Step {index + 1}
                    </h2>
                    <div className="flex items-center gap-2">
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
                        className={`${formControlClass} normal-case tracking-normal`}
                      />
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
                          updateStep(index, (current) => ({
                            ...current,
                            intensity: event.target.value as Intensity,
                          }))
                        }
                        className={`${formControlClass} normal-case tracking-normal`}
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
                            className={`${formControlClass} normal-case tracking-normal`}
                          />
                          {issueMap.has(`steps.${index}.target.low`) ? (
                            <span className="text-xs normal-case tracking-normal text-[var(--danger-fg)]">
                              {issueMap.get(`steps.${index}.target.low`)}
                            </span>
                          ) : null}
                        </label>
                        <label className={formLabelClass}>
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
                            className={`${formControlClass} normal-case tracking-normal`}
                          />
                          {issueMap.has(`steps.${index}.target.high`) ? (
                            <span className="text-xs normal-case tracking-normal text-[var(--danger-fg)]">
                              {issueMap.get(`steps.${index}.target.high`)}
                            </span>
                          ) : null}
                        </label>
                      </>
                    ) : null}

                    {step.target.type === "hr_zone" ? (
                      <label className={formLabelClass}>
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
                          className={`${formControlClass} normal-case tracking-normal`}
                        />
                        {issueMap.has(`steps.${index}.target.zone`) ? (
                          <span className="text-xs normal-case tracking-normal text-[var(--danger-fg)]">
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
              className="mt-5 h-11 border-2 border-dashed border-[var(--foreground)] bg-white px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--foreground)] transition hover:bg-[var(--surface)]"
            >
              + Add Step
            </button>
          </section>

          <aside className="space-y-4">
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
                <div className="flex items-center justify-between">
                  <dt>Total duration</dt>
                  <dd className="font-semibold">{formatDuration(totalDuration)}</dd>
                </div>
              </dl>
              {issueMap.has("steps") ? (
                <p className="mt-3 text-xs text-[var(--danger-fg)]">{issueMap.get("steps")}</p>
              ) : null}
            </section>

            <section className="swiss-reveal border-2 border-[var(--foreground)] bg-[var(--surface)] p-5 [animation-delay:200ms]">
              <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--foreground)]">
                Step targets
              </h2>
              <ul className="mt-4 space-y-2 text-sm text-[var(--foreground)]">
                {workout.steps.map((step, index) => (
                  <li
                    key={`summary-${step.uiId}`}
                    className="border border-[var(--line)] bg-white px-3 py-2"
                  >
                    <span className="font-medium">{index + 1}. </span>
                    <span>{step.name || "Untitled step"}</span>
                    <p className="text-xs text-[var(--muted)]">
                      {formatDuration(step.durationSec)} · {targetSummary(step.target)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            <section className="swiss-reveal border-2 border-[var(--foreground)] bg-[var(--surface)] p-5 [animation-delay:260ms]">
              <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--foreground)]">
                Validation status
              </h2>
              {validationState === "idle" ? (
                <p className="mt-3 text-sm text-[var(--muted)]">
                  Run validation after edits to confirm the workout is ready for Phase 2 export.
                </p>
              ) : null}
              {validationState === "valid" ? (
                <p className="mt-3 border border-[var(--success-fg)] bg-[var(--success-bg)] px-3 py-2 text-sm font-semibold text-[var(--success-fg)]">
                  Workout is valid and ready for server-side FIT export integration.
                </p>
              ) : null}
              {validationState === "invalid" ? (
                <p className="mt-3 border border-[var(--danger-fg)] bg-[var(--danger-bg)] px-3 py-2 text-sm font-semibold text-[var(--danger-fg)]">
                  Validation failed. Fix the highlighted fields.
                </p>
              ) : null}
              {exportMessage ? (
                <p className="mt-2 rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
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
    </div>
  );
}
