import type { Workout } from "@/features/workouts/types";

export function makeWorkout(overrides?: Partial<Workout>): Workout {
  const base: Workout = {
    id: "w1",
    name: "Test",
    rounds: 2,
    items: [
      { id: "a", type: "work", label: "Work", duration: 20 },
      { id: "b", type: "rest", label: "Rest", duration: 10 },
    ],
    prepare: { enabled: false, duration: 5 },
    roundRest: { enabled: false, duration: 30 },
    skipLastRest: false,
  };
  return { ...base, ...overrides, items: overrides?.items ?? base.items };
}