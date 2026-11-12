import type { ItemType, Workout } from "@/features/workouts/types";

export type PhaseType = "prepare" | "round-rest" | ItemType;

export interface Phase {
  type: PhaseType;
  label: string;
  duration: number; // seconds
  round: number; // 0 for prepare, 1-based for rounds
}

export function buildPhases(workout: Workout): Phase[] {
  const phases: Phase[] = [];
  if (workout.prepare && workout.prepare.enabled) {
    phases.push({
      type: "prepare",
      label: "Get ready",
      duration: workout.prepare.duration,
      round: 0,
    });
  }

  const rounds = workout.rounds ?? 1;
  const items = workout.items ?? [];
  const roundRest = workout.roundRest;
  const skipLastRest = workout.skipLastRest ?? true;

  for (let r = 1; r <= rounds; r++) {
    for (const item of items) {
      phases.push({
        type: item.type,
        label: item.label,
        duration: item.duration,
        round: r,
      });
    }

    if (roundRest && roundRest.enabled && r < rounds) {
      phases.push({
        type: "round-rest",
        label: "Round rest",
        duration: roundRest.duration,
        round: r,
      });
    }
  }

  if (skipLastRest && phases.length > 0) {
    const last = phases[phases.length - 1];
    if (last.type === "rest" || last.type === "round-rest") {
      phases.pop();
    }
  }

  return phases;
}

export function getTotalSeconds(workout: Workout): number {
  const phases = buildPhases(workout);
  return phases.reduce((sum, p) => sum + p.duration, 0);
}
