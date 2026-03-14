import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DragEvent } from "react";

import {
  formatDuration,
  type Intensity,
  type Target,
  thresholdBuilderTemplate,
  totalDurationSec,
  type ValidationIssue,
  validateWorkout,
} from "@/lib/workout-model";
import {
  blockPresets,
  getStartedTourSteps,
  quickWorkoutPresets,
  workoutFolders,
} from "@/features/workout-builder/constants";
import {
  buildDraftFromWorkout,
  buildProfileBlocks,
  clamp,
  cloneStep,
  defaultStep,
  estimateWorkoutTss,
  fileNameFromDisposition,
  isValidFtp,
  mapWorkoutForExport,
  targetFromIntensity,
  toWorkoutModel,
} from "@/features/workout-builder/logic";
import type {
  ApiErrorResponse,
  BlockPreset,
  IssueMap,
  StepDraft,
  TickMark,
  TourPopupLayout,
  TourStepId,
  WorkoutPreset,
  WorkoutDraft,
} from "@/features/workout-builder/types";

export function useWorkoutBuilder() {
  const [workout, setWorkout] = useState<WorkoutDraft>(() =>
    buildDraftFromWorkout(thresholdBuilderTemplate),
  );
  const [nextStepId, setNextStepId] = useState(workout.steps.length + 1);
  const [ftpWatts, setFtpWatts] = useState(250);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
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

  const issueMap = useMemo<IssueMap>(() => {
    const map = new Map<string, string>();
    issues.forEach((issue) => map.set(issue.path, issue.message));
    return map;
  }, [issues]);

  const profileBlocks = useMemo(
    () => buildProfileBlocks(workoutModel, ftpWatts),
    [workoutModel, ftpWatts],
  );

  const timelineTicks = useMemo<TickMark[]>(() => {
    const total = Number.isFinite(totalDuration) && totalDuration > 0 ? totalDuration : 0;

    return [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
      ratio,
      label: formatDuration(total * ratio),
    }));
  }, [totalDuration]);

  const activeWorkoutFolder =
    workoutFolders.find((folder) => folder.id === activeWorkoutFolderId) ?? workoutFolders[0];

  const activeGetStartedStep = isGetStartedOpen ? getStartedTourSteps[getStartedStepIndex] : null;
  const isLastGetStartedStep = getStartedStepIndex >= getStartedTourSteps.length - 1;

  const closeWorkoutsModal = useCallback(() => {
    setIsWorkoutsModalOpen(false);
  }, []);

  const isTourHighlightActive = useCallback(
    (stepId: TourStepId): boolean => isGetStartedOpen && activeGetStartedStep?.id === stepId,
    [activeGetStartedStep, isGetStartedOpen],
  );

  const nextGetStartedStep = useCallback(() => {
    if (isLastGetStartedStep) {
      setIsGetStartedOpen(false);
      return;
    }

    setGetStartedStepIndex((previous) => previous + 1);
  }, [isLastGetStartedStep]);

  const getTourTargetElement = useCallback(
    (stepId: TourStepId): HTMLElement | null => {
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
    },
    [],
  );

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

      let placement: TourPopupLayout["placement"] = "right";

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
  }, [activeGetStartedStep, getStartedStepIndex, getTourTargetElement, isGetStartedOpen]);

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
  }, [closeWorkoutsModal, isWorkoutsModalOpen]);

  const setWorkoutName = useCallback((name: string) => {
    setWorkout((previous) => ({ ...previous, name }));
  }, []);

  const setFtpValue = useCallback((value: number) => {
    setFtpWatts(value);
    setExportError(null);
    setExportMessage(null);
  }, []);

  const updateStep = useCallback((index: number, update: (step: StepDraft) => StepDraft) => {
    setWorkout((previous) => ({
      ...previous,
      steps: previous.steps.map((step, stepIndex) => (stepIndex === index ? update(step) : step)),
    }));
  }, []);

  const addPresetBlock = useCallback(
    (preset: BlockPreset) => {
      const step: StepDraft = {
        ...cloneStep(preset.step),
        uiId: `step-${nextStepId}`,
      };

      setWorkout((previous) => ({ ...previous, steps: [...previous.steps, step] }));
      setNextStepId((previous) => previous + 1);
    },
    [nextStepId],
  );

  const duplicateStep = useCallback(
    (index: number) => {
      setWorkout((previous) => {
        const source = previous.steps[index];
        if (!source) {
          return previous;
        }

        const duplicated: StepDraft = {
          ...cloneStep(source),
          uiId: `step-${nextStepId}`,
          name: `${source.name} copy`,
        };

        const nextSteps = [...previous.steps];
        nextSteps.splice(index + 1, 0, duplicated);

        return {
          ...previous,
          steps: nextSteps,
        };
      });

      setNextStepId((previous) => previous + 1);
    },
    [nextStepId],
  );

  const addStep = useCallback(() => {
    const step = defaultStep(`step-${nextStepId}`);
    setWorkout((previous) => ({ ...previous, steps: [...previous.steps, step] }));
    setNextStepId((previous) => previous + 1);
  }, [nextStepId]);

  const removeStep = useCallback((index: number) => {
    setWorkout((previous) => ({
      ...previous,
      steps: previous.steps.filter((_step, stepIndex) => stepIndex !== index),
    }));
  }, []);

  const moveStepToIndex = useCallback((sourceIndex: number, destinationIndex: number) => {
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
  }, []);

  const moveStep = useCallback(
    (index: number, direction: "up" | "down") => {
      moveStepToIndex(index, direction === "up" ? index - 1 : index + 1);
    },
    [moveStepToIndex],
  );

  const setTargetType = useCallback(
    (index: number, targetType: Target["type"]) => {
      updateStep(index, (step) => {
        let nextTarget: Target = { type: "none" };

        if (targetType === "power_pct_ftp") {
          nextTarget = targetFromIntensity(step.intensity);
        }

        return { ...step, target: nextTarget };
      });
    },
    [updateStep],
  );

  const applyWorkoutPreset = useCallback((preset: WorkoutPreset) => {
    const nextWorkout = buildDraftFromWorkout(preset.workout, preset.label);
    setWorkout(nextWorkout);
    setNextStepId(nextWorkout.steps.length + 1);
    setIssues([]);
    setDraggedStepIndex(null);
    setDropTargetIndex(null);
    setExportError(null);
    setExportMessage(null);
  }, []);

  const openWorkoutsModal = useCallback(() => {
    setIsWorkoutsModalOpen(true);
  }, []);

  const selectWorkoutFromModal = useCallback(
    (preset: WorkoutPreset) => {
      applyWorkoutPreset(preset);
      closeWorkoutsModal();
    },
    [applyWorkoutPreset, closeWorkoutsModal],
  );

  const exportWorkout = useCallback(async () => {
    if (!isValidFtp(ftpWatts)) {
      setExportError("Enter a valid FTP in watts before exporting.");
      setExportMessage(null);
      return;
    }

    const nextIssues = validateWorkout(workoutModel);
    setIssues(nextIssues);

    if (nextIssues.length > 0) {
      setExportError("Cannot export yet. Fix the highlighted validation issues first.");
      setExportMessage(null);
      return;
    }

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
          // Keep fallback message when JSON parsing fails.
        }

        throw new Error(errorMessage);
      }

      const fileBlob = await response.blob();
      const fileName = fileNameFromDisposition(response.headers.get("content-disposition"));
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
  }, [ftpWatts, workoutModel]);

  const resetTemplate = useCallback(() => {
    const nextWorkout = buildDraftFromWorkout(thresholdBuilderTemplate);
    setWorkout(nextWorkout);
    setNextStepId(nextWorkout.steps.length + 1);
    setIssues([]);
    setDraggedStepIndex(null);
    setDropTargetIndex(null);
    setExportError(null);
    setExportMessage(null);
  }, []);

  const onStepDragStart = useCallback((index: number) => {
    setDraggedStepIndex(index);
    setDropTargetIndex(index);
  }, []);

  const onStepDragEnd = useCallback(() => {
    setDraggedStepIndex(null);
    setDropTargetIndex(null);
  }, []);

  const onStepDragOver = useCallback((event: DragEvent<HTMLElement>, index: number) => {
    event.preventDefault();
    setDropTargetIndex(index);
  }, []);

  const onStepDrop = useCallback(
    (event: DragEvent<HTMLElement>, index: number) => {
      event.preventDefault();
      if (draggedStepIndex !== null) {
        moveStepToIndex(draggedStepIndex, index);
      }
      setDraggedStepIndex(null);
      setDropTargetIndex(null);
    },
    [draggedStepIndex, moveStepToIndex],
  );

  const setStepIntensity = useCallback(
    (index: number, nextIntensity: Intensity) => {
      updateStep(index, (current) => {
        let nextTarget = current.target;

        if (current.target.type === "none" || current.target.type === "power_pct_ftp") {
          nextTarget = targetFromIntensity(nextIntensity);
        }

        return {
          ...current,
          intensity: nextIntensity,
          target: nextTarget,
        };
      });
    },
    [updateStep],
  );

  return {
    workout,
    workoutModel,
    ftpWatts,
    issues,
    issueMap,
    profileBlocks,
    timelineTicks,
    totalDuration,
    estimatedTss,
    isWorkoutsModalOpen,
    activeWorkoutFolder,
    activeWorkoutFolderId,
    isGetStartedOpen,
    getStartedStepIndex,
    activeGetStartedStep,
    isLastGetStartedStep,
    tourPopupLayout,
    isExporting,
    exportMessage,
    exportError,
    draggedStepIndex,
    dropTargetIndex,
    ftpTourRef,
    workoutsTourRef,
    blocksTourRef,
    customTourRef,
    popupTourRef,
    workoutsModalRef,
    isTourHighlightActive,
    nextGetStartedStep,
    setIsGetStartedOpen,
    setWorkoutName,
    setFtpValue,
    setActiveWorkoutFolderId,
    openWorkoutsModal,
    closeWorkoutsModal,
    selectWorkoutFromModal,
    addPresetBlock,
    duplicateStep,
    moveStep,
    moveStepToIndex,
    removeStep,
    addStep,
    setTargetType,
    updateStep,
    exportWorkout,
    resetTemplate,
    onStepDragStart,
    onStepDragEnd,
    onStepDragOver,
    onStepDrop,
    setStepIntensity,
    blockPresets,
    workoutFolders,
    quickWorkoutPresets,
    getStartedTourSteps,
  };
}
