import { formatDuration } from "@/lib/workout-model";

import { intensityBarClass, isValidFtp, labelForIntensity } from "@/features/workout-builder/logic";
import type { IssueMap, ProfileBlock, TickMark, WorkoutDraft } from "@/features/workout-builder/types";

type SummarySidebarProps = {
  workout: WorkoutDraft;
  profileBlocks: ProfileBlock[];
  timelineTicks: TickMark[];
  totalDuration: number;
  estimatedTss: number;
  ftpWatts: number;
  issueMap: IssueMap;
  exportMessage: string | null;
  exportError: string | null;
};

export function SummarySidebar({
  workout,
  profileBlocks,
  timelineTicks,
  totalDuration,
  estimatedTss,
  ftpWatts,
  issueMap,
  exportMessage,
  exportError,
}: SummarySidebarProps) {
  return (
    <aside className="space-y-4">
      <section className="swiss-reveal border-2 border-[var(--foreground)] bg-[var(--surface)] p-5 [animation-delay:120ms]">
        <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--foreground)]">
          Workout profile
        </h2>
        <div className="mt-4 border border-[var(--line)] bg-white p-3">
          <div className="h-36 border border-[var(--line)] bg-[linear-gradient(to_top,_transparent_49%,_rgb(15_23_42_/_0.05)_50%)] p-2">
            {workout.steps.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-[var(--muted)]">
                Add blocks to preview intensity and duration.
              </div>
            ) : (
              <div className="grid h-full grid-cols-[30px_minmax(0,1fr)] gap-2">
                <div className="flex h-full flex-col justify-between text-[10px] font-semibold text-[var(--muted)]">
                  <span>100%</span>
                  <span>50%</span>
                  <span>0%</span>
                </div>
                <div className="flex h-full items-end gap-1 border-l border-[var(--line)] pl-2">
                  {profileBlocks.map((block, index) => {
                    const ifPercent = Math.round(block.ifValue * 100);
                    const targetList = Array.from(new Set(block.targetSummaries));
                    const blockLabel =
                      block.stepCount === 1
                        ? block.primaryName
                        : `${block.primaryName} +${block.stepCount - 1} blocks`;

                    return (
                      <div
                        key={block.uiId}
                        className="group relative flex h-full min-w-0 items-end"
                        style={{ flexGrow: block.durationWeight }}
                        tabIndex={0}
                        aria-label={`${blockLabel}, ${ifPercent}% FTP, ${formatDuration(block.durationSec)}`}
                      >
                        <div
                          className={`w-full border border-white/70 ${intensityBarClass(block.intensity)}`}
                          style={{ height: `${block.heightPercent}%` }}
                        />
                        <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-64 -translate-x-1/2 border border-[var(--foreground)] bg-white p-2 text-[10px] text-[var(--foreground)] shadow-[4px_4px_0_0_rgb(0_0_0_/_0.1)] group-hover:block group-focus:block">
                          <p className="font-bold uppercase tracking-[0.1em]">{blockLabel}</p>
                          <p className="mt-1 text-[var(--muted)]">
                            Time {formatDuration(block.startSec)} - {formatDuration(block.endSec)}
                          </p>
                          <p className="text-[var(--muted)]">
                            Duration {formatDuration(block.durationSec)} · {ifPercent}% FTP
                          </p>
                          <p className="text-[var(--muted)]">
                            {labelForIntensity(block.intensity)}
                            {block.includesShortBursts ? " · includes short bursts" : ""}
                          </p>
                          <p className="mt-1 line-clamp-2 text-[var(--foreground)]">
                            {targetList.slice(0, 2).join(" · ")}
                            {targetList.length > 2 ? " …" : ""}
                          </p>
                          <p className="text-[var(--muted)]">Block {index + 1}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <div className="ml-[38px] mt-2 flex items-center justify-between border-t border-[var(--line)] pt-2 text-[10px] font-semibold text-[var(--muted)]">
            {timelineTicks.map((tick) => (
              <span key={`tick-${tick.ratio}`}>{tick.label}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="swiss-reveal border-2 border-[var(--foreground)] bg-[var(--surface)] p-5 [animation-delay:140ms]">
        <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--foreground)]">Summary</h2>
        <dl className="mt-4 space-y-3 text-sm text-[var(--foreground)]">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
            <dt>Sport</dt>
            <dd className="font-semibold uppercase">{workout.sport}</dd>
          </div>
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
            <dt>Total steps</dt>
            <dd className="font-semibold">{workout.steps.length}</dd>
          </div>
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
            <dt>FTP</dt>
            <dd className="font-semibold">{isValidFtp(ftpWatts) ? `${ftpWatts} W` : "-"}</dd>
          </div>
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
            <dt className="flex items-center gap-1">
              <span>Est. TSS</span>
              <span className="group relative inline-flex">
                <span
                  className="inline-flex h-4 w-4 items-center justify-center border border-[var(--line)] text-[10px] font-bold text-[var(--muted)]"
                  tabIndex={0}
                  aria-label="TSS estimation info"
                >
                  i
                </span>
                <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-64 -translate-x-1/2 border border-[var(--foreground)] bg-white px-2 py-1 text-[10px] leading-relaxed text-[var(--foreground)] opacity-0 shadow-[4px_4px_0_0_rgb(0_0_0_/_0.1)] transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                  Estimated with IF-based TSS approximation from power targets.
                </span>
              </span>
            </dt>
            <dd className="font-semibold">{Number.isFinite(estimatedTss) ? estimatedTss.toFixed(1) : "-"}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt>Total duration</dt>
            <dd className="font-semibold">{formatDuration(totalDuration)}</dd>
          </div>
        </dl>
        {issueMap.has("steps") ? (
          <p className="mt-3 text-xs text-[var(--danger-fg)]">{issueMap.get("steps")}</p>
        ) : null}
        {exportMessage ? (
          <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
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
  );
}
