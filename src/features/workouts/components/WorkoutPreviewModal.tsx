import { useEffect, useRef } from "react";
import { X, Play, Clock, Repeat, Flame, Wind, Coffee, Hourglass } from "lucide-react";
import { formatDuration } from "@/lib/format";
import { buildPhases, getTotalSeconds } from "@/features/timer/engine";
import { unlockAudio } from "@/lib/audio";
import type { Workout } from "../types";

export function WorkoutPreviewModal({
  workout,
  open,
  onClose,
  onStart,
}: {
  workout: Workout | null;
  open: boolean;
  onClose: () => void;
  onStart: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && workout) {
      if (!dialog.open) {
        dialog.showModal();
        document.body.style.overflow = "hidden";
      }
    } else {
      if (dialog.open) {
        dialog.close();
        document.body.style.overflow = "";
      }
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open, workout]);

  if (!workout) return null;

  const phases = buildPhases(workout);
  const total = getTotalSeconds(workout);

  const handleCancelEvent = (e: React.SyntheticEvent<HTMLDialogElement>) => {
    e.preventDefault();
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onCancel={handleCancelEvent}
      onClick={handleBackdropClick}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-line bg-surface-2 p-5 text-fg shadow-2xl backdrop:bg-[var(--overlay)] outline-none max-h-[85vh] flex flex-col"
    >
      <div className="flex items-start justify-between pb-4 border-b border-line">
        <div>
          <h2 className="text-xl font-bold">{workout.name}</h2>
          <div className="mt-1.5 flex items-center gap-3 text-sm text-muted">
            <span className="inline-flex items-center gap-1">
              <Repeat className="size-4" aria-hidden />
              {workout.rounds} rounds
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-4" aria-hidden />
              {formatDuration(total)} total
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close preview"
          className="size-9 rounded-full bg-surface-3 flex items-center justify-center text-muted hover:text-fg transition-transform active:scale-95"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="my-4 flex-1 overflow-y-auto space-y-2.5 pr-1">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
          Timeline ({phases.length} phases)
        </h3>
        {phases.map((phase, idx) => {
          const isWork = phase.type === "work";
          const isPrepare = phase.type === "prepare";
          const isRoundRest = phase.type === "round-rest";

          return (
            <div
              key={idx}
              className="flex items-center justify-between rounded-xl border border-line bg-surface p-3 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-full text-on-color ${
                    isPrepare
                      ? "bg-prepare"
                      : isWork
                      ? "bg-work"
                      : isRoundRest
                      ? "bg-break"
                      : "bg-rest"
                  }`}
                >
                  {isPrepare ? (
                    <Hourglass className="size-4" aria-hidden />
                  ) : isWork ? (
                    <Flame className="size-4" aria-hidden />
                  ) : isRoundRest ? (
                    <Coffee className="size-4" aria-hidden />
                  ) : (
                    <Wind className="size-4" aria-hidden />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-sm">{phase.label}</p>
                  <p className="text-xs text-muted">
                    {phase.round > 0 ? `Round ${phase.round}` : "Countdown"}
                  </p>
                </div>
              </div>
              <span className="font-semibold tabular-nums text-sm shrink-0">
                {formatDuration(phase.duration)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="pt-4 border-t border-line flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-surface-3 px-5 py-2.5 text-sm font-medium hover:bg-surface-3/80 transition-transform active:scale-95"
        >
          Close
        </button>
        <button
          type="button"
          onClick={() => {
            unlockAudio();
            onClose();
            onStart();
          }}
          className="inline-flex items-center gap-2 rounded-full bg-work px-5 py-2.5 text-sm font-medium text-on-color shadow-md hover:opacity-95 transition-transform active:scale-95"
        >
          <Play className="size-4 fill-current" />
          Start workout
        </button>
      </div>
    </dialog>
  );
}
