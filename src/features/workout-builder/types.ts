import type { Intensity, Target, Workout, WorkoutStep } from "@/lib/workout-model";
import type { RefObject } from "react";

export type StepDraft = WorkoutStep & { uiId: string };

export type WorkoutDraft = Omit<Workout, "steps"> & {
  steps: StepDraft[];
};

export type PowerRange = {
  low: number;
  high: number;
};

export type WorkoutPreset = {
  id: string;
  label: string;
  description: string;
  workout: Workout;
};

export type WorkoutFolder = {
  id: string;
  label: string;
  description: string;
  workouts: WorkoutPreset[];
};

export type BlockPreset = {
  id: string;
  label: string;
  step: WorkoutStep;
};

export type TourStepId = "ftp" | "workouts" | "blocks" | "custom";

export type TourStep = {
  id: TourStepId;
  title: string;
  description: string;
};

export type TourPopupPlacement = "right" | "left" | "top" | "bottom" | "floating";

export type TourPopupLayout = {
  top: number;
  left: number;
  placement: TourPopupPlacement;
};

export type ProfileBlock = {
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

export type ApiErrorResponse = {
  error?: string;
};

export type IssueMap = Map<string, string>;

export type TickMark = {
  ratio: number;
  label: string;
};

export type TourRefs = {
  ftpTourRef: RefObject<HTMLLabelElement | null>;
  workoutsTourRef: RefObject<HTMLDivElement | null>;
  blocksTourRef: RefObject<HTMLDivElement | null>;
  customTourRef: RefObject<HTMLButtonElement | null>;
  popupTourRef: RefObject<HTMLElement | null>;
  workoutsModalRef: RefObject<HTMLElement | null>;
};

export type StepDragState = {
  draggedStepIndex: number | null;
  dropTargetIndex: number | null;
};

export type StepInputChange = {
  stepIndex: number;
  value: number;
};

export type StepReorderDirection = "up" | "down";

export type StepUpdateTarget = Target["type"];
