"use client";

import Link from "next/link";
import { useState } from "react";

import { EditorPanel } from "@/features/workout-builder/components/EditorPanel";
import { GetHelpModal } from "@/features/workout-builder/components/GetHelpModal";
import { GetStartedOverlay } from "@/features/workout-builder/components/GetStartedOverlay";
import { SummarySidebar } from "@/features/workout-builder/components/SummarySidebar";
import { WorkoutsModal } from "@/features/workout-builder/components/WorkoutsModal";
import { useWorkoutBuilder } from "@/features/workout-builder/hooks/use-workout-builder";

export function WorkoutBuilderPage() {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const {
    workout,
    ftpWatts,
    issueMap,
    profileBlocks,
    timelineTicks,
    totalDuration,
    estimatedTss,
    isExporting,
    isWorkoutsModalOpen,
    activeWorkoutFolder,
    activeWorkoutFolderId,
    isGetStartedOpen,
    getStartedStepIndex,
    activeGetStartedStep,
    isLastGetStartedStep,
    tourPopupLayout,
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
    removeStep,
    updateStep,
    setStepIntensity,
    setTargetType,
    addStep,
    exportWorkout,
    resetTemplate,
    onStepDragStart,
    onStepDragEnd,
    onStepDragOver,
    onStepDrop,
    workoutFolders,
    quickWorkoutPresets,
    getStartedTourSteps,
  } = useWorkoutBuilder();

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-8 text-[var(--foreground)] sm:px-6 lg:px-10">
      <main className="mx-auto w-full max-w-[1200px] space-y-6">
        <header className="swiss-reveal relative overflow-hidden border-2 border-[var(--foreground)] bg-[var(--surface)] p-6 sm:p-8">
          <div aria-hidden className="absolute right-0 top-0 h-full w-3 bg-[var(--accent)]" />
          <div className="flex items-start justify-between gap-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--muted)]">
              FIT Workout Export
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setIsHelpOpen(true)}
                className="h-9 border border-[var(--foreground)] bg-white px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--foreground)] transition hover:bg-[var(--surface)]"
              >
                Get Help
              </button>
              <Link
                href="/feedback"
                className="inline-flex h-9 items-center justify-center border border-[var(--foreground)] bg-white px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--foreground)] transition hover:bg-[var(--surface)]"
              >
                Feedback
              </Link>
            </div>
          </div>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold leading-tight tracking-[-0.02em] text-[var(--foreground)] sm:text-5xl">
            Create Structured Workouts for Wahoo ELEMNT
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--muted)] sm:text-base">
            Set FTP - build intervals fast -  export a ready-to-sync `.fit` file.
          </p>
        </header>

        <section className="swiss-reveal border-2 border-[var(--foreground)] bg-[var(--surface)] p-5 [animation-delay:40ms] sm:p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
            About
          </p>
          <h2 className="mt-2 text-lg font-bold uppercase tracking-[0.08em] text-[var(--foreground)]">
            About the creator
          </h2>
          <p className="mt-2 max-w-4xl text-sm leading-relaxed text-[var(--foreground)]">
            Add your personal intro here: who you are, your coaching or riding background, and why
            you built this tool.
          </p>
          <p className="mt-1 max-w-4xl text-xs text-[var(--muted)]">
            Suggested: short bio, training philosophy, and links to your website/socials.
          </p>
        </section>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.75fr)_minmax(280px,1fr)]">
          <EditorPanel
            workout={workout}
            ftpWatts={ftpWatts}
            issueMap={issueMap}
            isExporting={isExporting}
            draggedStepIndex={draggedStepIndex}
            dropTargetIndex={dropTargetIndex}
            ftpTourRef={ftpTourRef}
            workoutsTourRef={workoutsTourRef}
            blocksTourRef={blocksTourRef}
            customTourRef={customTourRef}
            isTourHighlightActive={isTourHighlightActive}
            setWorkoutName={setWorkoutName}
            setFtpValue={setFtpValue}
            resetTemplate={resetTemplate}
            exportWorkout={exportWorkout}
            openWorkoutsModal={openWorkoutsModal}
            addPresetBlock={addPresetBlock}
            duplicateStep={duplicateStep}
            moveStep={moveStep}
            removeStep={removeStep}
            updateStep={updateStep}
            setStepIntensity={setStepIntensity}
            setTargetType={setTargetType}
            addStep={addStep}
            onStepDragStart={onStepDragStart}
            onStepDragEnd={onStepDragEnd}
            onStepDragOver={onStepDragOver}
            onStepDrop={onStepDrop}
          />

          <SummarySidebar
            workout={workout}
            profileBlocks={profileBlocks}
            timelineTicks={timelineTicks}
            totalDuration={totalDuration}
            estimatedTss={estimatedTss}
            ftpWatts={ftpWatts}
            issueMap={issueMap}
            exportMessage={exportMessage}
            exportError={exportError}
          />
        </div>
      </main>

      <WorkoutsModal
        isOpen={isWorkoutsModalOpen}
        workoutsModalRef={workoutsModalRef}
        quickWorkoutPresets={quickWorkoutPresets}
        workoutFolders={workoutFolders}
        activeWorkoutFolder={activeWorkoutFolder}
        activeWorkoutFolderId={activeWorkoutFolderId}
        setActiveWorkoutFolderId={setActiveWorkoutFolderId}
        closeWorkoutsModal={closeWorkoutsModal}
        selectWorkoutFromModal={selectWorkoutFromModal}
      />

      <GetHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      <GetStartedOverlay
        isWorkoutsModalOpen={isWorkoutsModalOpen}
        isGetStartedOpen={isGetStartedOpen}
        activeGetStartedStep={activeGetStartedStep}
        getStartedStepIndex={getStartedStepIndex}
        totalSteps={getStartedTourSteps.length}
        isLastGetStartedStep={isLastGetStartedStep}
        tourPopupLayout={tourPopupLayout}
        popupTourRef={popupTourRef}
        setIsGetStartedOpen={setIsGetStartedOpen}
        nextGetStartedStep={nextGetStartedStep}
      />
    </div>
  );
}

export default WorkoutBuilderPage;
