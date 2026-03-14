type GetHelpModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function GetHelpModal({ isOpen, onClose }: GetHelpModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} aria-hidden />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="How to import FIT files"
        className="relative z-[100] w-full max-w-[920px] border-2 border-[var(--foreground)] bg-white p-5 shadow-[12px_12px_0_0_rgb(0_0_0_/_0.16)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
              Get Help
            </p>
            <h2 className="mt-1 text-lg font-bold uppercase tracking-[0.1em] text-[var(--foreground)]">
              Import your .fit file into Wahoo or Garmin
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 border border-[var(--line)] bg-white px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--foreground)] transition hover:bg-[var(--surface)]"
          >
            Close
          </button>
        </div>

        <section className="mt-4 border border-[var(--line)] bg-[var(--surface)] p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
            Quick flow
          </p>
          <p className="mt-1 text-sm text-[var(--foreground)]">
            1) Export `.fit` here, 2) connect your device by USB, 3) copy to the device folder,
            4) safely eject and sync/restart.
          </p>
        </section>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <section className="border border-[var(--line)] bg-[var(--surface)] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
              Device family
            </p>
            <h3 className="mt-1 text-sm font-bold uppercase tracking-[0.14em] text-[var(--foreground)]">
              Wahoo (ELEMNT ecosystem)
            </h3>
            <p className="mt-2 text-sm text-[var(--foreground)]">
              Wahoo devices use planned workout files from the `plans` folder.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href="https://www.wahoofitness.com/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 items-center justify-center border border-[var(--foreground)] bg-white px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--foreground)] transition hover:bg-[var(--surface)]"
              >
                Official Site
              </a>
              <a
                href="https://support.wahoofitness.com/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 items-center justify-center border border-[var(--foreground)] bg-white px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--foreground)] transition hover:bg-[var(--surface)]"
              >
                Support Center
              </a>
            </div>
            <div className="mt-3 space-y-3 text-sm text-[var(--foreground)]">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">
                  macOS
                </p>
                <p className="mt-1">
                  If the device does not appear in Finder, use an MTP transfer tool (Android File
                  Transfer or OpenMTP), then copy `.fit` into `plans`.
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">
                  Windows
                </p>
                <p className="mt-1">
                  Open File Explorer, browse to device storage, open `plans`, copy the file, then
                  safely eject.
                </p>
              </div>
            </div>
          </section>

          <section className="border border-[var(--line)] bg-[var(--surface)] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
              Device family
            </p>
            <h3 className="mt-1 text-sm font-bold uppercase tracking-[0.14em] text-[var(--foreground)]">
              Garmin (Edge and related devices)
            </h3>
            <p className="mt-2 text-sm text-[var(--foreground)]">
              Garmin commonly imports workouts from `Garmin/NewFiles`.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href="https://www.garmin.com/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 items-center justify-center border border-[var(--foreground)] bg-white px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--foreground)] transition hover:bg-[var(--surface)]"
              >
                Official Site
              </a>
              <a
                href="https://support.garmin.com/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 items-center justify-center border border-[var(--foreground)] bg-white px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--foreground)] transition hover:bg-[var(--surface)]"
              >
                Support Center
              </a>
            </div>
            <div className="mt-3 space-y-3 text-sm text-[var(--foreground)]">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">
                  macOS
                </p>
                <p className="mt-1">
                  If storage is not visible in Finder, use Android File Transfer or OpenMTP, then
                  copy `.fit` into `Garmin/NewFiles`.
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">
                  Windows
                </p>
                <p className="mt-1">
                  In File Explorer, open the Garmin drive/device, paste the `.fit` file into
                  `Garmin/NewFiles`, then eject safely.
                </p>
              </div>
            </div>
          </section>
        </div>

        <p className="mt-4 text-xs text-[var(--muted)]">
          Note: folder names can vary by device model/firmware. If import fails, reconnect and
          verify the destination folder on your specific device.
        </p>
      </section>
    </div>
  );
}
