import type { RefObject } from "react";

import { TourPopupArrow } from "@/features/workout-builder/components/TourPopupArrow";
import type { TourPopupLayout, TourStep } from "@/features/workout-builder/types";

type GetStartedOverlayProps = {
  isWorkoutsModalOpen: boolean;
  isGetStartedOpen: boolean;
  activeGetStartedStep: TourStep | null;
  getStartedStepIndex: number;
  totalSteps: number;
  isLastGetStartedStep: boolean;
  tourPopupLayout: TourPopupLayout;
  popupTourRef: RefObject<HTMLElement | null>;
  setIsGetStartedOpen: (open: boolean) => void;
  nextGetStartedStep: () => void;
};

export function GetStartedOverlay({
  isWorkoutsModalOpen,
  isGetStartedOpen,
  activeGetStartedStep,
  getStartedStepIndex,
  totalSteps,
  isLastGetStartedStep,
  tourPopupLayout,
  popupTourRef,
  setIsGetStartedOpen,
  nextGetStartedStep,
}: GetStartedOverlayProps) {
  if (isWorkoutsModalOpen || !isGetStartedOpen || !activeGetStartedStep) {
    return null;
  }

  return (
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
          Step {getStartedStepIndex + 1} of {totalSteps}
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
  );
}
