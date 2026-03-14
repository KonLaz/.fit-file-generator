import type { DragEvent, RefObject } from "react";

import type { Intensity, Target } from "@/lib/workout-model";
import {
  blockPresets,
  formControlClass,
  formLabelClass,
  intensityOptions,
  stepControlButtonClass,
  targetTypeOptions,
} from "@/features/workout-builder/constants";
import {
  durationMinutesValue,
  durationSecondsValue,
  isValidFtp,
  labelForIntensity,
  labelForTargetType,
  numberInputValue,
  pctToWatts,
} from "@/features/workout-builder/logic";
import type { IssueMap, StepDraft, TourStepId, WorkoutDraft } from "@/features/workout-builder/types";

type EditorPanelProps = {
  workout: WorkoutDraft;
  ftpWatts: number;
  issueMap: IssueMap;
  isExporting: boolean;
  draggedStepIndex: number | null;
  dropTargetIndex: number | null;
  ftpTourRef: RefObject<HTMLLabelElement | null>;
  workoutsTourRef: RefObject<HTMLDivElement | null>;
  blocksTourRef: RefObject<HTMLDivElement | null>;
  customTourRef: RefObject<HTMLButtonElement | null>;
  isTourHighlightActive: (stepId: TourStepId) => boolean;
  setWorkoutName: (name: string) => void;
  setFtpValue: (value: number) => void;
  resetTemplate: () => void;
  exportWorkout: () => Promise<void>;
  openWorkoutsModal: () => void;
  addPresetBlock: (preset: (typeof blockPresets)[number]) => void;
  duplicateStep: (index: number) => void;
  moveStep: (index: number, direction: "up" | "down") => void;
  removeStep: (index: number) => void;
  updateStep: (index: number, update: (step: StepDraft) => StepDraft) => void;
  setStepIntensity: (index: number, intensity: Intensity) => void;
  setTargetType: (index: number, targetType: Target["type"]) => void;
  addStep: () => void;
  onStepDragStart: (index: number) => void;
  onStepDragEnd: () => void;
  onStepDragOver: (event: DragEvent<HTMLElement>, index: number) => void;
  onStepDrop: (event: DragEvent<HTMLElement>, index: number) => void;
};

export function EditorPanel({
  workout,
  ftpWatts,
  issueMap,
  isExporting,
  draggedStepIndex,
  dropTargetIndex,
  ftpTourRef,
  workoutsTourRef,
  blocksTourRef,
  customTourRef,
  isTourHighlightActive,
  setWorkoutName,
  setFtpValue,
  resetTemplate,
  exportWorkout,
  openWorkoutsModal,
  addPresetBlock,
  duplicateStep,
  moveStep,
  removeStep,
  updateStep,
  setStepIntensity,
  setTargetType,
  addStep,
  onStepDragStart,
  onStepDragEnd,
  onStepDragOver,
  onStepDrop,
}: EditorPanelProps) {
  return (
    <section className="swiss-reveal border-2 border-[var(--foreground)] bg-[var(--surface)] p-5 [animation-delay:80ms] sm:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid w-full gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
          <label className={`${formLabelClass} w-full`}>
            Workout name
            <input
              value={workout.name}
              onChange={(event) => setWorkoutName(event.target.value)}
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
                setFtpValue(event.target.valueAsNumber);
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
            isTourHighlightActive("workouts") ? "relative z-[60] ring-4 ring-[var(--accent-soft)]" : ""
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
            isTourHighlightActive("blocks") ? "relative z-[60] ring-4 ring-[var(--accent-soft)]" : ""
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
        <p className="text-xs font-medium text-[var(--muted)]">Drag any block card to reorder quickly.</p>
        {workout.steps.map((step, index) => (
          <article
            key={step.uiId}
            draggable
            onDragStart={() => {
              onStepDragStart(index);
            }}
            onDragEnd={onStepDragEnd}
            onDragOver={(event) => {
              onStepDragOver(event, index);
            }}
            onDrop={(event) => {
              onStepDrop(event, index);
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
                          durationSec: (safeMinutes + extraMinutes) * 60 + secondsRemainder,
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
                  onChange={(event) => setStepIntensity(index, event.target.value as Intensity)}
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
                  onChange={(event) => setTargetType(index, event.target.value as Target["type"])}
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
                        ? `Estimated target: ${pctToWatts(step.target.low, ftpWatts)}-${pctToWatts(step.target.high, ftpWatts)} W`
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
          isTourHighlightActive("custom") ? "relative z-[60] ring-4 ring-[var(--accent-soft)]" : ""
        }`}
      >
        + Add Step
      </button>
    </section>
  );
}
