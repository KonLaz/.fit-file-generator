"use client";

import { useState } from "react";

import { formatDuration, type Intensity } from "@/lib/workout-model";
import {
  formControlClass,
  formLabelClass,
  intensityOptions,
} from "@/features/workout-builder/constants";
import {
  labelForIntensity,
  numberInputValue,
  targetFromIntensity,
} from "@/features/workout-builder/logic";
import type {
  RepeatSetDraft,
  RepeatSetStepDraft,
} from "@/features/workout-builder/types";

type RepeatSetBuilderProps = {
  addRepeatSet: (repeatSet: RepeatSetDraft) => void;
};

type RepeatSetKey = "work" | "recovery";

const repeatCountPresets = [3, 4, 5, 6, 8];
const workDurationPresets = [30, 60, 120, 240, 300];
const recoveryDurationPresets = [30, 60, 120, 180, 300];

const durationChipClass =
  "h-8 border border-[var(--line)] bg-white px-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--foreground)] transition hover:bg-[var(--surface)]";

const repeatAdjustButtonClass =
  "inline-flex h-10 w-10 items-center justify-center border border-[var(--foreground)] bg-white text-lg font-bold text-[var(--foreground)] transition hover:bg-[var(--surface)] disabled:cursor-not-allowed disabled:opacity-40";

const defaultWorkStep: RepeatSetStepDraft = {
  name: "Work",
  durationSec: 240,
  intensity: "active",
  target: { type: "power_pct_ftp", low: 105, high: 120 },
};

const defaultRecoveryStep: RepeatSetStepDraft = {
  name: "Recovery",
  durationSec: 120,
  intensity: "recovery",
  target: { type: "power_pct_ftp", low: 50, high: 60 },
};

function clampRepeatCount(value: number): number {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.max(1, Math.trunc(value));
}

function parseDurationInput(rawValue: string): number | null {
  const trimmedValue = rawValue.trim();

  if (trimmedValue.length === 0) {
    return null;
  }

  if (/^\d+$/.test(trimmedValue)) {
    return Math.max(0, Math.trunc(Number(trimmedValue))) * 60;
  }

  const segments = trimmedValue.split(":");
  if (segments.length < 2 || segments.length > 3) {
    return null;
  }

  if (segments.some((segment) => !/^\d+$/.test(segment))) {
    return null;
  }

  const numericSegments = segments.map((segment) => Number(segment));

  if (numericSegments.some((segment) => !Number.isFinite(segment) || segment < 0)) {
    return null;
  }

  if (segments.length === 2) {
    const [minutes, seconds] = numericSegments;
    return minutes * 60 + seconds;
  }

  const [hours, minutes, seconds] = numericSegments;
  return hours * 3600 + minutes * 60 + seconds;
}

function normalizedDurationLabel(durationSec: number): string {
  const safeDuration = Number.isFinite(durationSec) ? Math.max(0, Math.trunc(durationSec)) : 0;
  return formatDuration(safeDuration);
}

export function RepeatSetBuilder({ addRepeatSet }: RepeatSetBuilderProps) {
  const [repeatSet, setRepeatSet] = useState<RepeatSetDraft>({
    repeats: 5,
    work: defaultWorkStep,
    recovery: defaultRecoveryStep,
  });
  const [durationInputs, setDurationInputs] = useState<Record<RepeatSetKey, string>>({
    work: normalizedDurationLabel(defaultWorkStep.durationSec),
    recovery: normalizedDurationLabel(defaultRecoveryStep.durationSec),
  });

  function updateRepeatStep(
    key: RepeatSetKey,
    update: (step: RepeatSetStepDraft) => RepeatSetStepDraft,
  ) {
    setRepeatSet((previous) => ({
      ...previous,
      [key]: update(previous[key]),
    }));
  }

  function setRepeatCount(nextRepeats: number) {
    setRepeatSet((previous) => ({
      ...previous,
      repeats: clampRepeatCount(nextRepeats),
    }));
  }

  function setStepDuration(key: RepeatSetKey, durationSec: number) {
    updateRepeatStep(key, (current) => ({
      ...current,
      durationSec,
    }));
    setDurationInputs((previous) => ({
      ...previous,
      [key]: normalizedDurationLabel(durationSec),
    }));
  }

  function handleDurationInputChange(key: RepeatSetKey, rawValue: string) {
    setDurationInputs((previous) => ({
      ...previous,
      [key]: rawValue,
    }));

    const parsedDuration = parseDurationInput(rawValue);
    if (parsedDuration === null) {
      return;
    }

    updateRepeatStep(key, (current) => ({
      ...current,
      durationSec: parsedDuration,
    }));
  }

  function handleDurationInputBlur(key: RepeatSetKey) {
    const parsedDuration = parseDurationInput(durationInputs[key]);
    const normalizedDuration =
      parsedDuration === null ? repeatSet[key].durationSec : parsedDuration;

    updateRepeatStep(key, (current) => ({
      ...current,
      durationSec: normalizedDuration,
    }));
    setDurationInputs((previous) => ({
      ...previous,
      [key]: normalizedDurationLabel(normalizedDuration),
    }));
  }

  function updateIntensity(key: RepeatSetKey, intensity: Intensity) {
    updateRepeatStep(key, (current) => ({
      ...current,
      intensity,
      target: targetFromIntensity(intensity),
    }));
  }

  function addLoopToWorkout() {
    const repeats = clampRepeatCount(repeatSet.repeats);
    const nextRepeatSet: RepeatSetDraft = {
      repeats,
      work: {
        ...repeatSet.work,
        name: repeatSet.work.name.trim() || "Work",
      },
      recovery: {
        ...repeatSet.recovery,
        name: repeatSet.recovery.name.trim() || "Recovery",
      },
    };

    addRepeatSet(nextRepeatSet);
    setRepeatSet(nextRepeatSet);
  }

  const totalLoopDurationSec =
    clampRepeatCount(repeatSet.repeats) *
    (Math.max(0, repeatSet.work.durationSec) + Math.max(0, repeatSet.recovery.durationSec));

  return (
    <section className="mt-5 border border-[var(--line)] bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            Loop builder
          </p>
          <h3 className="mt-1 text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">
            Two-step repeat set
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
            Build one work block and one recovery block, then repeat them. Use `4:00` or `0:30`
            format for durations.
          </p>
          <p className="mt-3 text-xs font-medium text-[var(--foreground)]">
            {clampRepeatCount(repeatSet.repeats)} repeats · {formatDuration(totalLoopDurationSec)} total
            block time · {clampRepeatCount(repeatSet.repeats) * 2} editable steps
          </p>
        </div>

        <div className="w-full max-w-[320px] border border-[var(--line)] bg-[var(--surface)] p-3">
          <label className={formLabelClass}>
            Repeats
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRepeatCount(repeatSet.repeats - 1)}
                disabled={clampRepeatCount(repeatSet.repeats) <= 1}
                className={repeatAdjustButtonClass}
                aria-label="Decrease repeats"
              >
                -
              </button>
              <input
                type="number"
                min={1}
                step={1}
                value={numberInputValue(repeatSet.repeats)}
                onChange={(event) => setRepeatCount(event.target.valueAsNumber)}
                className={`${formControlClass} h-10 text-center text-base`}
              />
              <button
                type="button"
                onClick={() => setRepeatCount(repeatSet.repeats + 1)}
                className={repeatAdjustButtonClass}
                aria-label="Increase repeats"
              >
                +
              </button>
            </div>
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            {repeatCountPresets.map((preset) => (
              <button
                key={`repeat-count-${preset}`}
                type="button"
                onClick={() => setRepeatCount(preset)}
                className={durationChipClass}
              >
                {preset}x
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {[
          {
            key: "work" as const,
            title: "Work block",
            description: "Main interval target",
            durationPresets: workDurationPresets,
          },
          {
            key: "recovery" as const,
            title: "Recovery block",
            description: "Easy spin between reps",
            durationPresets: recoveryDurationPresets,
          },
        ].map((section) => {
          const step = repeatSet[section.key];

          return (
            <div key={section.key} className="border border-[var(--line)] bg-[var(--surface)] p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">
                {section.title}
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">{section.description}</p>

              <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(180px,1fr)]">
                <label className={formLabelClass}>
                  Label
                  <input
                    value={step.name}
                    onChange={(event) =>
                      updateRepeatStep(section.key, (current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    className={`${formControlClass} h-11 normal-case tracking-normal`}
                    placeholder={section.title}
                  />
                </label>

                <label className={formLabelClass}>
                  Intensity
                  <select
                    value={step.intensity}
                    onChange={(event) => updateIntensity(section.key, event.target.value as Intensity)}
                    className={`${formControlClass} h-11 normal-case tracking-normal`}
                  >
                    {intensityOptions.map((option) => (
                      <option key={option} value={option}>
                        {labelForIntensity(option)}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="md:col-span-2">
                  <label className={formLabelClass}>
                    Duration
                    <input
                      type="text"
                      inputMode="numeric"
                      value={durationInputs[section.key]}
                      onChange={(event) =>
                        handleDurationInputChange(section.key, event.target.value)
                      }
                      onBlur={() => handleDurationInputBlur(section.key)}
                      className={`${formControlClass} h-11 normal-case tracking-normal`}
                      placeholder="4:00"
                    />
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {section.durationPresets.map((durationSec) => (
                      <button
                        key={`${section.key}-${durationSec}`}
                        type="button"
                        onClick={() => setStepDuration(section.key, durationSec)}
                        className={durationChipClass}
                      >
                        {formatDuration(durationSec)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className={formLabelClass}>
                  Low (% FTP)
                  <input
                    type="number"
                    min={1}
                    value={numberInputValue(step.target.low)}
                    onChange={(event) =>
                      updateRepeatStep(section.key, (current) => ({
                        ...current,
                        target: {
                          ...current.target,
                          low: event.target.valueAsNumber,
                        },
                      }))
                    }
                    className={`${formControlClass} h-11 normal-case tracking-normal`}
                  />
                </label>

                <label className={formLabelClass}>
                  High (% FTP)
                  <input
                    type="number"
                    min={1}
                    value={numberInputValue(step.target.high)}
                    onChange={(event) =>
                      updateRepeatStep(section.key, (current) => ({
                        ...current,
                        target: {
                          ...current.target,
                          high: event.target.valueAsNumber,
                        },
                      }))
                    }
                    className={`${formControlClass} h-11 normal-case tracking-normal`}
                  />
                </label>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--muted)]">
          Adds {clampRepeatCount(repeatSet.repeats) * 2} editable steps to the workout.
        </p>
        <button
          type="button"
          onClick={addLoopToWorkout}
          className="h-11 border-2 border-[var(--foreground)] bg-[var(--accent)] px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:brightness-95"
        >
          + Add loop
        </button>
      </div>
    </section>
  );
}
