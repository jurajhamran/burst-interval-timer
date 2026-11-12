import { Play, Pencil, Eye, Clock, Repeat, Flame, Wind } from "lucide-react";
import { formatDuration } from "@/lib/format";
import { unlockAudio } from "@/lib/audio";
import { getTotalSeconds } from "@/features/timer/engine";
import type { Workout } from "../types";

export function WorkoutCard({
  workout,
  onStart,
  onEdit,
  onPreview,
}: {
  workout: Workout;
  onStart: () => void;
  onEdit?: () => void;
  onPreview?: () => void;
}) {
  const total = getTotalSeconds(workout);
  const workCount = workout.items.filter((i) => i.type === "work").length;
  const restCount = workout.items.length - workCount;

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-line bg-surface-2 p-5 transition-all duration-300 hover:border-accent/50 hover:shadow-xl shadow-sm flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-3 px-2.5 py-0.5 text-xs font-semibold text-muted">
              <Repeat className="size-3" aria-hidden />
              {workout.rounds} {workout.rounds === 1 ? "round" : "rounds"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-3 px-2.5 py-0.5 text-xs font-semibold text-muted">
              <Clock className="size-3" aria-hidden />
              {formatDuration(total)}
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-fg truncate">
            {workout.name}
          </h2>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            unlockAudio();
            onStart();
          }}
          aria-label={`Start ${workout.name}`}
          className="flex items-center gap-2 rounded-2xl bg-accent px-5 py-3 text-on-accent font-semibold transition-transform active:scale-95 shadow-md hover:opacity-95 shrink-0"
        >
          <Play className="size-4 fill-current" />
          <span>Start</span>
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-surface-3 p-0.5">
          {workout.items.map((i, idx) => (
            <span
              key={idx}
              className={`h-full flex-1 rounded-full ${
                i.type === "work" ? "bg-work" : "bg-rest"
              }`}
            />
          ))}
        </div>
        <div className="flex flex-wrap justify-between items-center text-xs font-medium text-muted gap-2">
          <span className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-work font-semibold">
              <Flame className="size-3.5" aria-hidden />
              {workCount} work
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1 text-rest font-semibold">
              <Wind className="size-3.5" aria-hidden />
              {restCount} rest
            </span>
          </span>
          {workout.prepare?.enabled && (
            <span className="text-prepare font-medium">
              Prep {formatDuration(workout.prepare.duration)}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-line/60">
        <div className="flex items-center gap-1">
          {onPreview && (
            <button
              type="button"
              onClick={(e) => {
              e.stopPropagation();
              onPreview?.();
            }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-surface-3 px-3 py-1.5 text-xs font-medium text-muted hover:text-fg hover:bg-surface-3/80 transition-transform active:scale-95"
            >
              <Eye className="size-3.5" aria-hidden />
              Preview timeline
            </button>
          )}
        </div>
        {onEdit && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-surface-3 px-3 py-1.5 text-xs font-medium text-muted hover:text-fg hover:bg-surface-3/80 transition-transform active:scale-95"
          >
            <Pencil className="size-3.5" aria-hidden />
            Edit workout
          </button>
        )}
      </div>
    </div>
  );
}
