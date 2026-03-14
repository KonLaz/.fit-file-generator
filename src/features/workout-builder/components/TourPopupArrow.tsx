import type { TourPopupPlacement } from "@/features/workout-builder/types";

type TourPopupArrowProps = {
  placement: TourPopupPlacement;
};

export function TourPopupArrow({ placement }: TourPopupArrowProps) {
  if (placement === "floating") {
    return null;
  }

  if (placement === "right") {
    return (
      <>
        <span
          aria-hidden
          className="pointer-events-none absolute left-[-12px] top-1/2 -translate-y-1/2 border-y-[10px] border-r-[12px] border-y-transparent border-r-[var(--foreground)]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute left-[-10px] top-1/2 -translate-y-1/2 border-y-[9px] border-r-[11px] border-y-transparent border-r-white"
        />
      </>
    );
  }

  if (placement === "left") {
    return (
      <>
        <span
          aria-hidden
          className="pointer-events-none absolute right-[-12px] top-1/2 -translate-y-1/2 border-y-[10px] border-l-[12px] border-y-transparent border-l-[var(--foreground)]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute right-[-10px] top-1/2 -translate-y-1/2 border-y-[9px] border-l-[11px] border-y-transparent border-l-white"
        />
      </>
    );
  }

  if (placement === "top") {
    return (
      <>
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-[-12px] left-1/2 -translate-x-1/2 border-x-[10px] border-t-[12px] border-x-transparent border-t-[var(--foreground)]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-[-10px] left-1/2 -translate-x-1/2 border-x-[9px] border-t-[11px] border-x-transparent border-t-white"
        />
      </>
    );
  }

  return (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-12px] -translate-x-1/2 border-x-[10px] border-b-[12px] border-x-transparent border-b-[var(--foreground)]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-10px] -translate-x-1/2 border-x-[9px] border-b-[11px] border-x-transparent border-b-white"
      />
    </>
  );
}
