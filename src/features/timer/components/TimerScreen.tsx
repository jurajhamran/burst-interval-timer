import { useEffect, useRef } from "react";
import { formatDuration } from "@/lib/format";
import type { Workout } from "@/features/workouts/types";
import { Controls } from "./Controls";
import { ProgressRing } from "./ProgressRing";
import { useTimerStore } from "../store";
import { useTimerLoop } from "../hooks/useTimerLoop";
import { useWakeLock } from "../hooks/useWakeLock";
import { cueCountdown, cuePhaseStart, cueFinish } from "../cues";
import { PHASE_ICONS } from "../phaseIcons";

export function TimerScreen({
  workout,
  onExit,
}: {
  workout: Workout;
  onExit: () => void;
}) {
  useTimerLoop();
  useWakeLock();

  const start = useTimerStore((s) => s.start);
  const toggle = useTimerStore((s) => s.toggle);
  const skip = useTimerStore((s) => s.skip);
  const running = useTimerStore((s) => s.running);
  const finished = useTimerStore((s) => s.finished);
  const phases = useTimerStore((s) => s.phases);
  const index = useTimerStore((s) => s.index);
  const remainingMs = useTimerStore((s) => s.remainingMs);

  const prevIndexRef = useRef<number>(-1);
  const lastBeepSecRef = useRef<number | null>(null);

  useEffect(() => {
    start(workout);
  }, [workout, start]);

  const currentPhase = phases[index];
  const nextPhase = phases[index + 1];
  const isPrepare = currentPhase?.type === "prepare";
  const isWork = currentPhase?.type === "work";
  const isRoundRest = currentPhase?.type === "round-rest";

  const remainingSecs = Math.ceil(remainingMs / 1000);
  const totalDurationMs = (currentPhase?.duration ?? 1) * 1000;
  const progress = currentPhase ? Math.max(0, Math.min(1, remainingMs / totalDurationMs)) : 0;

  // Handle audio beeps
  useEffect(() => {
    if (!running || finished || !currentPhase) return;

    if (prevIndexRef.current !== index) {
      prevIndexRef.current = index;
      lastBeepSecRef.current = null;
      // Long beep when a new phase starts
      cuePhaseStart();
    }

    // Countdown beeps at 3, 2, 1 seconds remaining
    if (
      remainingSecs <= 3 &&
      remainingSecs > 0 &&
      lastBeepSecRef.current !== remainingSecs
    ) {
      lastBeepSecRef.current = remainingSecs;
      cueCountdown();
    }
  }, [running, finished, index, remainingSecs, currentPhase]);

  // Finished triple beep
  useEffect(() => {
    if (finished) {
      cueFinish();
    }
  }, [finished]);

  if (finished) {
    return (
      <div className="fixed inset-0 z-30 flex flex-col items-center justify-between overflow-y-auto px-6 pb-8 pt-[calc(3rem+env(safe-area-inset-top))] bg-surface text-fg text-center">
        <div className="my-auto space-y-4">
          <h1 className="text-4xl font-bold">Done!</h1>
          <p className="text-muted">Great job completing {workout.name}</p>
        </div>
        <div className="w-full pb-[env(safe-area-inset-bottom)]">
          <button
            type="button"
            onClick={onExit}
            className="w-full max-w-sm py-4 rounded-full bg-accent text-on-accent font-semibold text-base shadow-lg hover:opacity-90 transition-opacity"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  if (!currentPhase) return null;

  const bgClass = isPrepare
    ? "bg-prepare/15 text-prepare"
    : isWork
    ? "bg-work/15 text-work"
    : isRoundRest
    ? "bg-break/15 text-break"
    : "bg-rest/15 text-rest";

  const Icon = PHASE_ICONS[currentPhase.type];

  return (
    <div className={`fixed inset-0 z-30 flex flex-col ${bgClass}`}>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-8 pt-[calc(1.5rem+env(safe-area-inset-top))]">
      <header className="text-center text-fg">
        <p className="text-sm text-fg/60">{workout.name}</p>
        <p className="mt-1 text-lg font-semibold">
          {isPrepare
            ? "Get ready"
            : isRoundRest
            ? `Round ${currentPhase.round} complete`
            : `Round ${currentPhase.round} / ${workout.rounds}`}
        </p>
      </header>

      <main className="flex min-h-0 flex-1 flex-col justify-center gap-8">
        <ProgressRing progress={progress}>
          <div className="text-center">
            <Icon className="mx-auto mb-2 size-7" aria-hidden />
            <p className="text-sm font-semibold uppercase tracking-[0.3em]">
              {currentPhase.label}
            </p>
            <p className="mt-2 text-7xl font-bold tabular-nums text-fg">
              {formatDuration(remainingSecs)}
            </p>
          </div>
        </ProgressRing>

        <p className="text-center text-sm text-fg/60">
          Next:{" "}
          <span className="font-medium text-fg">
            {nextPhase ? nextPhase.label : "Finish"}
          </span>
        </p>
      </main>

      <div className="text-fg pb-[env(safe-area-inset-bottom)]">
        <Controls
          running={running}
          onToggle={toggle}
          onSkip={skip}
          onStop={onExit}
        />
      </div>
      </div>
    </div>
  );
}
