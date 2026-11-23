import {
  X,
  Play,
  Clock,
  Repeat,
  Flame,
  Wind,
  Coffee,
  Hourglass,
} from "lucide-react";
import { formatDuration } from "@/lib/format";
import { buildPhases, getTotalSeconds } from "@/features/timer/engine";
import { unlockAudio } from "@/lib/audio";
import type { Workout } from "@/features/workouts/types/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

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
  if (!workout || !open) return null;

  const phases = buildPhases(workout);
  const total = getTotalSeconds(workout);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-w-sm w-full">
        <DialogHeader>
          <div>
            <DialogTitle>{workout.name}</DialogTitle>
            <div className="mt-1.5 flex items-center gap-3 text-sm text-muted-foreground">
              <Badge variant="secondary" className="gap-1">
                <Repeat className="size-4" aria-hidden />
                {workout.rounds} rounds
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Clock className="size-4" aria-hidden />
                {formatDuration(total)} total
              </Badge>
            </div>
          </div>
          <DialogClose
            onClick={onClose}
            className="size-9 rounded-full bg-surface-3 flex items-center justify-center text-muted-foreground hover:text-fg transition-transform active:scale-95"
          >
            <X className="size-5" />
          </DialogClose>
        </DialogHeader>

        <div className="my-4 flex-1 overflow-y-auto space-y-2.5 pr-1">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Timeline ({phases.length} phases)
          </h3>
          {phases.map((phase, idx) => {
            const isWork = phase.type === "work";
            const isPrepare = phase.type === "prepare";
            const isRoundRest = phase.type === "round-rest";

            return (
              <div
                key={idx}
                className="flex items-center justify-between gap-14 lg:gap-16 xl:gap-18 rounded-xl border border-line bg-surface p-3 transition-colors"
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
                    <p className="truncate font-medium text-sm">
                      {phase.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
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

        <DialogFooter>
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
            Start
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
