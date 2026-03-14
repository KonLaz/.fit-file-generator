import type { RefObject } from "react";

import type { WorkoutFolder, WorkoutPreset } from "@/features/workout-builder/types";

type WorkoutsModalProps = {
  isOpen: boolean;
  workoutsModalRef: RefObject<HTMLElement | null>;
  quickWorkoutPresets: WorkoutPreset[];
  workoutFolders: WorkoutFolder[];
  activeWorkoutFolder: WorkoutFolder | undefined;
  activeWorkoutFolderId: string;
  setActiveWorkoutFolderId: (id: string) => void;
  closeWorkoutsModal: () => void;
  selectWorkoutFromModal: (preset: WorkoutPreset) => void;
};

export function WorkoutsModal({
  isOpen,
  workoutsModalRef,
  quickWorkoutPresets,
  workoutFolders,
  activeWorkoutFolder,
  activeWorkoutFolderId,
  setActiveWorkoutFolderId,
  closeWorkoutsModal,
  selectWorkoutFromModal,
}: WorkoutsModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/45" onClick={closeWorkoutsModal} aria-hidden />
      <section
        ref={workoutsModalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Workouts folder"
        className="relative z-[90] w-full max-w-[880px] border-2 border-[var(--foreground)] bg-white p-5 shadow-[12px_12px_0_0_rgb(0_0_0_/_0.16)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
              Workouts
            </p>
            <h3 className="mt-1 text-lg font-bold uppercase tracking-[0.1em] text-[var(--foreground)]">
              Select a cycling workout
            </h3>
          </div>
          <button
            type="button"
            onClick={closeWorkoutsModal}
            className="h-9 border border-[var(--line)] bg-white px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--foreground)] transition hover:bg-[var(--surface)]"
          >
            Close
          </button>
        </div>

        <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
          Quick picks
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {quickWorkoutPresets.map((preset) => (
            <button
              key={`modal-quick-${preset.id}`}
              type="button"
              onClick={() => selectWorkoutFromModal(preset)}
              className="h-9 border border-[var(--foreground)] bg-[var(--surface)] px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--foreground)] transition hover:bg-white"
              title={preset.description}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
          <aside className="space-y-2">
            {workoutFolders.map((folder) => (
              <button
                key={`folder-tab-${folder.id}`}
                type="button"
                onClick={() => setActiveWorkoutFolderId(folder.id)}
                className={`w-full border px-3 py-2 text-left text-[10px] font-bold uppercase tracking-[0.12em] transition ${
                  folder.id === activeWorkoutFolderId
                    ? "border-[var(--foreground)] bg-[var(--accent)] text-white"
                    : "border-[var(--line)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-white"
                }`}
              >
                {folder.label}
              </button>
            ))}
          </aside>
          <div className="border border-[var(--line)] bg-[var(--surface)] p-3">
            {activeWorkoutFolder ? (
              <>
                <p className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">
                  {activeWorkoutFolder.label}
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">{activeWorkoutFolder.description}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {activeWorkoutFolder.workouts.map((preset) => (
                    <button
                      key={`modal-preset-${preset.id}`}
                      type="button"
                      onClick={() => selectWorkoutFromModal(preset)}
                      className="border border-[var(--line)] bg-white px-3 py-2 text-left transition hover:bg-[var(--surface)]"
                      title={preset.description}
                    >
                      <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">
                        {preset.label}
                      </span>
                      <span className="mt-1 block text-xs text-[var(--muted)]">
                        {preset.description}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
