"use client";

import { EditorPanel } from "@/features/workout-builder/components/EditorPanel";
import { GetStartedOverlay } from "@/features/workout-builder/components/GetStartedOverlay";
import { SummarySidebar } from "@/features/workout-builder/components/SummarySidebar";
import { WorkoutsModal } from "@/features/workout-builder/components/WorkoutsModal";
import { useWorkoutBuilder } from "@/features/workout-builder/hooks/use-workout-builder";

export function WorkoutBuilderPage() {
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
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--muted)]">
            FIT Workout Export
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold leading-tight tracking-[-0.02em] text-[var(--foreground)] sm:text-5xl">
            Create Structured Workouts for Wahoo ELEMNT
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--muted)] sm:text-base">
            Enter your FTP once, build time-based intervals, and export a `.fit` workout you can
            copy to your device&apos;s `plans` folder over USB.
          </p>
        </header>

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
