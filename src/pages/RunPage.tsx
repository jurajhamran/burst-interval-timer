import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Navigate, useBlocker } from "@tanstack/react-router";
import { TimerScreen } from "@/features/timer/components/TimerScreen";
import { useTimerStore } from "@/features/timer/store";
import { useWorkoutsStore } from "@/features/workouts/store";
import { useHistoryStore } from "@/features/history/store";
import { getTotalSeconds } from "@/features/timer/engine";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

export function RunPage() {
  const params = useParams({ strict: false }) as { id?: string };
  const navigate = useNavigate();
  const workouts = useWorkoutsStore((s) => s.workouts);
  const finished = useTimerStore((s) => s.finished);
  const addEntry = useHistoryStore((s) => s.addEntry);
  const loggedRef = useRef(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const id = params.id;
  const workout = id ? workouts.find((w) => w.id === id) ?? null : null;

  useDocumentTitle(workout?.name);

  const blocker = useBlocker({
    shouldBlockFn: () => !finished,
    withResolver: true,
  });

  useEffect(() => {
    if (finished && !loggedRef.current && workout) {
      loggedRef.current = true;
      addEntry({
        id: crypto.randomUUID(),
        workoutId: workout.id,
        workoutName: workout.name,
        completedAt: Date.now(),
        durationSeconds: getTotalSeconds(workout),
        rounds: workout.rounds,
      });
    }
  }, [finished, workout, addEntry]);

  useEffect(() => {
    return () => {
      useTimerStore.setState(useTimerStore.getInitialState());
    };
  }, []);

  useEffect(() => {
    if (blocker.status === "blocked") {
      setConfirmOpen(true);
    }
  }, [blocker.status]);

  if (!id || !workout) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <TimerScreen
        workout={workout}
        onExit={() => navigate({ to: "/", replace: true })}
      />
      <ConfirmDialog
        open={confirmOpen || blocker.status === "blocked"}
        title="Stop workout?"
        description="Your progress in this session will be lost."
        confirmLabel="Stop"
        cancelLabel="Keep going"
        onConfirm={() => {
          setConfirmOpen(false);
          blocker.proceed?.();
        }}
        onCancel={() => {
          setConfirmOpen(false);
          blocker.reset?.();
        }}
      />
    </>
  );
}