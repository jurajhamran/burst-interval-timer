import { Pause, Play, SkipForward, Square } from "lucide-react";

interface Props {
  running: boolean;
  onToggle: () => void;
  onSkip: () => void;
  onStop: () => void;
}

const side =
  "grid size-14 place-items-center rounded-full bg-fg/10 active:bg-fg/20";

export function Controls({ running, onToggle, onSkip, onStop }: Props) {
  return (
    <div className="flex items-center justify-center gap-6">
      <button aria-label="Stop" onClick={onStop} className={side}>
        <Square className="size-5 fill-current" />
      </button>
      <button
        aria-label={running ? "Pause" : "Resume"}
        onClick={onToggle}
        className="grid size-20 place-items-center rounded-full bg-fg text-surface active:scale-95"
      >
        {running ? (
          <Pause className="size-8 fill-current" />
        ) : (
          <Play className="size-8 fill-current" />
        )}
      </button>
      <button aria-label="Skip" onClick={onSkip} className={side}>
        <SkipForward className="size-5 fill-current" />
      </button>
    </div>
  );
}
