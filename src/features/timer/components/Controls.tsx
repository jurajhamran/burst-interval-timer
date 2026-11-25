import { Pause, Play, SkipBack, SkipForward } from "lucide-react";

interface Props {
  running: boolean;
  canPrevious: boolean;
  onToggle: () => void;
  onPrevious: () => void;
  onSkip: () => void;
}

const side =
  "timer-control-side grid size-14 place-items-center rounded-full bg-fg/10 active:bg-fg/20 disabled:pointer-events-none disabled:opacity-40";

export function Controls({
  running,
  canPrevious,
  onToggle,
  onPrevious,
  onSkip,
}: Props) {
  return (
    <div className="timer-controls flex items-center justify-center gap-6">
      <button
        aria-label="Previous"
        onClick={onPrevious}
        disabled={!canPrevious}
        className={side}
      >
        <SkipBack className="size-5 fill-current" />
      </button>
      <button
        aria-label={running ? "Pause" : "Resume"}
        onClick={onToggle}
        className="timer-control-main grid size-20 place-items-center rounded-full bg-fg text-surface active:scale-95"
      >
        {running ? (
          <Pause className="size-8 fill-current" />
        ) : (
          <Play className="size-8 fill-current" />
        )}
      </button>
      <button aria-label="Next" onClick={onSkip} className={side}>
        <SkipForward className="size-5 fill-current" />
      </button>
    </div>
  );
}
