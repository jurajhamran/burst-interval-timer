import { useEffect, useMemo, useRef, useState } from "react";
import { Trophy } from "lucide-react";
import { formatDuration } from "@/lib/format";
import type { Workout } from "@/features/workouts/types/types";
import { Controls } from "./Controls";
import { ProgressRing } from "./ProgressRing";
import { useTimerStore } from "../store";
import { useTimerLoop } from "../hooks/useTimerLoop";
import { useWakeLock } from "../hooks/useWakeLock";
import { useFinishConfetti } from "../hooks/useFinishConfetti";
import { useSettingsStore } from "@/features/settings/store";
import { cueCountdown, cuePhaseStart, cueFinish } from "../cues";
import { PHASE_ICONS } from "../phaseIcons";
import { pickFinishMessage } from "../finishMessages";

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
  const previous = useTimerStore((s) => s.previous);
  const running = useTimerStore((s) => s.running);
  const finished = useTimerStore((s) => s.finished);
  const phases = useTimerStore((s) => s.phases);
  const index = useTimerStore((s) => s.index);
  const remainingMs = useTimerStore((s) => s.remainingMs);

  const confettiEnabled = useSettingsStore((s) => s.confettiEnabled);
  const countdownSoundEnabled = useSettingsStore(
    (s) => s.countdownSoundEnabled,
  );
  useFinishConfetti(finished && confettiEnabled);

  const finishMessage = useMemo(
    () => (finished ? pickFinishMessage() : null),
    [finished],
  );

  const prevIndexRef = useRef<number>(-1);
  const lastBeepSecRef = useRef<number | null>(null);
  const finishHeadingRef = useRef<HTMLHeadingElement>(null);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    start(workout);
  }, [workout, start]);

  const currentPhase = phases[index];
  const nextPhase = phases[index + 1];
  const rounds = workout.rounds;
  const isPrepare = currentPhase?.type === "prepare";
  const isWork = currentPhase?.type === "work";
  const isRoundRest = currentPhase?.type === "round-rest";

  const remainingSecs = Math.ceil(remainingMs / 1000);
  const remainingAfterCurrentSecs = phases
    .slice(index + 1)
    .reduce((sum, phase) => sum + phase.duration, 0);
  const sessionRemainingSecs = Math.ceil(
    (remainingMs + remainingAfterCurrentSecs * 1000) / 1000,
  );
  const totalDurationMs = (currentPhase?.duration ?? 1) * 1000;
  const progress = currentPhase ? Math.max(0, Math.min(1, remainingMs / totalDurationMs)) : 0;

  // Screen reader announcement when a new phase starts
  useEffect(() => {
    if (finished || !currentPhase) return;

    const roundLabel =
      currentPhase.type === "prepare"
        ? "Get ready"
        : currentPhase.type === "round-rest"
          ? `Round ${currentPhase.round} complete`
          : `Round ${currentPhase.round} of ${rounds}`;

    setAnnouncement(
      `${roundLabel}. ${currentPhase.label}, ${currentPhase.duration} seconds.`,
    );
  }, [index, currentPhase, finished, rounds]);

  // Screen reader countdown at 3, 2, 1 seconds remaining
  useEffect(() => {
    if (!running || finished || !currentPhase) return;
    if (remainingSecs > 0 && remainingSecs <= 3) {
      setAnnouncement(`${remainingSecs}`);
    }
  }, [remainingSecs, running, finished, currentPhase]);

  // Move focus to the finish heading so it is announced
  useEffect(() => {
    if (finished) finishHeadingRef.current?.focus();
  }, [finished]);

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
      cueCountdown(countdownSoundEnabled);
    }
  }, [running, finished, index, remainingSecs, currentPhase, countdownSoundEnabled]);

  // Finished triple beep
  useEffect(() => {
    if (finished) {
      cueFinish();
    }
  }, [finished]);

  if (finished && finishMessage) {
    return (
      <div className="fixed inset-0 z-30 flex flex-col items-center justify-between overflow-y-auto px-6 pb-8 pt-[calc(3rem+env(safe-area-inset-top))] bg-surface text-fg text-center">
        <div className="my-auto space-y-4">
          <Trophy className="mx-auto size-12 text-brand" aria-hidden />
          <h1
            ref={finishHeadingRef}
            tabIndex={-1}
            aria-describedby="finish-subtitle"
            className="text-4xl font-bold outline-none"
          >
            {finishMessage.title}
          </h1>
          <p id="finish-subtitle" className="text-muted-foreground">
            {finishMessage.subtitle(workout.name)}
          </p>
        </div>
        <div className="w-full pb-[env(safe-area-inset-bottom)]">
          <button
            type="button"
            onClick={onExit}
            className="w-full max-w-sm py-4 rounded-full bg-brand text-on-accent font-semibold text-base shadow-lg hover:opacity-90 transition-opacity"
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
    <div className={`fixed inset-0 z-30 flex flex-col transition-colors duration-300 ${bgClass}`}>
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement}
      </div>
      <div className="timer-layout mx-auto w-full max-w-md flex-1 px-6 pb-8 pt-[calc(1.5rem+env(safe-area-inset-top))]">
        <header className="timer-header text-center text-fg">
          <p className="line-clamp-2 px-2 text-sm break-words text-balance [overflow-wrap:anywhere] text-fg/60">
            {workout.name}
          </p>
          <p className="mt-1 flex flex-wrap items-center justify-center gap-x-2 text-lg font-semibold">
            <span>
              {isPrepare
                ? "Get ready"
                : isRoundRest
                ? `Round ${currentPhase.round} complete`
                : `Round ${currentPhase.round} / ${workout.rounds}`}
            </span>
            <span className="text-xs font-medium tabular-nums text-fg/60">
              {formatDuration(sessionRemainingSecs)} left
            </span>
          </p>
        </header>

        <div className="timer-stage">
          <ProgressRing progress={progress} className="timer-ring">
            <div className="timer-ring-content text-center">
              <Icon className="mx-auto mb-2 size-7" aria-hidden />
              <p
                className="timer-phase-label text-sm font-semibold uppercase leading-tight tracking-[0.2em] text-balance"
                title={currentPhase.label}
              >
                {currentPhase.label}
              </p>
              <p className="timer-countdown mt-2 text-7xl font-bold tabular-nums text-fg">
                {formatDuration(remainingSecs)}
              </p>
            </div>
          </ProgressRing>

          <p className="timer-next text-center text-sm text-fg/60">
            Next:{" "}
            <span className="font-medium text-fg">
              {nextPhase ? nextPhase.label : "Finish"}
            </span>
          </p>
        </div>

        <div className="timer-controls-wrap text-fg pb-[env(safe-area-inset-bottom)]">
          <Controls
            running={running}
            canPrevious={index > 0}
            onToggle={toggle}
            onPrevious={previous}
            onSkip={skip}
            onStop={onExit}
          />
        </div>
      </div>
    </div>
  );
}
